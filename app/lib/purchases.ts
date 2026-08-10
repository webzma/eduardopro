import { createClient } from "./supabase/server";
import { fail } from "./supabase/config";
import { cleanSearch } from "./search";

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

/* La lista sin paginar (getPurchases) se fue con esto: al pasar la pantalla a
 * getPurchasesPage se quedó sin usar, y una función muerta al lado de la viva
 * es una trampa — antes o después alguien arregla la copia equivocada. */

export type PurchasesFilter = {
  /** Texto libre. Se busca en el NOMBRE DE PRODUCTO de los renglones. */
  search?: string;
  /** ISO desde el que contar (incluido). */
  sinceIso?: string | null;
  /** ISO hasta el que contar (excluido). */
  untilIso?: string | null;
};

export type PurchasesPage = {
  /** Solo las compras de esta página. */
  purchases: Purchase[];
  /** Compras que casan con el filtro, no las de esta página. */
  total: number;
  totalUsd: number;
  units: number;
  /** true si el filtro devuelve más de las que se pueden sumar de una vez. */
  capped: boolean;
  page: number;
  pages: number;
};

/* Tope de lo que se recorre para contar y sumar. Por debajo, los totales del
 * filtro son EXACTOS; por encima, la pantalla lo dice en vez de enseñar una
 * suma parcial como si fuera el total. El mismo trato que en Ventas. */
const SCAN_CAP = 2000;

/**
 * Una página de compras, con cuántas hay y cuánto suman TODAS las que casan.
 *
 * Son dos consultas por lo mismo que en Ventas: buscar por nombre de producto
 * obliga a un join interno, y entonces PostgREST devuelve solo los renglones
 * que casan — la compra saldría con un producto en vez de sus cuatro. La
 * primera consulta se queda con los identificadores; la segunda trae completas
 * las de esta página.
 */
export async function getPurchasesPage(
  filter: PurchasesFilter,
  page: number,
  perPage: number,
): Promise<PurchasesPage> {
  const supabase = await createClient();
  const search = cleanSearch(filter.search ?? "");

  // El nombre viaja copiado en el renglón, así que se encuentran también las
  // compras de productos que ya no están en el catálogo.
  const scanSelect: string = search
    ? "id, total_usd, purchase_items!inner(qty, product_name)"
    : "id, total_usd, purchase_items(qty)";

  let scan = supabase
    .from("purchases")
    .select(scanSelect, { count: "exact" })
    .order("bought_at", { ascending: false })
    .limit(SCAN_CAP);
  if (filter.sinceIso) scan = scan.gte("bought_at", filter.sinceIso);
  if (filter.untilIso) scan = scan.lt("bought_at", filter.untilIso);
  if (search) scan = scan.ilike("purchase_items.product_name", `%${search}%`);

  const { data, count, error } = await scan;
  if (error) fail(error);

  const rows = (data ?? []) as unknown as {
    id: string;
    total_usd: number | string;
    purchase_items: { qty: number }[] | null;
  }[];

  // count es exacto aunque el limit recorte lo devuelto: lo cuenta la base.
  const total = count ?? rows.length;
  const pages = Math.max(1, Math.ceil(Math.min(total, SCAN_CAP) / perPage));
  const current = Math.min(Math.max(1, page), pages);
  const slice = rows.slice((current - 1) * perPage, current * perPage);

  let totalUsd = 0;
  let units = 0;
  for (const row of rows) {
    totalUsd += Number(row.total_usd);
    for (const line of row.purchase_items ?? []) units += line.qty;
  }

  let purchases: Purchase[] = [];
  if (slice.length > 0) {
    const { data: full, error: fullError } = await supabase
      .from("purchases")
      .select(SELECT)
      .in(
        "id",
        slice.map((row) => row.id),
      )
      .order("bought_at", { ascending: false });
    if (fullError) fail(fullError);
    purchases = (full ?? []).map((row) => toPurchase(row as Row));
  }

  return {
    purchases,
    total,
    totalUsd,
    units,
    capped: total > SCAN_CAP,
    page: current,
    pages,
  };
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
