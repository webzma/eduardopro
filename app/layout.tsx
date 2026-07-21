import type { Metadata } from "next";
import { Playfair_Display, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-caption",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "EduardoPro — Suministros de Barbería · Caracas",
  description:
    "Máquinas, navajas, ceras y repuestos comprados directo al distribuidor, a precio de gremio. Despacho en 24 horas y venta al mayor para barberías. Caracas, Venezuela.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${playfair.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
