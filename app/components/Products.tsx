import Link from "next/link";
import { getActiveProducts } from "../lib/products";
import { IconScissors, IconArrowRight } from "@tabler/icons-react";
import ProductCard from "./ProductCard";

/** Lo que se enseña en la portada. Seis llenan dos filas de tres y se ven
 *  enteras sin desplazarse hasta el final: la portada es el escaparate, no el
 *  almacén. El resto vive en /catalogo. */
const EN_PORTADA = 6;

// F6 · Product card grid — uniform on purpose. The rhythm comes from the
// products, not from varying the tiles.
export default async function Products() {
  const products = await getActiveProducts();
  const shown = products.slice(0, EN_PORTADA);
  const rest = products.length - shown.length;

  return (
    <section id="coleccion" className="bg-paper py-18 md:py-28">
      <div className="mx-auto max-w-7xl px-[clamp(1rem,4vw,2.5rem)]">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-script text-[length:var(--text-lg)] leading-[1.3] text-signal normal-case tracking-normal">Precios honestos, en el mostrador</p>
            <h2 className="font-display font-normal uppercase text-[length:var(--text-display-s)] leading-[1.06] tracking-[-0.01em] [overflow-wrap:anywhere] min-w-0">El catálogo.</h2>
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
            <p className="font-display font-normal uppercase text-[length:var(--text-display-s)] leading-[1.06] tracking-[-0.01em] [overflow-wrap:anywhere] min-w-0 mt-6" style={{ fontSize: "2rem" }}>
              Afilando el catálogo.
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mt-2 text-coal2">
              Próximamente nuevos productos
            </p>
          </div>
        ) : (
          <>
            {/* Tailwind's grid-cols-N expands to repeat(N, minmax(0,1fr)), so the
                image-bearing tracks can't blow out on a long product name. */}
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* El botón dice cuántos faltan. "Ver todo" a secas no da ninguna
                razón para pulsarlo; "y 19 más" sí. */}
            <div className="mt-12 flex justify-center">
              <Link
                href="/catalogo"
                className="group/cta inline-flex items-center gap-3 border-2 border-coal bg-signal px-6 py-3 font-display text-lg uppercase leading-none text-paper shadow-[6px_6px_0_var(--coal)] transition-[transform,box-shadow] duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[9px_9px_0_var(--coal)] focus-visible:-translate-x-[3px] focus-visible:-translate-y-[3px] focus-visible:shadow-[9px_9px_0_var(--coal)] focus-visible:outline-none motion-reduce:transition-none"
              >
                {rest > 0 ? `Ver los ${products.length} productos` : "Ver todo el catálogo"}
                <IconArrowRight
                  size={20}
                  stroke={2}
                  aria-hidden
                  className="transition-transform duration-[180ms] group-hover/cta:translate-x-[3px] motion-reduce:transition-none"
                />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
