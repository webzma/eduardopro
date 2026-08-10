/* Una sola forma de escribir una fecha en toda la web: 04/10/2026.
 *
 * Antes cada pantalla traía su propio Intl.DateTimeFormat —"4 de octubre de
 * 2026" en el detalle, "04 oct 2026" en el listado, "lunes, 4 de octubre" en
 * caja— y la misma venta se leía distinta según dónde la miraras. Con día,
 * mes y año en dígitos no hay que traducir nada de una pantalla a otra, y una
 * fecha corta cabe en la celda de un teléfono, que es donde se lleva la
 * tienda.
 *
 * La zona horaria es fija y no se negocia: sin ella el servidor formatea en
 * SU hora —UTC en el despliegue—, y una venta de las nueve de la noche
 * aparecería fechada al día siguiente. Venezuela no aplica horario de verano,
 * así que basta con nombrarla.
 */
const TZ = "America/Caracas";

const DATE = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TZ,
});

const TIME = new Intl.DateTimeFormat("es-VE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

const DATE_TIME = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

/** Las fechas llegan de la base como texto ISO; de los cálculos, como Date. */
function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/** 04/10/2026 */
export function formatDate(value: Date | string): string {
  return DATE.format(toDate(value));
}

/** 02:30 p. m. */
export function formatTime(value: Date | string): string {
  return TIME.format(toDate(value));
}

/** 04/10/2026, 02:30 p. m. */
export function formatDateTime(value: Date | string): string {
  return DATE_TIME.format(toDate(value));
}
