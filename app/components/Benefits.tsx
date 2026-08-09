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
    <section id="oficio" className="bg-paper2 py-18 md:py-28">
      <div className="mx-auto max-w-7xl px-[clamp(1rem,4vw,2.5rem)]">
        {/* S2 · Hanging head — left-flush over a left-flush table. The break is
            explicit: a `ch` max-width resolves against the body font, not the
            display font, and silently shreds a condensed head into one word
            per line. */}
        <p className="font-script text-[length:var(--text-lg)] leading-[1.3] text-signal normal-case tracking-normal">Las condiciones, en una tabla</p>
        <h2 className="font-display font-normal uppercase text-[length:var(--text-display-s)] leading-[1.06] tracking-[-0.01em] [overflow-wrap:anywhere] min-w-0">
          El oficio,
          <br />
          bien hecho.
        </h2>
        <p className="mt-6 max-w-[52ch] text-[length:var(--text-md)] leading-relaxed text-coal2">
          Compramos directo a distribuidores. Tú recibes precio de barbería y
          productos que aguantan el día a día en la silla.
        </p>

        <dl className="mt-12 border-t-2 border-navy">
          {spec.map((row) => (
            <div
              key={row.key}
              className="grid gap-x-6 gap-y-1 border-b-2 border-navy py-6 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,1.3fr)] md:items-baseline"
            >
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-navy">{row.key}</dt>
              <dd className="tabular-nums font-display text-2xl leading-tight uppercase">
                {row.value}
              </dd>
              <dd className="text-[length:var(--text-base)] leading-relaxed text-coal2">
                {row.note}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
