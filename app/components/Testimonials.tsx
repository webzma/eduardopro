// OJO: estos tres siguen siendo los testimonios de relleno que ya traía el
// sitio — solo les cambié la ciudad, porque barberos de Caracas y Maracaibo
// contradecían una tienda de Aroa. Sustitúyelos por reseñas reales de tus
// clientes en cuanto las tengas; los nombres inventados se notan.
const testimonials = [
  {
    quote:
      "Herramientas de verdad. La Wahl que compré aquí lleva dos años sin fallar en plena jornada.",
    name: "José R.",
    role: "Barbero, Aroa",
  },
  {
    quote:
      "Precio de barbería real y despacho rápido. Mis clientes notan la diferencia en el acabado.",
    name: "Miguel A.",
    role: "Barbero, San Felipe",
  },
  {
    quote:
      "La asesoría es lo mejor. Me guiaron con la navaja correcta y ahora es mi favorita en la silla.",
    name: "Carlos D.",
    role: "Barbero, Chivacoa",
  },
];

// T1 · Pull-quote with marginalia, on the cool accent. Replaces the three-up
// card grid with ★★★★★ and initials avatars — both are generated-page tells,
// and neither carried information the quote didn't already carry.
export default function Testimonials() {
  return (
    <section
      id="testimonios"
      className="border-y-2 border-coal bg-navy py-(--space-2xl) text-paper md:py-(--space-3xl)"
      style={{ ["--focus-ring" as string]: "var(--paper)" }}
    >
      <div className="mx-auto max-w-7xl px-(--page-gutter)">
        <h2 className="t-head">Lo dicen los que cortan.</h2>

        <div className="mt-(--space-xl) border-t-2 border-paper">
          {testimonials.map((testimonial) => (
            <figure
              key={testimonial.name}
              className="grid gap-(--space-sm) border-b-2 border-paper py-(--space-lg) lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] lg:gap-(--space-xl)"
            >
              {/* Display face, sentence case. These run 90+ characters — set
                  in all-caps condensed they read as a wall, not a quote.
                  Caps are for headlines here, not for running speech. */}
              <blockquote className="max-w-136 font-display text-2xl leading-[1.15] font-extrabold">
                {testimonial.quote}
              </blockquote>
              <figcaption className="lg:pt-(--space-2xs)">
                <span className="block font-semibold">{testimonial.name}</span>
                <span className="t-label mt-(--space-3xs) block opacity-80">
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
