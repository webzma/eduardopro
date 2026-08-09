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
      className="bg-paper3 py-(--space-2xl) md:py-(--space-3xl)"
    >
      <div className="mx-auto grid max-w-7xl gap-(--space-xl) px-(--page-gutter) lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-(--space-3xl)">
        <div>
          <p className="t-script">Dale, escríbenos —</p>
          <h2 className="t-head">Hablemos.</h2>
          <p className="mt-(--space-md) max-w-[46ch] text-(length:--text-md) leading-relaxed text-coal2">
            Escríbenos y coordinamos la entrega en Aroa — o el envío, si estás
            fuera. Respondemos en minutos.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="tlink mt-(--space-lg) inline-flex text-xl"
          >
            <IconBrandWhatsapp size={22} stroke={1.75} aria-hidden />
            Abrir WhatsApp
            <span aria-hidden className="tlink__arrow">
              →
            </span>
          </a>
        </div>

        <form onSubmit={handleSubmit} noValidate className="grid gap-(--space-sm)">
          <div>
            <label htmlFor="contact-name" className="t-label mb-(--space-3xs) block text-navy">
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
              className="field"
            />
            <p id="contact-name-error" className="t-label field-note">
              {errors.name ? "Falta tu nombre." : null}
            </p>
          </div>

          <div>
            <label htmlFor="contact-phone" className="t-label mb-(--space-3xs) block text-navy">
              WhatsApp (opcional)
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+58 ..."
              className="field"
            />
          </div>

          <div>
            <label htmlFor="contact-message" className="t-label mb-(--space-3xs) block text-navy">
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
              className="field resize-none"
            />
            <p id="contact-message-error" className="t-label field-note">
              {errors.message ? "Escribe qué necesitas." : null}
            </p>
          </div>

          <button type="submit" className="btn btn--signal justify-self-start">
            <IconBrandWhatsapp size={20} stroke={1.75} aria-hidden />
            Enviar por WhatsApp
          </button>
        </form>
      </div>
    </section>
  );
}
