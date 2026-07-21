const items = [
  "CALIDAD GARANTIZADA",
  "ENVÍO EN 24 HORAS",
  "ASESORÍA EXPERTA",
  "PAGO SEGURO",
];

function MarqueeRun({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <span aria-hidden={ariaHidden || undefined} className="flex shrink-0">
      {items.map((item) => (
        <span key={item} className="flex items-center">
          <span className="px-6">{item}</span>
          <span aria-hidden>✦</span>
        </span>
      ))}
    </span>
  );
}

export default function TrustStrip() {
  return (
    <div className="overflow-hidden bg-accent py-4 text-[#171412]">
      <div className="animate-marquee inline-flex whitespace-nowrap font-mono text-[13px] font-medium tracking-[0.25em]">
        <MarqueeRun />
        <MarqueeRun ariaHidden />
      </div>
    </div>
  );
}
