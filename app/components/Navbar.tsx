import Link from "next/link";
import { IconBrandWhatsapp } from "@tabler/icons-react";
import { WHATSAPP_URL } from "../lib/site";

const links = [
  { href: "/#oficio", label: "El oficio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/#testimonios", label: "Testimonios" },
  { href: "/#ubicacion", label: "Ubicación" },
  { href: "/#contacto", label: "Contacto" },
];

// Studied DNA, declared override: Hallmark normally routes away from the
// wordmark-left / links-centre / button-right bar, because it is the most
// recognisable generated nav. Every one of the reference captures uses exactly
// that bar, sticky, so the DNA wins here — the slab wordmark and the hard-shadow
// button are what keep it from reading generic.
export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-coal bg-paper">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-[clamp(1rem,4vw,2.5rem)] py-3 sm:gap-6">
        {/* min-w-0 solo mientras hace falta: por debajo de `sm` el logotipo se
            recorta para dejarle sitio al botón, pero en cuanto entran los
            enlaces vuelve a ser intocable — un logotipo cortado no es una
            solución responsive, es un error visible. */}
        <Link href="/" className="flex min-w-0 items-baseline gap-2 sm:min-w-fit">
          <span className="truncate font-display text-xl leading-none uppercase sm:text-2xl">
            EduardoPro
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] hidden text-signal sm:inline">
            Barbería
          </span>
        </Link>

        {/* Ocultos por debajo de `xl` en vez de plegarse en un menú: cada
            enlace es una sección de la portada y el pie los repite los cinco.
            El corte estaba en `lg`, donde los tres bloques suman 1139px y el
            botón se salía — se veía como un logotipo recortado. */}
        <nav aria-label="Principal" className="hidden xl:block">
          <ul className="flex items-center gap-x-6">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="shadow-[inset_0_-2px_0_transparent] transition-shadow duration-[180ms] hover:shadow-[inset_0_-2px_0_var(--signal)] active:text-coal motion-reduce:transition-none text-xs font-semibold uppercase tracking-[0.18em] block whitespace-nowrap py-1"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          // En el teléfono el botón se aprieta —menos aire lateral y un cuerpo
          // menor— pero conserva los 44px de alto: es el destino principal de
          // la barra y tiene que seguir siendo cómodo con el pulgar.
          className="inline-flex items-center justify-center gap-2 py-3 min-h-11 border-2 border-coal shadow-[4px_4px_0_var(--coal)] font-display font-normal tracking-[0.04em] uppercase whitespace-nowrap transition-[transform,box-shadow,background-color] duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--coal)] active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none bg-signal text-paper shrink-0 px-3 text-sm sm:px-6 sm:text-base"
        >
          <IconBrandWhatsapp size={18} stroke={1.75} aria-hidden />
          Pedir
        </a>
      </div>
    </header>
  );
}
