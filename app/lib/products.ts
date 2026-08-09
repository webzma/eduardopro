import { createClient } from "./supabase/server";
import { fail } from "./supabase/config";

export { SupabaseSetupError } from "./supabase/config";

export type Product = {
  id: string;
  name: string;
  category: string;
  /** Precio de VENTA en USD. */
  price: number;
  /** Último costo de COMPRA en USD. Lo fija cada compra registrada. */
  cost: number;
  stock: number;
  image: string;
  active: boolean;
};

export type ProductInput = Omit<Product, "id">;

type Row = {
  id: string;
  name: string;
  category: string;
  price: number | string;
  cost_usd?: number | string;
  stock: number;
  image: string;
  active: boolean;
  created_at?: string;
};

const TABLE = "products";

/* Todo lo de abajo pasa por la clave publicable, así que RLS decide qué se ve
 * y qué se puede tocar con la identidad de quien pide:
 *   · anónimo  → solo lee los productos con active = true
 *   · vendedor → lee todo y solo mueve stock, vía la función adjust_stock
 *   · admin    → lee todo y escribe sin límite
 * El rol sale de public.staff. No hay ninguna clave que ignore RLS en la
 * aplicación: las políticas de supabase/schema.sql son la autoridad y esto
 * solo es la capa de acceso. */

function toProduct(row: Row): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    cost: Number(row.cost_usd ?? 0),
    stock: Number(row.stock),
    image: row.image,
    active: row.active,
  };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\x00-\x7f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: true });
  if (error) fail(error);
  return (data ?? []).map((row) => toProduct(row as Row));
}

// Público: nunca debe tumbar el sitio si la base falla o no está configurada.
// El filtro active=true es redundante con RLS, y así queda: la política es la
// que manda, esto solo lo hace explícito en el sitio de la lectura.
export async function getActiveProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true });
    if (error) fail(error);
    return (data ?? []).map((row) => toProduct(row as Row));
  } catch (err) {
    console.warn(
      "[products] no se pudo leer el catálogo:",
      (err as Error).message,
    );
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) fail(error);
  return data ? toProduct(data as Row) : null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const supabase = await createClient();
  const { data: rows, error: readError } = await supabase
    .from(TABLE)
    .select("id");
  if (readError) fail(readError);
  const taken = new Set((rows ?? []).map((row) => (row as { id: string }).id));

  const base = slugify(input.name) || "producto";
  let id = base;
  let n = 1;
  while (taken.has(id)) {
    id = `${base}-${++n}`;
  }

  const { cost, ...rest } = input;
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ id, ...rest, cost_usd: cost })
    .select()
    .single();
  if (error) fail(error);
  return toProduct(data as Row);
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>,
): Promise<Product | null> {
  const supabase = await createClient();
  // `cost` en la aplicación es `cost_usd` en la base.
  const { cost, ...rest } = patch;
  const row = cost === undefined ? rest : { ...rest, cost_usd: cost };
  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) fail(error);
  return data ? toProduct(data as Row) : null;
}

/**
 * Va por la función adjust_stock de la base, no por un UPDATE. Dos razones:
 *   · El vendedor no tiene permiso de UPDATE sobre products — RLS es a nivel
 *     de fila y no sabe decir "solo la columna stock". La función sí, porque
 *     es lo único que escribe.
 *   · Es atómica: leer-y-luego-escribir dejaba que dos ventas simultáneas
 *     leyeran stock = 5 y ambas guardaran 4.
 */
export async function adjustStock(
  id: string,
  delta: number,
): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("adjust_stock", {
    p_id: id,
    p_delta: delta,
  });
  if (error) fail(error);
  return data ? toProduct(data as Row) : null;
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) fail(error);
}
