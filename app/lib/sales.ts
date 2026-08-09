import { createClient } from "./supabase/server";
import { fail } from "./supabase/config";
import type { Role } from "./auth";
import { veStartOfDay, veStartOfMonth, veEndOfDay } from "./period";

export type SaleLine = {
  id: string;
  productId: string | null;
  productName: string;
  qty: number;
  unitPriceUsd: number;
  /** Costo congelado al vender. 0 si el producto no tenía costo registrado. */
  unitCostUsd: number;
  /**
   * Foto ACTUAL del producto, no una congelada. Es lo correcto aquí: al
   * reemplazar una foto se borra el archivo anterior, así que una ruta
   * guardada en la línea apuntaría a un archivo que ya no existe. El nombre y
   * el precio sí se congelan porque son hechos contables; la foto no lo es.
   * null si el producto se borró del catálogo.
   */
  productImage: string | null;
};

export type Sale = {
  id: string;
  soldAt: string;
  sellerEmail: string | null;
  /** Rol de quien vendió, congelado al registrar. null en ventas anteriores a
   *  que existiera la columna, o si esa persona ya no está en la plantilla. */
  sellerRole: Role | null;
  paymentMethod: string;
  rate: number;
  rateSource: "bcv" | "manual";
  totalUsd: number;
  note: string | null;
  lines: SaleLine[];
};

export type CartItem = { productId: string; qty: number };

type SaleRow = {
  id: string;
  sold_at: string;
  seller_email: string | null;
  seller_role: string | null;
  payment_method: string;
  rate_usd_to_bs: number | string;
  rate_source: string;
  total_usd: number | string;
  note: string | null;
  sale_items?: {
    id: string;
    product_id: string | null;
    product_name: string;
    qty: number;
    unit_price_usd: number | string;
    unit_cost_usd: number | string | null;
    products: { image: string } | null;
  }[];
};

function toSale(row: SaleRow): Sale {
  return {
    id: row.id,
    soldAt: row.sold_at,
    sellerEmail: row.seller_email,
    sellerRole:
      row.seller_role === "admin" || row.seller_role === "vendedor"
        ? row.seller_role
        : null,
    paymentMethod: row.payment_method,
    rate: Number(row.rate_usd_to_bs),
    rateSource: row.rate_source === "manual" ? "manual" : "bcv",
    totalUsd: Number(row.total_usd),
    note: row.note,
    lines: (row.sale_items ?? []).map((line) => ({
      id: line.id,
      productId: line.product_id,
      productName: line.product_name,
      qty: line.qty,
      unitPriceUsd: Number(line.unit_price_usd),
      unitCostUsd: Number(line.unit_cost_usd ?? 0),
      productImage: line.products?.image ?? null,
    })),
  };
}

const SELECT = "*, sale_items(*, products(image))";

/* RLS ya recorta por rol: el admin recibe todo y el vendedor solo lo suyo. No
 * hace falta —ni sería fiable— filtrar aquí por seller_id. */

export async function getSales(
  limit = 100,
  /** ISO desde el que contar. Omitido = sin límite inferior. */
  sinceIso?: string | null,
): Promise<Sale[]> {
  const supabase = await createClient();
  let q = supabase
    .from("sales")
    .select(SELECT)
    .order("sold_at", { ascending: false })
    .limit(limit);
  if (sinceIso) q = q.gte("sold_at", sinceIso);
  const { data, error } = await q;
  if (error) fail(error);
  return (data ?? []).map((row) => toSale(row as SaleRow));
}

export type MethodTotal = {
  method: string;
  count: number;
  totalUsd: number;
  /** Suma de cada venta a SU propia tasa, no a la de hoy: es el dinero que
   *  de verdad entró en caja. */
  totalBs: number;
};

export type DayClose = {
  dayStartIso: string;
  sales: Sale[];
  byMethod: MethodTotal[];
  totalUsd: number;
  totalBs: number;
  units: number;
};

/**
 * Cierre de un día. RLS lo recorta solo: el admin ve la caja entera y el
 * vendedor la suya, que es justo lo que necesita para cuadrar su turno.
 */
