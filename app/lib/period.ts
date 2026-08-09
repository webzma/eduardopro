/* Venezuela no aplica horario de verano, así que el desfase es fijo. Sin esto,
 * "hoy" se cortaría a medianoche UTC —las ocho de la noche aquí— y el cierre
 * de caja saldría partido en dos días. */
export const VE_OFFSET_MS = 4 * 60 * 60 * 1000;

export type Period = "hoy" | "7d" | "mes" | "todo";

export const PERIODS: { value: Period; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "mes", label: "Este mes" },
  { value: "todo", label: "Todo" },
];

export function isPeriod(value: string | undefined): value is Period {
  return PERIODS.some((p) => p.value === value);
}

/** Medianoche en Venezuela del día que contiene `at`, como instante UTC. */
export function veStartOfDay(at: Date = new Date()): Date {
  const ve = new Date(at.getTime() - VE_OFFSET_MS);
  return new Date(
    Date.UTC(ve.getUTCFullYear(), ve.getUTCMonth(), ve.getUTCDate()) +
      VE_OFFSET_MS,
  );
}

/** Medianoche del día siguiente: el límite superior de un día. */
export function veEndOfDay(at: Date = new Date()): Date {
  return new Date(veStartOfDay(at).getTime() + 24 * 60 * 60 * 1000);
}

export function veStartOfMonth(at: Date = new Date()): Date {
  const ve = new Date(at.getTime() - VE_OFFSET_MS);
  return new Date(
    Date.UTC(ve.getUTCFullYear(), ve.getUTCMonth(), 1) + VE_OFFSET_MS,
  );
}

/** Desde cuándo contar. null en "todo": sin límite inferior. */
export function periodStart(period: Period): string | null {
  const now = new Date();
  if (period === "hoy") return veStartOfDay(now).toISOString();
  if (period === "7d") {
    // Siete días naturales contando hoy, no 168 horas hacia atrás: "los
    // últimos 7 días" que entiende quien lleva la tienda empieza a las 00:00.
    return new Date(
      veStartOfDay(now).getTime() - 6 * 24 * 60 * 60 * 1000,
    ).toISOString();
  }
  if (period === "mes") return veStartOfMonth(now).toISOString();
  return null;
}

/** `YYYY-MM-DD` en hora de Venezuela, para los enlaces de día. */
export function veDateKey(at: Date = new Date()): string {
  return new Date(at.getTime() - VE_OFFSET_MS).toISOString().slice(0, 10);
}

/** Interpreta un `YYYY-MM-DD` como día de Venezuela. Hoy si no es válido. */
export function veDayFromKey(key: string | undefined): Date {
  if (key && /^\d{4}-\d{2}-\d{2}$/.test(key)) {
    const at = new Date(`${key}T12:00:00.000Z`);
    if (!Number.isNaN(at.getTime())) return veStartOfDay(at);
  }
  return veStartOfDay();
}
