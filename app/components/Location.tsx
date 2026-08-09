import { IconMapPin, IconBrandWhatsapp } from "@tabler/icons-react";
import { cn } from "../lib/utils";
import {
  LOCATION,
  LOCATION_LABEL,
  MAP_EMBED_URL,
  MAP_LINK_URL,
  WHATSAPP_URL,
} from "../lib/site";

// Dos paneles de la MISMA altura (items-stretch): el letrero y el mapa. Antes
// eran dos columnas de alturas distintas y el borde inferior quedaba
// descuadrado. El panel izquierdo va relleno de azul porque esta era la única
// sección sin acento de la página — y un acento por bloque, así que el botón
// dentro del azul es de papel, no rojo.
export default function Location() {
  return (
    <section
      id="ubicacion"
      className="bg-paper2 py-18 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-[clamp(1rem,4vw,2.5rem)]">
        <p className="font-script text-[length:var(--text-lg)] leading-[1.3] text-signal normal-case tracking-normal">Pásate cuando quieras</p>
        <h2 className="font-display font-normal uppercase text-[length:var(--text-display-s)] leading-[1.06] tracking-[-0.01em] [overflow-wrap:anywhere] min-w-0">Estamos en {LOCATION.town}.</h2>
        {/* El envío lo cuenta el panel; aquí no se repite. */}
        <p className="mt-6 max-w-[52ch] text-[length:var(--text-md)] leading-relaxed text-coal2">
          Pásate por la tienda y llévate lo que necesites el mismo día.
        </p>

        <div className="mt-12 grid items-stretch gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          {/* El letrero esmaltado. */}
          <div
            className="flex flex-col border-2 border-coal bg-navy p-8 text-paper shadow-[6px_6px_0_var(--coal)]"
            style={{ ["--focus-ring" as string]: "var(--paper)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-paper/80">La tienda</p>
            <p className="font-display font-normal uppercase text-[length:var(--text-display)] leading-[1.04] tracking-[-0.015em] [overflow-wrap:anywhere] min-w-0 mt-2 text-[clamp(2.75rem,7vw,4.5rem)]">
              {LOCATION.town}
            </p>
            {/* Coma, no interpunto: si esto parte en dos líneas, una línea que
                acaba en "Yaracuy," se lee bien; una que acaba en "·" no. */}
            <p className="font-display font-normal uppercase text-[length:var(--text-display-s)] leading-[1.06] tracking-[-0.01em] [overflow-wrap:anywhere] min-w-0 mt-1 text-lg text-paper/80">
              {LOCATION.region}, {LOCATION.country}
            </p>

            {LOCATION.address ? (
              <p className="mt-4 max-w-[36ch] text-[length:var(--text-md)] leading-relaxed text-paper/90">
                {LOCATION.address}
              </p>
            ) : null}

            <p className="mt-8 border-t-2 border-paper/40 pt-4 max-w-[34ch] text-[length:var(--text-base)] leading-relaxed">
              ¿Fuera de {LOCATION.town}? Enviamos a donde estés — lo
              coordinamos por WhatsApp.
            </p>

            {/* mt-auto ancla los botones al pie del panel, así los dos bloques
                cierran a la misma altura pase lo que pase con el texto. */}
            <div className="mt-auto flex flex-wrap items-center gap-6 pt-8">
              <a
                href={MAP_LINK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 min-h-11 border-2 border-coal shadow-[4px_4px_0_var(--coal)] font-display font-normal text-[length:var(--text-md)] tracking-[0.04em] uppercase whitespace-nowrap transition-[transform,box-shadow,background-color] duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--coal)] active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none bg-paper text-coal"
              >
                <IconMapPin size={20} stroke={1.75} aria-hidden />
                Cómo llegar
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group/tlink inline-flex items-center gap-[0.4em] font-display font-normal uppercase tracking-[0.04em] whitespace-nowrap text-signal shadow-[inset_0_-2px_0_var(--signal)] transition-shadow duration-[180ms] hover:text-paper hover:shadow-[inset_0_-0.5em_0_var(--signal)] active:text-coal motion-reduce:transition-none",
                  "text-paper shadow-[inset_0_-2px_0_var(--paper)] hover:text-coal hover:shadow-[inset_0_-0.5em_0_var(--paper)] active:text-paper3",
                  "text-lg",
                )}
              >
                <IconBrandWhatsapp size={20} stroke={1.75} aria-hidden />
                Escríbenos
                <span aria-hidden className="transition-transform duration-[180ms] group-hover/tlink:translate-x-[3px] motion-reduce:transition-none">
                  →
                </span>
              </a>
            </div>
          </div>

          {/* La lámina del mapa: cabecera tipográfica arriba, mapa debajo. */}
          <figure className="flex min-h-96 flex-col border-2 border-coal bg-paper shadow-[6px_6px_0_var(--coal)]">
            <figcaption className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b-2 border-coal bg-signal px-4 py-2 text-paper">
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">{LOCATION_LABEL}</span>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] tabular-nums">
                {LOCATION.lat.toFixed(4)}° N · {Math.abs(LOCATION.lon).toFixed(4)}° O
              </span>
            </figcaption>
            <iframe
              src={MAP_EMBED_URL}
              title={`Mapa de ${LOCATION_LABEL}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="min-h-80 w-full flex-1 border-0"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
