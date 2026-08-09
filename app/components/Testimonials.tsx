// OJO: estos tres siguen siendo los testimonios de relleno que ya traía el
// sitio — solo les cambié la ciudad, porque barberos de Caracas y Maracaibo
// contradecían una tienda de Aroa. Sustitúyelos por reseñas reales de tus
// clientes en cuanto las tengas; los nombres inventados se notan.
const testimonials = [
  {
    quote:
      "Herramientas de verdad. La Wahl que compré aquí lleva dos años sin fallar en plena jornada.",
    name: "José Rivera",
    role: "Barbero, Aroa",
  },
  {
    quote:
      "Precio de barbería real y cortes profesionales. Los mejores servicios siempre.",
    name: "Wilberk Ledezma",
    role: "Ingeniero en sistemas, Aroa",
  },
  {
    quote:
      "La asesoría es lo mejor. Me guiaron con la navaja correcta y ahora es mi favorita en la silla.",
    name: "Carlos Diaz",
    role: "Barbero, Aroa",
  },
];

// T1 · Quote cards on paper, per the reference: bordered cards with the hard
// offset shadow and an oversized red quote mark. Replaces the three-up grid
// with ★★★★★ and initials avatars — both are generated-page tells.
export default function Testimonials() {
  return (
    <section
      id="testimonios"
      className="border-y-2 border-coal bg-paper2 py-18 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-[clamp(1rem,4vw,2.5rem)]">
        <p className="font-script text-[length:var(--text-lg)] leading-[1.3] text-signal normal-case tracking-normal">No lo decimos nosotros</p>
        <h2 className="font-display font-normal uppercase text-[length:var(--text-display-s)] leading-[1.06] tracking-[-0.01em] [overflow-wrap:anywhere] min-w-0">Lo dicen los que cortan.</h2>

        {/* grid-cols-3 expands to repeat(3, minmax(0,1fr)), so a long unbroken
            word in a quote can't blow its track out. */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <figure
              key={testimonial.name}
              className="flex flex-col border-2 border-coal bg-paper p-6 shadow-[6px_6px_0_var(--coal)]"
            >
              <span
                aria-hidden
                className="font-display text-3xl leading-none text-signal"
              >
                &ldquo;
              </span>
              <blockquote className="mt-2 flex-1 text-[length:var(--text-base)] leading-relaxed text-coal2">
                {testimonial.quote}
              </blockquote>
              <figcaption className="mt-6">
                <span className="block font-semibold">{testimonial.name}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] mt-1 block text-ash">
                  {testimonial.role}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
