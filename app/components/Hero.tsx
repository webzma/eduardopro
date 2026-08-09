import { IconBrandWhatsapp } from "@tabler/icons-react";
import { WHATSAPP_URL } from "../lib/site";
import { LOCATION_LABEL } from "../lib/site";

// Decorative barber pole, stood on end — the pair that brackets the fold in the
// reference. Hidden below lg, where there's no room beside the display.
function Pole({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute top-1/2 hidden w-8 -translate-y-1/2 flex-col lg:flex ${className}`}
    >
      <span className="h-4 border-2 border-coal bg-coal" />
      <span className="pole-v h-56" />
      <span className="h-4 border-2 border-coal bg-coal" />
    </div>
  );
}

// H1 · Marquee — the display fills the fold. No photograph: the type is the
// visual, and a stock image of someone else's barbershop was the least
// authentic thing on the old page.
export default function Hero() {
  return (
    <section className="relative border-b-2 border-coal bg-paper">
      <Pole className="left-(--page-gutter)" />
      <Pole className="right-(--page-gutter)" />

      <div className="mx-auto max-w-4xl px-(--page-gutter) pt-(--space-xl) pb-(--space-2xl) text-center lg:pt-(--space-2xl) lg:pb-(--space-3xl)">
        <div className="hero-in">
          <p className="t-script">Herramienta de gremio desde 2020</p>

          <h1 className="t-display mt-(--space-2xs)">
            Filo de verdad.
            <br />
            <span className="text-signal">Precio de gremio.</span>
            <br />
            Sin vueltas.
          </h1>

          <p className="mx-auto mt-(--space-md) max-w-[52ch] text-(length:--text-md) leading-relaxed text-coal2">
            Máquinas, navajas, ceras y repuestos comprados directo al
            distribuidor. La tienda está en Aroa — y si estás fuera, enviamos a
            donde estés.
          </p>

          <div className="mt-(--space-lg) flex flex-wrap items-center justify-center gap-(--space-sm)">
            <a href="#coleccion" className="btn btn--signal">
              Ver catálogo
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost"
            >
              <IconBrandWhatsapp size={20} stroke={1.75} aria-hidden />
              Pedir por WhatsApp
            </a>
          </div>

          <p className="t-label mt-(--space-md) text-coal2">
            {LOCATION_LABEL} · Venezuela · Al mayor y al detal
          </p>
        </div>
      </div>
    </section>
  );
}
