/** Bloque de carga. `w` y `h` en clases de Tailwind para no inventar tokens. */
export function Skel({ className = "" }: { className?: string }) {
  return <span className={`crm-skel block ${className}`} aria-hidden />;
}

/** Esqueleto genérico de pantalla: cabecera + tarjeta. Cubre el 90 % de los
 *  casos sin inventar un layout distinto por ruta, que se desincronizaría. */
export default function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <Skel className="h-6 w-40" />
      <Skel className="mt-2 h-4 w-64" />
      <div className="crm-card mt-(--space-md)">
        <div className="crm-card__body flex flex-col gap-(--space-sm)">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-(--space-sm)">
              <Skel className="size-9 shrink-0 rounded" />
              <Skel className="h-4 flex-1" />
              <Skel className="h-4 w-16 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
