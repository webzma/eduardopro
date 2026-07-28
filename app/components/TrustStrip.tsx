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
          <span className="px-(--space-md)">{item}</span>
          <span aria-hidden className="text-navy">
            ◆
          </span>
        </span>
      ))}
    </span>
  );
}

// Carnival's marquee banner, filled with the warm accent. Ink on red, not
// cream — cream on this red measures 3.81 and fails AA.
export default function TrustStrip() {
  return (
    <>
      <div className="overflow-hidden border-b-2 border-coal bg-signal py-(--space-xs) text-coal">
        <div className="marquee inline-flex whitespace-nowrap font-display text-lg font-extrabold tracking-widest uppercase">
          <Run />
          <Run ariaHidden />
        </div>
      </div>
      <div aria-hidden className="pole" />
    </>
  );
}
