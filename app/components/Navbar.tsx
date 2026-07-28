const links = [
  { href: "#oficio", label: "El oficio" },
  { href: "#coleccion", label: "Catálogo" },
  { href: "#testimonios", label: "Testimonios" },
  { href: "#ubicacion", label: "Ubicación" },
  { href: "#contacto", label: "Contacto" },
];

// N6 · Newspaper masthead. Static, in flow — the shop sign at the top of the
// page, not a bar that follows you down it. Replaces the fixed wordmark +
// link-row + button-right bar, which is the most-recognised generated nav.
export default function Navbar() {
  return (
    <header className="border-b-2 border-coal bg-paper">
      <div className="mx-auto max-w-7xl px-(--page-gutter) pt-(--space-md) pb-(--space-sm) text-center">
        <a
          href="#"
          className="t-display block leading-none"
          style={{ fontSize: "clamp(2.75rem, 9vw, 5.5rem)" }}
        >
          EduardoPro
        </a>
        <p className="t-label mt-(--space-2xs) text-coal2">
          Suministros de barbería · Aroa, Yaracuy · Desde 2020
        </p>

        <nav aria-label="Principal" className="mt-(--space-sm)">
          <ul className="flex flex-wrap items-center justify-center gap-x-(--space-md) gap-y-(--space-2xs)">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="mastlink block whitespace-nowrap py-1 text-sm font-semibold tracking-widest uppercase"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Double rule — the broadsheet close under a masthead. */}
      <div aria-hidden className="border-t-2 border-coal">
        <div className="h-0.75 border-t-2 border-coal" />
      </div>
    </header>
  );
}
