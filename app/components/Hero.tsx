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

      <div className="mx-auto max-w-4xl px-[clamp(1rem,4vw,2.5rem)] pt-12 pb-18 text-center lg:pt-18 lg:pb-28">
        <div className="hero-in">
          <p className="font-script text-[length:var(--text-lg)] leading-[1.3] text-signal normal-case tracking-normal">Herramienta de gremio desde 2020</p>

          <h1 className="font-display font-normal uppercase text-[length:var(--text-display)] leading-[1.04] tracking-[-0.015em] [overflow-wrap:anywhere] min-w-0 mt-2">
            Filo de verdad.
            <br />
            <span className="text-signal">Precio de gremio.</span>
            <br />
            Sin vueltas.
          </h1>

          <p className="mx-auto mt-6 max-w-[52ch] text-[length:var(--text-md)] leading-relaxed text-coal2">
            Máquinas, navajas, ceras y repuestos comprados directo al
            distribuidor. La tienda está en Aroa — y si estás fuera, enviamos a
            donde estés.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href="#coleccion" className="inline-flex items-center justify-center gap-2 py-3 min-h-11 border-2 border-coal shadow-[4px_4px_0_var(--coal)] font-display font-normal tracking-[0.04em] uppercase whitespace-nowrap px-4 text-sm sm:px-8 sm:text-[length:var(--text-md)] transition-[transform,box-shadow,background-color] duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--coal)] active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none bg-signal text-paper">
              Ver catálogo
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-3 min-h-11 border-2 border-coal shadow-[4px_4px_0_var(--coal)] font-display font-normal tracking-[0.04em] uppercase whitespace-nowrap px-4 text-sm sm:px-8 sm:text-[length:var(--text-md)] transition-[transform,box-shadow,background-color] duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--coal)] active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none bg-paper text-coal"
            >
              <IconBrandWhatsapp size={20} stroke={1.75} aria-hidden />
              Pedir por WhatsApp
            </a>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.18em] mt-6 text-coal2">
            {LOCATION_LABEL} · Venezuela · Al mayor y al detal
          </p>
        </div>
      </div>
    </section>
  );
}
