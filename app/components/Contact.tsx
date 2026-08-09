"use client";

import { useState } from "react";
import { IconBrandWhatsapp } from "@tabler/icons-react";
import { WHATSAPP_URL, whatsappOrderUrl } from "../lib/site";

// The old form posted to "#" — it looked like a contact channel and silently
// dropped every message. It now composes the WhatsApp message the shop actually
// answers on, which needs no backend.
export default function Contact() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: boolean; message?: boolean }>(
    {},
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = { name: !name.trim(), message: !message.trim() };
    setErrors(next);
    if (next.name || next.message) return;

    const lines = [
      `Hola, soy ${name.trim()}.`,
      message.trim(),
      phone.trim() ? `Mi WhatsApp: ${phone.trim()}` : null,
    ].filter(Boolean);

    window.open(
      whatsappOrderUrl(lines.join("\n")),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <section
      id="contacto"
      className="bg-paper3 py-18 md:py-28"
    >
      <div className="mx-auto grid max-w-7xl gap-12 px-[clamp(1rem,4vw,2.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-28">
        <div className="min-w-0">
          <p className="font-script text-[length:var(--text-lg)] leading-[1.3] text-signal normal-case tracking-normal">Dale, escríbenos —</p>
          <h2 className="font-display font-normal uppercase text-[length:var(--text-display-s)] leading-[1.06] tracking-[-0.01em] [overflow-wrap:anywhere] min-w-0">Hablemos.</h2>
          <p className="mt-6 max-w-[46ch] text-[length:var(--text-md)] leading-relaxed text-coal2">
            Escríbenos y coordinamos la entrega en Aroa — o el envío, si estás
            fuera. Respondemos en minutos.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group/tlink inline-flex items-center gap-[0.4em] font-display font-normal uppercase tracking-[0.04em] whitespace-nowrap text-signal shadow-[inset_0_-2px_0_var(--signal)] transition-shadow duration-[180ms] hover:text-paper hover:shadow-[inset_0_-0.5em_0_var(--signal)] active:text-coal motion-reduce:transition-none mt-8 inline-flex max-w-full text-lg whitespace-normal sm:text-xl sm:whitespace-nowrap"
          >
            <IconBrandWhatsapp size={22} stroke={1.75} aria-hidden />
            Abrir WhatsApp
            <span aria-hidden className="transition-transform duration-[180ms] group-hover/tlink:translate-x-[3px] motion-reduce:transition-none">
              →
            </span>
          </a>
        </div>

        <form onSubmit={handleSubmit} noValidate className="grid min-w-0 gap-4">
          <div>
            <label htmlFor="contact-name" className="text-xs font-semibold uppercase tracking-[0.18em] mb-1 block text-navy">
              Nombre
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={errors.name || undefined}
              aria-describedby={errors.name ? "contact-name-error" : undefined}
              placeholder="Tu nombre"
              className="w-full px-4 py-3 min-h-11 border-2 border-coal bg-paper text-coal text-base transition-shadow duration-[180ms] placeholder:text-ash hover:shadow-[4px_4px_0_var(--coal)] aria-invalid:border-signal aria-invalid:shadow-[4px_4px_0_var(--signal)] disabled:bg-paper3 disabled:text-ash disabled:border-ash disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-55"
            />
            <p id="contact-name-error" className="text-xs font-semibold uppercase tracking-[0.18em] block min-h-[1lh] mt-1 text-signal">
              {errors.name ? "Falta tu nombre." : null}
            </p>
          </div>

          <div>
            <label htmlFor="contact-phone" className="text-xs font-semibold uppercase tracking-[0.18em] mb-1 block text-navy">
              WhatsApp (opcional)
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+58 ..."
              className="w-full px-4 py-3 min-h-11 border-2 border-coal bg-paper text-coal text-base transition-shadow duration-[180ms] placeholder:text-ash hover:shadow-[4px_4px_0_var(--coal)] aria-invalid:border-signal aria-invalid:shadow-[4px_4px_0_var(--signal)] disabled:bg-paper3 disabled:text-ash disabled:border-ash disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-55"
            />
          </div>

          <div>
            <label htmlFor="contact-message" className="text-xs font-semibold uppercase tracking-[0.18em] mb-1 block text-navy">
              Mensaje
            </label>
            <textarea
              id="contact-message"
              name="message"
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              aria-invalid={errors.message || undefined}
              aria-describedby={
                errors.message ? "contact-message-error" : undefined
              }
              placeholder="¿Qué necesitas?"
              className="w-full px-4 py-3 min-h-11 border-2 border-coal bg-paper text-coal text-base transition-shadow duration-[180ms] placeholder:text-ash hover:shadow-[4px_4px_0_var(--coal)] aria-invalid:border-signal aria-invalid:shadow-[4px_4px_0_var(--signal)] disabled:bg-paper3 disabled:text-ash disabled:border-ash disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-55 resize-none"
            />
            <p id="contact-message-error" className="text-xs font-semibold uppercase tracking-[0.18em] block min-h-[1lh] mt-1 text-signal">
              {errors.message ? "Escribe qué necesitas." : null}
            </p>
          </div>

          <button type="submit" className="inline-flex items-center justify-center gap-2 py-3 min-h-11 border-2 border-coal shadow-[4px_4px_0_var(--coal)] font-display font-normal tracking-[0.04em] uppercase whitespace-nowrap transition-[transform,box-shadow,background-color] duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--coal)] active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none bg-signal text-paper max-w-full justify-self-start px-4 text-sm sm:px-8 sm:text-[length:var(--text-md)]">
            <IconBrandWhatsapp size={20} stroke={1.75} aria-hidden />
            Enviar por WhatsApp
          </button>
        </form>
      </div>
    </section>
  );
}
