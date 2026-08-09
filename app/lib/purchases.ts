import { createClient } from "./supabase/server";
import { fail } from "./supabase/config";

export type PurchaseLine = {
  id: string;
  productId: string | null;
  productName: string;
  qty: number;
  unitCostUsd: number;
  salePriceUsd: number | null;
  /** Foto actual del producto; null si ya no está en el catálogo. */
  productImage: string | null;
};

export type Purchase = {
  id: string;
  boughtAt: string;
  buyerEmail: string | null;
  supplier: string | null;
  rate: number;
  rateSource: "bcv" | "manual";
  totalUsd: number;
  note: string | null;
  lines: PurchaseLine[];
};

/** Un renglón tal y como lo manda el formulario. */
export type CartLine = {
  productId: string;
  qty: number;
  unitCost: number;
  /** Precio de venta nuevo. Si se omite, el producto conserva el suyo. */
  salePrice?: number;
};

type Row = {
  id: string;
  bought_at: string;
  buyer_email: string | null;
  supplier: string | null;
  rate_usd_to_bs: number | string;
  rate_source: string;
  total_usd: number | string;
  note: string | null;
  purchase_items?: {
    id: string;
    product_id: string | null;
    product_name: string;
    qty: number;
    unit_cost_usd: number | string;
    sale_price_usd: number | string | null;
    products: { image: string } | null;
  }[];
};

function toPurchase(row: Row): Purchase {
  return {
    id: row.id,
    boughtAt: row.bought_at,
    buyerEmail: row.buyer_email,
    supplier: row.supplier,
    rate: Number(row.rate_usd_to_bs),
    rateSource: row.rate_source === "manual" ? "manual" : "bcv",
    totalUsd: Number(row.total_usd),
    note: row.note,
    lines: (row.purchase_items ?? []).map((line) => ({
      id: line.id,
      productId: line.product_id,
      productName: line.product_name,
      qty: line.qty,
      unitCostUsd: Number(line.unit_cost_usd),
      salePriceUsd:
        line.sale_price_usd === null ? null : Number(line.sale_price_usd),
      productImage: line.products?.image ?? null,
    })),
  };
}

const SELECT = "*, purchase_items(*, products(image))";

/* RLS ya restringe estas lecturas al admin; no hace falta —ni sería fiable—
 * filtrar aquí por rol. */

export async function getPurchases(limit = 100): Promise<Purchase[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .select(SELECT)
    .order("bought_at", { ascending: false })
    .limit(limit);
  if (error) fail(error);
  return (data ?? []).map((row) => toPurchase(row as Row));
}

export async function getPurchase(id: string): Promise<Purchase | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) fail(error);
  return data ? toPurchase(data as Row) : null;
}

/** Gasto en compras del mes en curso. Devuelve 0 si no eres admin: RLS
 *  simplemente no deja ver ninguna fila. */
export async function getMonthSpend(sinceIso: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .select("total_usd")
    .gte("bought_at", sinceIso);
  if (error) fail(error);
  return (data ?? []).reduce(
    (sum, row) => sum + Number((row as { total_usd: number }).total_usd),
    0,
  );
}

/**
 * Registra la compra: suma existencias, fija el último costo y, si se indicó,
 * el precio de venta — todo en una transacción dentro de la base. Es la
 * operación inversa a una venta y sigue la misma regla: no puede existir una
 * compra sin su entrada de stock.
 */
export async function registerPurchase(params: {
  lines: CartLine[];
  supplier?: string;
  rate: number;
  rateSource: "bcv" | "manual";
  note?: string;
}): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_purchase", {
    p_items: params.lines.map((line) => ({
      product_id: line.productId,
      qty: line.qty,
      unit_cost: line.unitCost,
      sale_price: line.salePrice ?? null,
    })),
    p_supplier: params.supplier ?? null,
    p_rate: params.rate,
    p_source: params.rateSource,
    p_note: params.note ?? null,
  });
  if (error) fail(error);
  return data as string;
}
