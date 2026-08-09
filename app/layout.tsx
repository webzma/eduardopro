import type { Metadata } from "next";
import { Bevan, Yellowtail, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Display: a heavy Egyptian slab — the painted barbershop sign. Bevan ships at
// 400 only, so nothing may ask it for a bolder weight: the browser would
// synthesise a fake bold and the slabs would smear.
const bevan = Bevan({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "400",
  fallback: ["Rockwell", "Georgia", "serif"],
});

// The one flourish: a brush script, red, sitting above each section head.
const yellowtail = Yellowtail({
  // --font-script-face, no --font-script: esa segunda la define Tailwind en
  // @theme como var(--font-script-stack), y usar el mismo nombre en los dos
  // sitios crea una referencia circular que anula la propiedad.
  variable: "--font-script-face",
  subsets: ["latin"],
  weight: "400",
  fallback: ["Brush Script MT", "cursive"],
});

// Body carries the small tracked-out caps too — dropping IBM Plex Mono keeps
// the page at the three-family ceiling now that the script has a slot.
const plexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "EduardoPro — Suministros de Barbería · Aroa, Yaracuy",
  description:
    "Máquinas, navajas, ceras y repuestos comprados directo al distribuidor, a precio de gremio. Tienda en Aroa, Yaracuy — pasa a verla o escríbenos, también enviamos a donde estés.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${plexSans.variable} ${bevan.variable} ${yellowtail.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
