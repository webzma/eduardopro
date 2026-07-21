import Image from "next/image";
import Reveal from "./Reveal";
import { WHATSAPP_URL } from "../lib/site";

export default function Hero() {
  return (
    <header className="relative flex min-h-screen items-end overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&w=1600&q=80&fit=crop"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(15,12,10,0.78) 0%, rgba(15,12,10,0.55) 40%, rgba(15,12,10,0.94) 100%)",
        }}
      />

      <div className="absolute bottom-8 left-6 z-10 flex items-center gap-3 font-mono text-[10px] tracking-[0.28em] text-ink md:left-10">
        <span aria-hidden className="h-px w-6 bg-accent" />
        EST. 2020
      </div>
      <div className="absolute bottom-8 right-6 z-10 flex items-center gap-3 font-mono text-[10px] tracking-[0.28em] text-ink md:right-10">
        ENVÍOS A TODO EL PAÍS
        <span aria-hidden className="h-px w-6 bg-accent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-6 pb-24 md:px-10 md:pb-32">
        <Reveal>
          <p className="mb-6 font-mono text-[11px] tracking-[0.32em] text-accent md:text-[12px]">
            HERRAMIENTAS · CUIDADO · RITUAL
          </p>
          <h1 className="max-w-[16ch] font-display text-[15vw] font-bold leading-[0.95] tracking-tight md:text-[8.5vw]">
            El ritual del <span className="italic text-accent">caballero</span>
          </h1>
          <p className="mt-8 max-w-xl text-[18px] leading-relaxed text-ink md:text-[21px]">
            Herramientas y productos de grado profesional para quienes toman el
            cuidado en serio. Precio de barbería, calidad que aguanta la silla.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="#coleccion"
              className="btn-accent bg-accent px-9 py-4 text-center font-mono text-[12px] font-medium tracking-[0.2em] text-[#171412] transition-colors"
            >
              EXPLORAR COLECCIÓN
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline border border-cream/60 px-9 py-4 text-center font-mono text-[12px] font-medium tracking-[0.2em] text-cream transition-colors"
            >
              HABLAR POR WHATSAPP
            </a>
          </div>
        </Reveal>
      </div>
    </header>
  );
}
