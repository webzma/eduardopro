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
}: {
  /** Ruta sobre la que se cuelga el parámetro. */
  base: string;
  active: Period;
}) {
  return (
    <nav aria-label="Filtrar por periodo" className="flex flex-wrap gap-1">
      {PERIODS.map((p) => {
        const on = p.value === active;
        return (
          <Link
            key={p.value}
            href={`${base}?periodo=${p.value}`}
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