export async function getDayClose(day: Date): Promise<DayClose> {
  const from = veStartOfDay(day);
  const to = veEndOfDay(day);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales")
    .select(SELECT)
    .gte("sold_at", from.toISOString())
    .lt("sold_at", to.toISOString())
    .order("sold_at", { ascending: false });
  if (error) fail(error);

  const sales = (data ?? []).map((row) => toSale(row as SaleRow));
  const acc = new Map<string, MethodTotal>();
  let totalUsd = 0;
  let totalBs = 0;
  let units = 0;

  for (const sale of sales) {
    const bs = sale.totalUsd * sale.rate;
    totalUsd += sale.totalUsd;
    totalBs += bs;
    units += sale.lines.reduce((n, l) => n + l.qty, 0);

    const row = acc.get(sale.paymentMethod) ?? {
      method: sale.paymentMethod,
      count: 0,
      totalUsd: 0,
      totalBs: 0,
    };
    row.count += 1;
    row.totalUsd += sale.totalUsd;
    row.totalBs += bs;
    acc.set(sale.paymentMethod, row);
  }

  return {
    dayStartIso: from.toISOString(),
    sales,
    byMethod: [...acc.values()].sort((a, b) => b.totalUsd - a.totalUsd),
    totalUsd,
    totalBs,
    units,
  };
}

export async function getSale(id: string): Promise<Sale | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) fail(error);
  return data ? toSale(data as SaleRow) : null;
}

export type Summary = {
  todayUsd: number;
  todayCount: number;
  monthUsd: number;
  monthCount: number;
  /** Ventas menos costo, con los costos congelados en cada línea. */
  monthProfit: number;
  /**
   * true si alguna línea del mes se vendió sin costo registrado. En ese caso
   * la ganancia sale INFLADA (esa línea cuenta como 100 % beneficio), y la UI
   * tiene que decirlo en vez de presentar el número como si fuera exacto.
   */
  profitPartial: boolean;
  /** Inicio del mes en hora de Venezuela, para que otras consultas casen. */
  monthStartIso: string;
};

type SummaryRow = {
  sold_at: string;
  total_usd: number | string;
  sale_items: {
    qty: number;
    unit_price_usd: number | string;
    unit_cost_usd: number | string | null;
  }[];
};

/** Agrega en memoria sobre las ventas del mes: el volumen de una tienda no
 *  justifica una vista materializada, y así el recorte por rol de RLS se
 *  aplica solo. */
export async function getSummary(): Promise<Summary> {
  const monthStart = veStartOfMonth();
  const monthStartIso = monthStart.toISOString();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales")
    .select("sold_at, total_usd, sale_items(qty, unit_price_usd, unit_cost_usd)")
    .gte("sold_at", monthStartIso);
  if (error) fail(error);

  const startToday = veStartOfDay().getTime();
  const summary: Summary = {
    todayUsd: 0,
    todayCount: 0,
    monthUsd: 0,
    monthCount: 0,
    monthProfit: 0,
    profitPartial: false,
    monthStartIso,
  };

  for (const row of (data ?? []) as SummaryRow[]) {
    const total = Number(row.total_usd);
    summary.monthUsd += total;
    summary.monthCount += 1;

    for (const line of row.sale_items ?? []) {
      const cost = Number(line.unit_cost_usd ?? 0);
      if (cost <= 0) summary.profitPartial = true;
      summary.monthProfit +=
        line.qty * (Number(line.unit_price_usd) - cost);
    }

    if (new Date(row.sold_at).getTime() >= startToday) {
      summary.todayUsd += total;
      summary.todayCount += 1;
    }
  }
  return summary;
}

/**
 * Registra la venta y descuenta el stock en la MISMA transacción, dentro de la
 * base. Si un renglón se queda corto de stock, no se guarda nada: no puede
 * quedar una venta sin su descuento ni un descuento sin su venta.
 *
 * La tasa la calcula el servidor y se pasa aquí — el navegador nunca la envía,
 * porque entonces se podría registrar una venta a una tasa inventada.
 */
export async function registerSale(params: {
  items: CartItem[];
  payment: string;
  rate: number;
  rateSource: "bcv" | "manual";
  note?: string;
}): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_sale", {
    p_items: params.items.map((item) => ({
      product_id: item.productId,
      qty: item.qty,
    })),
    p_payment: params.payment,
    p_rate: params.rate,
    p_source: params.rateSource,
    p_note: params.note ?? null,
  });
  if (error) fail(error);
  return data as string;
}
