import { WHATSAPP_URL } from "../lib/site";

const links = [
  { href: "#oficio", label: "El oficio" },
  { href: "#coleccion", label: "Catálogo" },
  { href: "#testimonios", label: "Testimonios" },
  { href: "#ubicacion", label: "Ubicación" },
  { href: "#contacto", label: "Contacto" },
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
                  <a
                    href={link.href}
                    className="block whitespace-nowrap py-1 text-sm font-semibold tracking-widest uppercase hover:text-signallift"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <p className="text-xs font-semibold uppercase tracking-[0.18em] tabular-nums mt-6 opacity-70">
            © 2026 EduardoPro — Todos los derechos reservados
          </p>
        </div>
      </footer>
    </>
  );
}
