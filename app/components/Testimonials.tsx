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
      className="border-y-2 border-coal bg-paper2 py-(--space-2xl) md:py-(--space-3xl)"
    >
      <div className="mx-auto max-w-7xl px-(--page-gutter)">
        <p className="t-script">No lo decimos nosotros</p>
        <h2 className="t-head">Lo dicen los que cortan.</h2>

        {/* grid-cols-3 expands to repeat(3, minmax(0,1fr)), so a long unbroken
            word in a quote can't blow its track out. */}
        <div className="mt-(--space-xl) grid gap-(--space-md) md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <figure
              key={testimonial.name}
              className="flex flex-col border-2 border-coal bg-paper p-(--space-md) shadow-(--shadow-hard)"
            >
              <span
                aria-hidden
                className="font-display text-3xl leading-none text-signal"
              >
                &ldquo;
              </span>
              <blockquote className="mt-(--space-2xs) flex-1 text-(length:--text-base) leading-relaxed text-coal2">
                {testimonial.quote}
              </blockquote>
              <figcaption className="mt-(--space-md)">
                <span className="block font-semibold">{testimonial.name}</span>
                <span className="t-label mt-(--space-3xs) block text-ash">
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
