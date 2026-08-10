import Link from "next/link";
import { PERIODS, type Period } from "@/app/lib/period";
import { cn } from "@/app/lib/utils";
import { buttonVariants } from "@/app/components/ui/button";

/**
 * Filtro por periodo. Enlaces, no botones con estado: así la selección vive en
 * la URL — se puede compartir, volver atrás y recargar sin perderla — y no
 * hace falta JavaScript para que funcione.
 */
export default function PeriodFilter({
  base,
  active,
  keep,
}: {
  /** Ruta sobre la que se cuelga el parámetro. */
  base: string;
  /** null cuando manda un rango de fechas a mano: ningún atajo está activo. */
  active: Period | null;
  /** Parámetros que sobreviven al cambio de periodo (la búsqueda). Lo que no
   *  esté aquí se pierde a propósito: elegir "Hoy" tiene que limpiar el rango
   *  de fechas y volver a la primera página. */
  keep?: Record<string, string | undefined>;
}) {
  return (
    <nav aria-label="Filtrar por periodo" className="flex flex-wrap gap-1">
      {PERIODS.map((p) => {
        const on = p.value === active;
        const query = new URLSearchParams({ periodo: p.value });
        for (const [name, value] of Object.entries(keep ?? {})) {
          if (value) query.set(name, value);
        }
        return (
          <Link
            key={p.value}
            href={`${base}?${query}`}
            aria-current={on ? "true" : undefined}
            className={cn(
              buttonVariants({
                variant: on ? "default" : "outline",
                size: "sm",
              }),
            )}
          >
            {p.label}
          </Link>
        );
      })}
    </nav>
  );
}
