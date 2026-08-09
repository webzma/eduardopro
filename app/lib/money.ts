/* Los precios se guardan en USD. Los bolívares se calculan al mostrar, con la
 * tasa del momento — nunca se guardan como si fueran otro precio, porque
 * entonces habría dos verdades que se contradirían en cuanto la tasa se mueva.
 * La única excepción es una venta cerrada, que congela su tasa para que el
 * histórico no se deforme. */

const USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const BS = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUsd(amount: number): string {
  return `$${USD.format(amount)}`;
}

export function formatBs(amountUsd: number, rate: number): string {
  return `Bs ${BS.format(amountUsd * rate)}`;
}

/** La tasa en sí, que lleva 4 decimales en la fuente del BCV. */
export function formatRate(rate: number): string {
  return BS.format(rate);
}

/**
 * Margen sobre el PRECIO DE VENTA, no sobre el costo. Es la convención de
 * comercio: "gano un 40 %" significa que 40 de cada 100 que cobras son tuyos.
 * Calcularlo sobre el costo daría un número mayor y halagador que no cuadra
 * con lo que entra en caja.
 * Devuelve null si no hay precio o no hay costo — inventar un 100 % cuando el
 * costo aún es 0 haría creer que todo es ganancia.
 */
export function marginPct(price: number, cost: number): number | null {
  if (!price || price <= 0 || !cost || cost <= 0) return null;
  return ((price - cost) / price) * 100;
}

export function formatPct(value: number): string {
  return `${value.toFixed(0)} %`;
}

/** Precio de venta a partir de un costo y un margen deseado. */
export function priceForMargin(cost: number, marginPercent: number): number {
  const m = Math.min(Math.max(marginPercent, 0), 95) / 100;
  return cost / (1 - m);
}

/** Nombre de cara al usuario. Una sola traducción para todo el panel: si
 *  estuviera repetida, "Vendedor" y "vendedor" acabarían conviviendo. */
export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  vendedor: "Vendedor",
};

export const PAYMENT_LABELS: Record<string, string> = {
  usd_efectivo: "Efectivo USD",
  bs_efectivo: "Efectivo Bs",
  pago_movil: "Pago móvil",
  transferencia: "Transferencia",
  otro: "Otro",
};

/** Los métodos que se cobran en bolívares — la UI resalta el monto en Bs. */
export const PAYS_IN_BS = new Set([
  "bs_efectivo",
  "pago_movil",
  "transferencia",
]);
