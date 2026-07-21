import Image from "next/image";
import Reveal from "./Reveal";

const features = [
  {
    title: "Calidad garantizada",
    description:
      "Marcas probadas en barberías reales. Nada que no usaríamos nosotros.",
  },
  {
    title: "Envío en 24 horas",
    description: "Despachamos rápido a todo el país. Tu pedido no espera.",
  },
  {
    title: "Asesoría experta",
    description:
      "Te ayudamos a elegir la herramienta correcta para tu estilo.",
  },
];

export default function Benefits() {
  return (
    <section id="oficio" className="bg-bg py-24 md:py-32">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-6 md:px-10 lg:grid-cols-2 lg:gap-20">
        <Reveal className="order-2 lg:order-1">
          <p className="mb-6 font-mono text-[11px] tracking-[0.3em] text-accent">
            EL OFICIO
          </p>
          <h2 className="font-display text-[42px] font-bold leading-[1.02] tracking-tight md:text-[58px]">
            El oficio,
            <br />
            bien hecho
          </h2>
          <p className="mt-7 max-w-lg text-[17px] leading-relaxed text-ink">
            Compramos directo a distribuidores. Tú recibes precio de barbería y
            productos que aguantan el día a día en la silla.
          </p>
          <div className="mt-12">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`flex gap-6 border-t border-hair py-7 ${
                  index === features.length - 1 ? "border-b" : ""
                }`}
              >
                <span className="font-display text-[34px] italic leading-none text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="mb-1 font-display text-[22px]">
                    {feature.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-ink">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={150} className="relative order-1 lg:order-2">
          <span
            aria-hidden
            className="absolute -left-3 -top-3 h-full w-full border border-accent/30"
          />
          <div className="relative h-[420px] overflow-hidden bg-[#211d19] shadow-(--shadow-card) md:h-[620px]">
            <Image
              src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&w=900&q=80&fit=crop"
              alt="Barbero trabajando"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute bottom-5 left-5 border border-hair bg-bg/80 px-4 py-2 font-mono text-[10px] tracking-[0.28em] text-cream backdrop-blur-sm">
            DESDE 2020 · CARACAS
          </div>
        </Reveal>
      </div>
    </section>
  );
}
