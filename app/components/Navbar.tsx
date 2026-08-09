import { IconBrandWhatsapp } from "@tabler/icons-react";
import { WHATSAPP_URL } from "../lib/site";

const links = [
  { href: "#oficio", label: "El oficio" },
  { href: "#coleccion", label: "Catálogo" },
  { href: "#testimonios", label: "Testimonios" },
  { href: "#ubicacion", label: "Ubicación" },
  { href: "#contacto", label: "Contacto" },
];

// Studied DNA, declared override: Hallmark normally routes away from the
// wordmark-left / links-centre / button-right bar, because it is the most
// recognisable generated nav. Every one of the reference captures uses exactly
// that bar, sticky, so the DNA wins here — the slab wordmark and the hard-shadow
// button are what keep it from reading generic.
export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-coal bg-paper">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-(--space-md) px-(--page-gutter) py-(--space-xs)">
        <a href="#" className="flex items-baseline gap-(--space-2xs)">
          <span className="font-display text-xl leading-none uppercase sm:text-2xl">
            EduardoPro
          </span>
          <span className="t-label hidden text-signal sm:inline">
            Barbería
          </span>
        </a>

        {/* Hidden below lg rather than folded into a hamburger: every link is a
            section of this one page, and the footer nav repeats all five. */}
        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-x-(--space-md)">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="mastlink t-label block whitespace-nowrap py-1"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--signal shrink-0 px-(--space-md) text-base"
        >
          <IconBrandWhatsapp size={18} stroke={1.75} aria-hidden />
          Pedir
        </a>
      </div>
    </header>
  );
}
