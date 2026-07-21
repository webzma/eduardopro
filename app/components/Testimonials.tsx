import Reveal from "./Reveal";

const testimonials = [
  {
    quote:
      "Herramientas de verdad. La Wahl que compré aquí lleva dos años sin fallar en plena jornada.",
    author: "JOSÉ R. — BARBERO, CARACAS",
  },
  {
    quote:
      "Precio de barbería real y despacho rápido. Mis clientes notan la diferencia en el acabado.",
    author: "MIGUEL A. — BARBERO, VALENCIA",
  },
  {
    quote:
      "La asesoría es lo mejor. Me guiaron con la navaja correcta y ahora es mi favorita en la silla.",
    author: "CARLOS D. — BARBERO, MARACAIBO",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonios" className="bg-bg py-24 md:py-32">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <Reveal className="mb-16 max-w-2xl">
          <p className="mb-5 font-mono text-[11px] tracking-[0.3em] text-accent">
            TESTIMONIOS
          </p>
          <h2 className="font-display text-[42px] font-bold leading-[1.02] tracking-tight md:text-[58px]">
            Lo dicen los que cortan
          </h2>
        </Reveal>

        <div className="grid gap-px border border-hair bg-hair md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Reveal
              key={testimonial.author}
              delay={index * 120}
              className="bg-bg p-9 md:p-11"
            >
              <span
                aria-hidden
                className="mb-4 block font-display text-[60px] leading-none text-accent"
              >
                &ldquo;
              </span>
              <p className="font-display text-[22px] italic leading-snug text-cream md:text-[24px]">
                {testimonial.quote}
              </p>
              <p className="mt-8 font-mono text-[10px] tracking-[0.24em] text-ink">
                {testimonial.author}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
