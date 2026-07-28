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
        className="bg-coal py-(--space-xl) text-paper"
        style={{ ["--focus-ring" as string]: "var(--paper)" }}
      >
        <div className="mx-auto max-w-7xl px-(--page-gutter)">
          <p
            className="t-display"
            style={{ fontSize: "clamp(2.25rem, 7vw, 4.5rem)" }}
          >
            EduardoPro
          </p>

          <p className="mt-(--space-md) max-w-[62ch] font-mono text-sm leading-relaxed">
            Suministros de barbería · Máquinas, navajas, ceras y repuestos
            comprados directo al distribuidor · Precio de gremio, al mayor y al
            detal · Tienda en Aroa, Yaracuy · Enviamos a donde estés · En el
            oficio desde 2020 · Pedidos por{" "}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-signal"
            >
              WhatsApp
            </a>
            .
          </p>

          <nav
            aria-label="Secundaria"
            className="mt-(--space-lg) border-t-2 border-paper/30 pt-(--space-sm)"
          >
            <ul className="flex flex-wrap gap-x-(--space-md) gap-y-(--space-2xs)">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="block whitespace-nowrap py-1 text-sm font-semibold tracking-widest uppercase hover:text-signal"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <p className="tnum mt-(--space-md) font-mono text-xs tracking-widest uppercase opacity-70">
            © 2026 EduardoPro — Todos los derechos reservados
          </p>
        </div>
      </footer>
    </>
  );
}
