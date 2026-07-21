const links = [
  { href: "#oficio", label: "EL OFICIO" },
  { href: "#coleccion", label: "COLECCIÓN" },
  { href: "#contacto", label: "CONTACTO" },
];

export default function Footer() {
  return (
    <footer className="bg-bg pb-10 pt-16">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="flex flex-col items-start justify-between gap-6 border-t border-hair pt-10 md:flex-row md:items-center">
          <a href="#" className="font-display text-[34px] font-bold text-cream">
            EduardoPro
          </a>
          <div className="flex flex-col gap-4 font-mono text-[11px] tracking-[0.22em] text-ink md:flex-row md:items-center md:gap-9">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-accent"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <p className="mt-10 font-mono text-[10px] tracking-[0.24em] text-ink">
          © 2026 EDUARDOPRO — TODOS LOS DERECHOS RESERVADOS
        </p>
      </div>
    </footer>
  );
}
