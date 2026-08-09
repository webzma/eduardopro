const items = [
  "Tienda en Aroa",
  "Calidad garantizada",
  "Asesoría experta",
  "Enviamos a donde estés",
  "Venta al mayor",
];

function Run({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <span aria-hidden={ariaHidden || undefined} className="flex shrink-0">
      {items.map((item) => (
        <span key={item} className="flex items-center">
          <span className="px-6">{item}</span>
          <span aria-hidden className="text-signal">
            ★
          </span>
        </span>
      ))}
    </span>
  );
}

// The reference's ticker: an ink band, cream slab caps, red stars between the
// items. Cream on ink measures 17.04 — the widest margin on the page, which is
// what lets the band run at this small a size.
export default function TrustStrip() {
  return (
    <>
      <div
        className="overflow-hidden border-y-2 border-coal bg-coal py-3 text-paper"
        style={{ ["--focus-ring" as string]: "var(--paper)" }}
      >
        <div className="marquee inline-flex whitespace-nowrap font-display text-lg tracking-widest uppercase">
          <Run />
          <Run ariaHidden />
        </div>
      </div>
      <div aria-hidden className="pole" />
    </>
  );
}
