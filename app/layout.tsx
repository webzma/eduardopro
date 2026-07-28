import type { Metadata } from "next";
import { Big_Shoulders, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Display: industrial condensed, the painted-sign voice. Variable on opsz so the
// hero can sit at a different optical size than the section heads.
const bigShoulders = Big_Shoulders({
  variable: "--font-heading",
  subsets: ["latin"],
  axes: ["opsz"],
  // next/font has no metric-override data for this family, so the fallback is
  // named explicitly — a condensed one, to keep the reflow small.
  fallback: ["Arial Narrow", "Helvetica Neue Condensed", "sans-serif"],
});

// Body + mono are one superfamily, so the small type reads as a single system.
const plexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-caption",
  subsets: ["latin"],
  weight: ["400", "500"],
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
      className={`${plexSans.variable} ${bigShoulders.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
