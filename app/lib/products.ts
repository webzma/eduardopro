import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
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
  stock: number;
  image: string;
  active: boolean;
  created_at?: string;
};

const TABLE = "products";

let cached: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase no está configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local (ver README).",
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

function toProduct(row: Row): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    stock: Number(row.stock),
    image: row.image,
    active: row.active,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\x00-\x7f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await db()
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toProduct(row as Row));
}

// Público: nunca debe tumbar el sitio si la base falla o no está configurada.
export async function getActiveProducts(): Promise<Product[]> {
  try {
    const { data, error } = await db()
      .from(TABLE)
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
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
  const { data, error } = await db()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProduct(data as Row) : null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data: rows, error: readError } = await db()
    .from(TABLE)
    .select("id");
  if (readError) throw new Error(readError.message);
  const taken = new Set((rows ?? []).map((row) => (row as { id: string }).id));

  const base = slugify(input.name) || "producto";
  let id = base;
  let n = 1;
  while (taken.has(id)) {
    id = `${base}-${++n}`;
  }

  const { data, error } = await db()
    .from(TABLE)
    .insert({ id, ...input })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toProduct(data as Row);
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>,
): Promise<Product | null> {
  const { data, error } = await db()
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProduct(data as Row) : null;
}

export async function adjustStock(
  id: string,
  delta: number,
): Promise<Product | null> {
  const current = await getProduct(id);
  if (!current) return null;
  const stock = Math.max(0, current.stock + delta);
  return updateProduct(id, { stock });
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await db().from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
