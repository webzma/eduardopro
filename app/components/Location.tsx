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
      className="bg-paper2 py-(--space-2xl) md:py-(--space-3xl)"
    >
      <div className="mx-auto max-w-7xl px-(--page-gutter)">
        <h2 className="t-head">Estamos en {LOCATION.town}.</h2>
        {/* El envío lo cuenta el panel; aquí no se repite. */}
        <p className="mt-(--space-md) max-w-[52ch] text-(length:--text-md) leading-relaxed text-coal2">
          Pásate por la tienda y llévate lo que necesites el mismo día.
        </p>

        <div className="mt-(--space-xl) grid items-stretch gap-(--space-lg) lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          {/* El letrero esmaltado. */}
          <div
            className="flex flex-col border-2 border-coal bg-navy p-(--space-lg) text-paper shadow-(--shadow-hard)"
            style={{ ["--focus-ring" as string]: "var(--paper)" }}
          >
            <p className="t-label text-paper/80">La tienda</p>
            <p className="t-display mt-(--space-2xs) text-[clamp(2.75rem,7vw,4.5rem)]">
              {LOCATION.town}
            </p>
            {/* Coma, no interpunto: si esto parte en dos líneas, una línea que
                acaba en "Yaracuy," se lee bien; una que acaba en "·" no. */}
            <p className="t-head mt-(--space-3xs) text-lg text-paper/80">
              {LOCATION.region}, {LOCATION.country}
            </p>

            {LOCATION.address ? (
              <p className="mt-(--space-sm) max-w-[36ch] text-(length:--text-md) leading-relaxed text-paper/90">
                {LOCATION.address}
              </p>
            ) : null}

            <p className="mt-(--space-lg) border-t-2 border-paper/40 pt-(--space-sm) max-w-[34ch] text-(length:--text-base) leading-relaxed">
              ¿Fuera de {LOCATION.town}? Enviamos a donde estés — lo
              coordinamos por WhatsApp.
            </p>

            {/* mt-auto ancla los botones al pie del panel, así los dos bloques
                cierran a la misma altura pase lo que pase con el texto. */}
            <div className="mt-auto flex flex-wrap items-center gap-(--space-md) pt-(--space-lg)">
              <a
                href={MAP_LINK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost"
              >
                Cómo llegar
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="tlink tlink--paper text-lg"
              >
                Escríbenos
                <span aria-hidden className="tlink__arrow">
                  →
                </span>
              </a>
            </div>
          </div>

          {/* La lámina del mapa: cabecera tipográfica arriba, mapa debajo. */}
          <figure className="flex min-h-96 flex-col border-2 border-coal bg-paper shadow-(--shadow-hard)">
            <figcaption className="flex flex-wrap items-center justify-between gap-x-(--space-md) gap-y-1 border-b-2 border-coal bg-signal px-(--space-sm) py-(--space-2xs) text-coal">
              <span className="t-label">{LOCATION_LABEL}</span>
              <span className="t-label tnum">
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
