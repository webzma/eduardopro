import Link from "next/link";
import { IconLock } from "@tabler/icons-react";
import { WHATSAPP_URL } from "../lib/site";

const links = [
  { href: "/#oficio", label: "El oficio" },
  { href: "/#coleccion", label: "Catálogo" },
  { href: "/#testimonios", label: "Testimonios" },
  { href: "/#ubicacion", label: "Ubicación" },
  { href: "/#contacto", label: "Contacto" },
];

// Ft4 · Dense typographic colophon. Closes the page like a printed sign-off
// instead of cataloguing a sitemap this shop doesn't have.
export default function Footer() {
  return (
    <>
      <div aria-hidden className="pole" />
      <footer
        className="bg-coal py-12 text-paper"
        style={{ ["--focus-ring" as string]: "var(--paper)" }}
      >
        <div className="mx-auto max-w-7xl px-[clamp(1rem,4vw,2.5rem)]">
          <p
            className="font-display font-normal uppercase text-[length:var(--text-display)] leading-[1.04] tracking-[-0.015em] [overflow-wrap:anywhere] min-w-0"
            style={{ fontSize: "clamp(2.25rem, 7vw, 4.5rem)" }}
          >
            EduardoPro
          </p>
          {/* On ink the crimson can't carry text — this is the lifted red. */}
          <p className="font-script text-[length:var(--text-lg)] leading-[1.3] text-signal normal-case tracking-normal text-signallift">Con filo desde 2020</p>

          <p className="mt-6 max-w-[62ch] text-sm leading-relaxed">
            Suministros de barbería · Máquinas, navajas, ceras y repuestos
            comprados directo al distribuidor · Precio de gremio, al mayor y al
            detal · Tienda en Aroa, Yaracuy · Enviamos a donde estés · En el
            oficio desde 2020 · Pedidos por{" "}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-signallift"
            >
              WhatsApp
            </a>
            .
          </p>

          <nav
            aria-label="Secundaria"
            className="mt-8 border-t-2 border-paper/30 pt-4"
          >
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block whitespace-nowrap py-1 text-sm font-semibold tracking-widest uppercase hover:text-signallift"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* El acceso del equipo vive aquí abajo, no en la barra superior: el
              cliente que entra a comprar no tiene por qué encontrárselo antes
              que el catálogo, y quien trabaja aquí sabe dónde buscarlo. */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t-2 border-paper/30 pt-6">
            <p className="text-xs font-semibold tracking-[0.18em] tabular-nums uppercase opacity-70">
              © 2026 EduardoPro — Todos los derechos reservados
            </p>
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center gap-2 border-2 border-paper px-4 py-2 min-h-11 font-display text-sm tracking-[0.04em] whitespace-nowrap uppercase transition-colors duration-[180ms] hover:bg-paper hover:text-coal motion-reduce:transition-none"
            >
              <IconLock size={16} stroke={1.75} aria-hidden />
              Acceso del equipo
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
