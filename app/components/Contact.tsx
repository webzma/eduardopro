import Reveal from "./Reveal";

const fieldClasses =
  "w-full border-b border-[#171412]/45 bg-transparent py-3 text-[16px] outline-none transition-colors placeholder:text-[#171412]/50 focus:border-accent";

export default function Contact() {
  return (
    <section id="contacto" className="bg-cream py-24 text-[#171412] md:py-32">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-6 md:px-10 lg:grid-cols-2 lg:gap-24">
        <Reveal>
          <p className="mb-5 font-mono text-[11px] tracking-[0.3em] text-accent">
            CONTACTO
          </p>
          <h2 className="font-display text-[56px] font-bold leading-none tracking-tight md:text-[80px]">
            Hablemos
          </h2>
          <p className="mt-7 max-w-md text-[17px] leading-relaxed text-[#4b453d]">
            Haz tu pedido directo por WhatsApp o déjanos un mensaje. Te
            respondemos en minutos y coordinamos el envío a todo el país.
          </p>
          <div className="mt-10 flex items-center gap-4 font-mono text-[12px] tracking-[0.2em] text-[#171412]">
            <span aria-hidden className="h-px w-10 bg-[#171412]/30" />
            RESPUESTA EN MINUTOS
          </div>
        </Reveal>

        <Reveal delay={150}>
          <form className="space-y-5" action="#">
            <div>
              <label
                htmlFor="contact-name"
                className="mb-2 block font-mono text-[11px] tracking-[0.22em] text-[#6b6459]"
              >
                NOMBRE
              </label>
              <input
                id="contact-name"
                type="text"
                placeholder="Tu nombre"
                className={fieldClasses}
              />
            </div>
            <div>
              <label
                htmlFor="contact-whatsapp"
                className="mb-2 block font-mono text-[11px] tracking-[0.22em] text-[#6b6459]"
              >
                WHATSAPP
              </label>
              <input
                id="contact-whatsapp"
                type="tel"
                placeholder="+58 ..."
                className={fieldClasses}
              />
            </div>
            <div>
              <label
                htmlFor="contact-message"
                className="mb-2 block font-mono text-[11px] tracking-[0.22em] text-[#6b6459]"
              >
                MENSAJE
              </label>
              <textarea
                id="contact-message"
                rows={3}
                placeholder="¿Qué necesitas?"
                className={`${fieldClasses} resize-none`}
              />
            </div>
            <button
              type="submit"
              className="btn-accent w-full bg-accent px-9 py-4 font-mono text-[12px] font-medium tracking-[0.2em] text-[#171412] transition-colors sm:w-auto"
            >
              ENVIAR MENSAJE
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
