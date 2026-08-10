import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowLeft, IconScissors } from "@tabler/icons-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { getActiveProducts } from "../lib/products";
import { LOCATION_LABEL } from "../lib/site";

// El catálogo se lee en vivo desde Supabase, así que renderizamos por request:
// un producto que se agota tiene que salir agotado, no cacheado de ayer.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo completo — EduardoPro",
  description: `Todos los suministros de barbería disponibles: máquinas, navajas, tijeras, ceras y repuestos a precio de gremio en ${LOCATION_LABEL}. Pide por WhatsApp.`,
};

export default async function CatalogPage() {
  const products = await getActiveProducts();

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-paper py-18 md:py-28">
          <div className="mx-auto max-w-7xl px-[clamp(1rem,4vw,2.5rem)]">
            <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="font-script text-[length:var(--text-lg)] leading-[1.3] text-signal normal-case tracking-normal">
                  Todo lo que hay en la tienda
                </p>
                <h1 className="font-display font-normal uppercase text-[length:var(--text-display-s)] leading-[1.06] tracking-[-0.01em] [overflow-wrap:anywhere] min-w-0">
                  El catálogo completo.
                </h1>
              </div>
              {products.length > 0 ? (
                <p className="text-xs font-semibold uppercase tracking-[0.18em] tabular-nums text-navy">
                  {products.length}{" "}
                  {products.length === 1 ? "producto" : "productos"} · pide por
                  WhatsApp
                </p>
              ) : null}
            </header>

            {products.length === 0 ? (
              <div className="mt-12 flex flex-col items-center border-2 border-coal bg-paper2 px-[clamp(1rem,4vw,2.5rem)] py-28 text-center shadow-[6px_6px_0_var(--coal)]">
                <span className="flex size-16 items-center justify-center border-2 border-coal bg-signal text-paper">
                  <IconScissors size={28} stroke={1.75} />
                </span>
                <p
                  className="font-display font-normal uppercase text-[length:var(--text-display-s)] leading-[1.06] tracking-[-0.01em] [overflow-wrap:anywhere] min-w-0 mt-6"
                  style={{ fontSize: "2rem" }}
                >
                  Afilando el catálogo.
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] mt-2 text-coal2">
                  Próximamente nuevos productos
                </p>
              </div>
            ) : (
              <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* La salida, abajo del todo: quien ha recorrido el catálogo entero
                está justo en el sitio donde no hay nada más que hacer. */}
            <div className="mt-12 flex justify-center">
              <Link
                href="/#coleccion"
                className="group/back inline-flex items-center gap-2 font-display text-lg uppercase leading-none text-navy underline-offset-[6px] hover:underline"
              >
                <IconArrowLeft
                  size={20}
                  stroke={2}
                  aria-hidden
                  className="transition-transform duration-[180ms] group-hover/back:-translate-x-[3px] motion-reduce:transition-none"
                />
                Volver a la portada
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
