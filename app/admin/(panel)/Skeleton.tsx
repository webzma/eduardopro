import { Skeleton } from "@/app/components/ui/skeleton";

/**
 * Esqueleto genérico de pantalla. Uno solo para todas las rutas: uno por
 * pantalla se desincroniza del layout real en cuanto se toca una.
 */
export default function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-6 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="size-14 shrink-0 rounded-md" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
