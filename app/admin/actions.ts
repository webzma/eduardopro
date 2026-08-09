"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import {
  getRole,
  getUser,
  requireAdmin,
  requireStaff,
  signIn,
  signOut,
} from "../lib/auth";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getProduct,
  slugify,
  type ProductInput,
} from "../lib/products";
import { uploadProductImage, removeProductImage } from "../lib/storage";
import { PLACEHOLDER } from "../lib/images";
import { registerSale, type CartItem } from "../lib/sales";
import { registerPurchase, type CartLine } from "../lib/purchases";
import { getRate } from "../lib/rate";
import { setFallbackRate } from "../lib/settings";

const PAYMENT_METHODS = [
  "usd_efectivo",
  "bs_efectivo",
  "pago_movil",
  "transferencia",
  "otro",
];

/* Cada acción declara su permiso en la primera línea. Es la última defensa de
 * la aplicación, no la única: aunque alguien llamara a una de estas saltándose
 * la UI, las políticas RLS de supabase/schema.sql la rechazarían igual. */

function readForm(formData: FormData): Omit<ProductInput, "image"> {
  return {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    price: Math.max(0, Number(formData.get("price") ?? 0)),
    // Normalmente lo fija cada compra registrada; el campo existe para poder
    // corregirlo a mano y para dar de alta productos que ya tenías.
    cost: Math.max(0, Number(formData.get("cost") ?? 0)),
    stock: Math.max(0, Math.trunc(Number(formData.get("stock") ?? 0))),
    active: formData.get("active") === "on",
  };
}

/**
 * Devuelve la ruta de la foto nueva, o null si no se eligió ninguna (el
 * formulario de edición manda un File vacío cuando no se toca el campo).
 */
async function readImage(
  formData: FormData,
  name: string,
): Promise<string | null> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return null;
  return uploadProductImage(file, slugify(name));
}

function refresh(): void {
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/admin/login?error=campos");

  const error = await signIn(email, password);
  if (error) redirect("/admin/login?error=credenciales");

  // Entrar no basta: si la cuenta no está en public.staff, RLS le negaría todo
  // de todas formas. Mejor decirlo aquí que dejarle un panel vacío.
  const role = await getRole(await getUser());
  if (!role) {
    await signOut();
    redirect("/admin/login?error=noacceso");
  }
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await signOut();
  redirect("/admin/login");
}

export type SaleFormState = { error?: string };

/**
 * Registrar una venta es lo que hace un vendedor todo el día, así que es suya
 * además del admin. La tasa NO viene del formulario: se resuelve aquí en el
 * servidor. Si el navegador la mandara, se podrían registrar ventas a una tasa
 * inventada y el histórico dejaría de valer.
 */
export async function registerSaleAction(
  _prev: SaleFormState,
  formData: FormData,
): Promise<SaleFormState> {
  await requireStaff();

  let items: CartItem[];
  try {
    const parsed = JSON.parse(String(formData.get("items") ?? "[]"));
    items = (Array.isArray(parsed) ? parsed : [])
      .map((item) => ({
        productId: String(item?.productId ?? ""),
        qty: Math.trunc(Number(item?.qty ?? 0)),
      }))
      .filter((item) => item.productId && item.qty > 0);
  } catch {
    return { error: "No se pudo leer la venta. Vuelve a intentarlo." };
  }
  if (items.length === 0) return { error: "Agrega al menos un producto." };

  const payment = String(formData.get("payment") ?? "");
  if (!PAYMENT_METHODS.includes(payment)) {
    return { error: "Elige un método de pago." };
  }

  const rate = await getRate();
  if (!rate) {
    return {
      error:
        "No hay tasa disponible. El BCV no responde y no hay respaldo manual: pídele al administrador que fije una en Ajustes.",
    };
  }

  let saleId: string;
  try {
    saleId = await registerSale({
      items,
      payment,
      rate: rate.value,
      rateSource: rate.source,
      note: String(formData.get("note") ?? ""),
    });
  } catch (err) {
    // La base rechaza por falta de stock con un mensaje ya redactado para
    // leerse ("Sin stock suficiente para …"), así que se muestra tal cual.
    return { error: (err as Error).message };
  }

  refresh();
  revalidatePath("/admin/ventas");
  redirect(`/admin/ventas/${saleId}?ok=1`);
}

export type PurchaseFormState = { error?: string };

type IncomingLine = {
  isNew?: boolean;
  productId?: string;
  name?: string;
  category?: string;
  qty?: number;
  unitCost?: number;
  salePrice?: number;
};

/**
 * Registrar una compra: suma existencias y fija el último costo. Solo admin —
 * obliga a ver costos y márgenes, justo lo que se le oculta al vendedor.
 *
 * Los productos nuevos se crean aquí antes de llamar a la función de la base,
 * porque la generación del identificador (slug único) vive en la aplicación.
 * Si la compra falla después, se deshacen: un producto recién creado no tiene
 * historial que perder, y dejarlo suelto ensuciaría el catálogo.
 */
