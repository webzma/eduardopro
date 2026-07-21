"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "#oficio", label: "EL OFICIO" },
  { href: "#coleccion", label: "COLECCIÓN" },
  { href: "#testimonios", label: "TESTIMONIOS" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-hair bg-bg/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1280px] items-center justify-between px-6 transition-all duration-500 md:px-10 ${
          scrolled ? "py-4" : "py-6"
        }`}
      >
        <a
          href="#"
          className="font-display font-bold tracking-tight text-cream transition-all duration-500"
          style={{ fontSize: scrolled ? "24px" : "30px" }}
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
