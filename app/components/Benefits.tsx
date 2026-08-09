// F3 · Tabular spec sheet. Replaces the 01/02/03 numbered feature list — the
// trade counter's conditions board, not three cards. Every value here already
// existed in the site's own copy; nothing is invented.
const spec = [
  {
    key: "Tienda",
    value: "En Aroa",
    note: "Pasa a verla y llévatelo el mismo día.",
  },
  {
    key: "Fuera de Aroa",
    value: "Enviamos a donde estés",
    note: "Coordinamos el envío por WhatsApp.",
  },
  {
    key: "Origen",
    value: "Directo al distribuidor",
    note: "Sin intermediarios en el medio.",
  },
  {
    key: "Precio",
    value: "De gremio",
    note: "El mismo que paga la barbería.",
  },
  {
    key: "Asesoría",
    value: "Incluida",
    note: "Te guiamos a la herramienta correcta para tu estilo.",
  },
  {
    key: "En el oficio desde",
    value: "2020",
    note: "Aroa, Yaracuy.",
  },
];

export default function Benefits() {
  return (
    <section id="oficio" className="bg-paper2 py-(--space-2xl) md:py-(--space-3xl)">
      <div className="mx-auto max-w-7xl px-(--page-gutter)">
        {/* S2 · Hanging head — left-flush over a left-flush table. The break is
            explicit: a `ch` max-width resolves against the body font, not the
            display font, and silently shreds a condensed head into one word
            per line. */}
        <p className="t-script">Las condiciones, en una tabla</p>
        <h2 className="t-head">
          El oficio,
          <br />
          bien hecho.
        </h2>
        <p className="mt-(--space-md) max-w-[52ch] text-(length:--text-md) leading-relaxed text-coal2">
          Compramos directo a distribuidores. Tú recibes precio de barbería y
          productos que aguantan el día a día en la silla.
        </p>

        <dl className="mt-(--space-xl) border-t-2 border-navy">
          {spec.map((row) => (
            <div
              key={row.key}
              className="grid gap-x-(--space-md) gap-y-(--space-3xs) border-b-2 border-navy py-(--space-md) md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,1.3fr)] md:items-baseline"
            >
              <dt className="t-label text-navy">{row.key}</dt>
              <dd className="tnum font-display text-2xl leading-tight uppercase">
                {row.value}
              </dd>
              <dd className="text-(length:--text-base) leading-relaxed text-coal2">
                {row.note}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
