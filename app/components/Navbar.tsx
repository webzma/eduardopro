const links = [
  { href: "#oficio", label: "EL OFICIO" },
  { href: "#coleccion", label: "COLECCIÓN" },
  { href: "#testimonios", label: "TESTIMONIOS" },
];

export default function Navbar() {
  return (
    <nav className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-6 md:px-10">
        <a
          href="#"
          className="font-display text-[26px] font-bold tracking-tight text-cream md:text-[30px]"
        >
          EduardoPro
        </a>
        <div className="hidden items-center gap-9 font-mono text-[11px] tracking-[0.22em] text-ink md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="navlink transition-colors hover:text-cream"
            >
              {link.label}
            </a>
          ))}
        </div>
        <a
          href="#contacto"
          className="btn-accent bg-accent px-6 py-3 font-mono text-[11px] font-medium tracking-[0.2em] text-[#171412] transition-colors"
        >
          CONTACTO
        </a>
      </div>
    </nav>
  );
}
