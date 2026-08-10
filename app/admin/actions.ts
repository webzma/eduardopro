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
  verifyPassword,
  type Role,
} from "../lib/auth";
import { createAuthUser, grantStaff, revokeStaff } from "../lib/staff";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getProduct,
  slugify,
  type ProductInput,
} from "../lib/products";
import { readCategory } from "../lib/categories";
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

/* `keepCategory` es la categoría que el producto ya tenía: readCategory la
 * respeta aunque no esté en la lista, para no borrarle la categoría a los
 * productos de antes del selector solo por guardar otro campo. */
function readForm(
  formData: FormData,
  keepCategory?: string,
): Omit<ProductInput, "image"> {
  return {
    name: String(formData.get("name") ?? "").trim(),
    category: readCategory(String(formData.get("category") ?? ""), keepCategory),
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
  /* El rol elegido en el formulario es una DECLARACIÓN DE INTENCIÓN, no un
   * permiso. Quién es admin y quién vendedor lo dice public.staff, y las
   * políticas RLS aplican eso mismo en la base: marcar "Administrador" aquí no
   * da un solo permiso extra. Sirve para dos cosas honestas —que cada uno vea
   * de entrada la pantalla que espera, y que un error de cuenta se detecte al
   * entrar en vez de tres pantallas más adelante. */
  const raw = String(formData.get("rol") ?? "");
  const intended = raw === "admin" || raw === "vendedor" ? raw : null;
  // El rol elegido viaja de vuelta en el error para que el selector no se
  // reinicie cada vez que alguien se equivoca de contraseña.
  const back = intended ? `&rol=${intended}` : "";
  if (!email || !password) redirect(`/admin/login?error=campos${back}`);

  const error = await signIn(email, password);
  if (error) redirect(`/admin/login?error=credenciales${back}`);

  // Entrar no basta: si la cuenta no está en public.staff, RLS le negaría todo
  // de todas formas. Mejor decirlo aquí que dejarle un panel vacío.
  const role = await getRole(await getUser());
  if (!role) {
    await signOut();
    redirect(`/admin/login?error=noacceso${back}`);
  }

  // La cuenta es válida pero no es lo que la persona creía ser. Se cierra la
  // sesión y se dice cuál es su rol de verdad: dejarla entrar «por si acaso»
  // convertiría el selector en decorado.
  if (intended && role !== intended) {
    await signOut();
    redirect(`/admin/login?error=rol&suyo=${role}${back}`);
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
  /** Identifica el renglón en el formulario. Es lo que permite emparejar cada
   *  foto —que viaja como archivo suelto, fuera del JSON— con su producto. */
  key?: string;
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

        // La foto es opcional: sin ella el producto nace con el marcador de
        // posición, igual que antes. Si la subida falla, el catch de abajo
        // deshace los productos ya creados en esta misma compra.
        const file = item.key ? formData.get(`imagen-${item.key}`) : null;
        const image =
          file instanceof File && file.size > 0
            ? await uploadProductImage(file, slugify(name))
            : PLACEHOLDER;

        const product = await createProduct({
          name,
          category: readCategory(String(item.category ?? "")),
          price: salePrice ?? 0,
          cost: unitCost,
          stock: 0, // lo suma la compra, en la misma transacción
          image,
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
  const fields = readForm(formData, existing?.category);
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

/* ── Equipo ──────────────────────────────────────────────────────────────
 *
 * Repartir permisos es lo más delicado que hace este panel, así que las dos
 * acciones piden la contraseña del propio admin además de su sesión. La sesión
 * dice quién eres; la contraseña dice que sigues siendo tú y no alguien que se
 * sentó en tu silla con el panel abierto.
 *
 * Ninguna contraseña viaja en un redirect ni se registra en ningún sitio: los
 * errores salen por ?error= y solo llevan el motivo. */

function staffError(code: string, detalle?: string): never {
  const extra = detalle ? `&detalle=${encodeURIComponent(detalle)}` : "";
  redirect(`/admin/ajustes?error=${code}${extra}#equipo`);
}

export async function createStaffAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rawRole = String(formData.get("rol") ?? "vendedor");
  const role: Role = rawRole === "admin" ? "admin" : "vendedor";
  const confirm = String(formData.get("confirmacion") ?? "");

  if (!email.includes("@")) staffError("correo");
  if (password.length < 8) staffError("clave");
  if (!(await verifyPassword(user.email ?? "", confirm))) {
    staffError("confirmacion");
  }

  let userId: string;
  try {
    userId = await createAuthUser(email, password);
  } catch (err) {
    unstable_rethrow(err);
    staffError("cuenta", (err as Error).message);
  }

  try {
    await grantStaff(userId, role, email);
  } catch (err) {
    unstable_rethrow(err);
    // La cuenta quedó creada pero sin rol: no puede entrar a ninguna parte
    // (RLS depende de staff), y se arregla dándole el rol desde la lista. Se
    // dice tal cual en vez de fingir que no pasó nada.
    staffError(
      "rol",
      `La cuenta de ${email} se creó, pero no se le pudo dar el rol: ${(err as Error).message}. Dáselo desde la lista del equipo.`,
    );
  }

  revalidatePath("/admin/ajustes");
  redirect("/admin/ajustes?ok=equipo#equipo");
}

export async function revokeStaffAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const confirm = String(formData.get("confirmacion") ?? "");
  if (!userId) staffError("nadie");
  if (!(await verifyPassword(user.email ?? "", confirm))) {
    staffError("confirmacion");
  }

  try {
    await revokeStaff(userId);
  } catch (err) {
    unstable_rethrow(err);
    staffError("baja", (err as Error).message);
  }

  revalidatePath("/admin/ajustes");
  redirect("/admin/ajustes?ok=baja#equipo");
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
