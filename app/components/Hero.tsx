import { WHATSAPP_URL } from "../lib/site";

// H1 · Marquee — the display fills the fold, hard left. No photograph: the
// type is the visual, and a stock image of someone else's barbershop was the
// least authentic thing on the old page.
export default function Hero() {
  return (
    <section className="border-b-2 border-coal bg-paper">
      {/* Bottom padding runs ~1.5x the top so the hero sits into the page
          instead of floating above it. */}
      <div className="mx-auto grid max-w-7xl items-end gap-(--space-xl) px-(--page-gutter) pt-(--space-xl) pb-(--space-2xl) lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:pt-(--space-2xl) lg:pb-(--space-3xl)">
        <div className="hero-in">
          <h1 className="t-display">
            Herramienta de gremio.
            <br />
            Precio de{" "}
            <span className="box-decoration-clone bg-signal px-[0.12em] text-coal">
              gremio.
            </span>
          </h1>

          <p className="mt-(--space-md) max-w-[46ch] text-(length:--text-md) leading-relaxed text-coal2">
            Máquinas, navajas, ceras y repuestos comprados directo al
            distribuidor. La tienda está en Aroa — y si estás fuera, enviamos a
            donde estés.
          </p>

          <div className="mt-(--space-lg) flex flex-wrap items-center gap-(--space-sm)">
            <a href="#coleccion" className="btn btn--signal">
              Ver catálogo
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost"
            >
              Pedir por WhatsApp
            </a>
          </div>
        </div>

        {/* Pinned-poster sticker. Pure CSS — halftone stands in for the photo. */}
        <div aria-hidden className="hidden lg:block">
          <div className="halftone relative border-2 border-coal p-(--space-md) shadow-(--shadow-hard)">
            <div className="-rotate-2 border-2 border-coal bg-navy px-(--space-md) py-(--space-lg) text-center text-paper shadow-(--shadow-hard-sm)">
              <p className="t-head text-paper" style={{ fontSize: "2.5rem" }}>
                Al mayor
                <br />y al detal
              </p>
              <p className="mt-(--space-2xs) font-mono text-xs tracking-widest uppercase">
                Aroa, Yaracuy · Est. 2020
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
