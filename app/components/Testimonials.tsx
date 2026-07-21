import Reveal from "./Reveal";

const testimonials = [
  {
    quote:
      "Herramientas de verdad. La Wahl que compré aquí lleva dos años sin fallar en plena jornada.",
    name: "José R.",
    role: "BARBERO, CARACAS",
  },
  {
    quote:
      "Precio de barbería real y despacho rápido. Mis clientes notan la diferencia en el acabado.",
    name: "Miguel A.",
    role: "BARBERO, VALENCIA",
  },
  {
    quote:
      "La asesoría es lo mejor. Me guiaron con la navaja correcta y ahora es mi favorita en la silla.",
    name: "Carlos D.",
    role: "BARBERO, MARACAIBO",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

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
              key={testimonial.name}
              delay={index * 120}
              className="flex flex-col bg-bg p-9 md:p-11"
            >
              <div
                aria-label="5 de 5 estrellas"
                className="mb-6 flex gap-1 text-[13px] tracking-[0.3em] text-accent"
              >
                <span aria-hidden>★★★★★</span>
              </div>
              <p className="font-display text-[22px] italic leading-snug text-cream md:text-[24px]">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="mt-8 flex items-center gap-4 border-t border-hair pt-6">
                <span
                  aria-hidden
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-(--accent-soft) font-display text-[15px] text-accent"
                >
                  {initials(testimonial.name)}
                </span>
                <div className="leading-tight">
                  <p className="font-display text-[16px] text-cream">
                    {testimonial.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] tracking-[0.24em] text-ink">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