export async function registerPurchaseAction(
  _prev: PurchaseFormState,
  formData: FormData,
): Promise<PurchaseFormState> {
  await requireAdmin();

  let incoming: IncomingLine[];
  try {
    const parsed = JSON.parse(String(formData.get("lines") ?? "[]"));
    incoming = Array.isArray(parsed) ? parsed : [];
  } catch {
    return { error: "No se pudo leer la compra. Vuelve a intentarlo." };
  }
  if (incoming.length === 0) return { error: "Agrega al menos un renglón." };

  const rate = await getRate();
  if (!rate) {
    return {
      error:
        "No hay tasa disponible. El BCV no responde y no hay respaldo manual: fija una en Ajustes.",
    };
  }

  const created: string[] = [];
  const lines: CartLine[] = [];

  try {
    for (const item of incoming) {
      const qty = Math.trunc(Number(item.qty ?? 0));
      const unitCost = Number(item.unitCost ?? 0);
      const salePrice =
        item.salePrice === undefined || item.salePrice === null
          ? undefined
          : Number(item.salePrice);

      if (qty <= 0) return { error: "Hay un renglón con cantidad inválida." };
      if (!Number.isFinite(unitCost) || unitCost < 0) {
        return { error: "Hay un renglón con costo inválido." };
      }

      if (item.isNew) {
        const name = String(item.name ?? "").trim();
        if (!name) return { error: "Los productos nuevos necesitan nombre." };
        const product = await createProduct({
          name,
          category: String(item.category ?? "").trim(),
          price: salePrice ?? 0,
          cost: unitCost,
          stock: 0, // lo suma la compra, en la misma transacción
          image: PLACEHOLDER,
          active: true,
        });
        created.push(product.id);
        lines.push({ productId: product.id, qty, unitCost, salePrice });
      } else {
        const productId = String(item.productId ?? "");
        if (!productId) return { error: "Hay un renglón sin producto." };
        lines.push({ productId, qty, unitCost, salePrice });
      }
    }

    const purchaseId = await registerPurchase({
      lines,
      supplier: String(formData.get("supplier") ?? ""),
      rate: rate.value,
      rateSource: rate.source,
      note: String(formData.get("note") ?? ""),
    });

    refresh();
    revalidatePath("/admin/compras");
    redirect(`/admin/compras/${purchaseId}?ok=1`);
  } catch (err) {
    // redirect() lanza a propósito. unstable_rethrow deja pasar los errores
    // internos de Next; sin él este catch se tragaría el éxito y además
    // borraría los productos recién creados.
    unstable_rethrow(err);
    for (const id of created) {
      try {
        await deleteProduct(id);
      } catch {
        // Si tampoco se puede deshacer, el producto queda con stock 0 y
        // visible en el inventario: recuperable a mano, nunca invisible.
      }
    }
    return { error: (err as Error).message };
  }
}

// La otra acción que un vendedor puede ejecutar: corregir existencias a mano
// (mermas, conteo). Recibir mercancía va por Compras.
export async function adjustStockAction(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const delta = Math.trunc(Number(formData.get("delta") ?? 0));
  await adjustStock(id, delta);
  refresh();
}

export async function createProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const fields = readForm(formData);
  if (!fields.name) redirect("/admin/inventario?error=nombre");

  let image: string;
  try {
    image = (await readImage(formData, fields.name)) ?? PLACEHOLDER;
  } catch (err) {
    redirect(
      `/admin/inventario?error=imagen&detalle=${encodeURIComponent((err as Error).message)}`,
    );
  }

  await createProduct({ ...fields, image });
  refresh();
  redirect("/admin/inventario?ok=creado");
}

export async function updateProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const existing = await getProduct(id);
  if (!existing) redirect("/admin/inventario?error=noexiste");
  const fields = readForm(formData);
  if (!fields.name) redirect(`/admin/inventario/${id}?error=nombre`);

  let image: string | null;
  try {
    image = await readImage(formData, fields.name);
  } catch (err) {
    redirect(
      `/admin/inventario/${id}?error=imagen&detalle=${encodeURIComponent((err as Error).message)}`,
    );
  }

  await updateProduct(id, { ...fields, image: image ?? existing!.image });
  // La anterior se borra DESPUÉS de guardar: si el update fallara, la foto
  // vieja seguiría siendo la buena y no puede haber desaparecido ya.
  if (image) await removeProductImage(existing!.image);

  refresh();
  redirect("/admin/inventario?ok=actualizado");
}

export async function toggleActiveAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  await updateProduct(id, { active });
  refresh();
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const existing = await getProduct(id);
  await deleteProduct(id);
  // El histórico de ventas guarda el nombre copiado, así que borrar la foto no
  // deja tickets rotos.
  if (existing) await removeProductImage(existing.image);
  refresh();
  redirect("/admin/inventario?ok=eliminado");
}

export async function setRateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const rate = Number(String(formData.get("rate") ?? "").replace(",", "."));
  if (!Number.isFinite(rate) || rate <= 0) {
    redirect("/admin/ajustes?error=tasa");
  }
  await setFallbackRate(rate);
  revalidatePath("/admin", "layout");
  redirect("/admin/ajustes?ok=tasa");
}
