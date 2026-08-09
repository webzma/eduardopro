import Link from "next/link";
import { whatsappOrderUrl } from "../lib/site";
import { getActiveProducts } from "../lib/products";
import Image from "next/image";
import { IconScissors, IconBrandWhatsapp } from "@tabler/icons-react";
import { imageSrc } from "../lib/images";

// F6 · Product card grid — uniform on purpose. The rhythm comes from the
// products, not from varying the tiles.
export default async function Products() {
  const products = await getActiveProducts();

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
          // Tailwind's grid-cols-N expands to repeat(N, minmax(0,1fr)), so the
          // image-bearing tracks can't blow out on a long product name.
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const soldOut = product.stock <= 0;
              return (
                <article
                  key={product.id}
                  className={`group/card border-2 border-coal bg-paper shadow-[6px_6px_0_var(--coal)] transition-[transform,box-shadow] duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[9px_9px_0_var(--coal)] focus-within:-translate-x-[3px] focus-within:-translate-y-[3px] focus-within:shadow-[9px_9px_0_var(--coal)] motion-reduce:transition-none flex flex-col ${soldOut ? "[&_img]:grayscale [&_img]:opacity-50 hover:translate-x-0 hover:translate-y-0 hover:shadow-[6px_6px_0_var(--coal)]" : ""}`}
                >
                  <Link
                    href={`/producto/${product.id}`}
                    tabIndex={-1}
                    aria-hidden
                    className="halftone relative block aspect-square overflow-hidden border-b-2 border-coal bg-paper2"
                  >
                    <Image
                      src={imageSrc(product.image)}
                      alt={product.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="transition-transform duration-[560ms] group-hover/card:scale-[1.02] motion-reduce:transition-none object-cover"
                    />
                    {soldOut ? (
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] absolute top-0 left-0 border-r-2 border-b-2 border-coal bg-navy px-2 py-1 text-paper">
                        Agotado
                      </span>
                    ) : product.stock <= 3 ? (
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] tabular-nums absolute top-0 left-0 border-r-2 border-b-2 border-coal bg-signal px-2 py-1 text-paper">
                        Últimas {product.stock}
                      </span>
                    ) : null}
                  </Link>

                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy">{product.category}</p>
                    <h3 className="mt-1 font-display text-2xl leading-tight uppercase">
                      <Link
                        href={`/producto/${product.id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {product.name}
                      </Link>
                    </h3>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t-2 border-navy pt-2">
                      <span className="tabular-nums font-display text-3xl leading-none text-signal">
                        ${product.price}
                      </span>
                      {soldOut ? (
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ash">Sin stock</span>
                      ) : (
                        <a
                          href={whatsappOrderUrl(
                            `Hola, quiero pedir: ${product.name}`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/tlink inline-flex items-center gap-[0.4em] font-display font-normal uppercase tracking-[0.04em] whitespace-nowrap text-signal shadow-[inset_0_-2px_0_var(--signal)] transition-shadow duration-[180ms] hover:text-paper hover:shadow-[inset_0_-0.5em_0_var(--signal)] active:text-coal motion-reduce:transition-none text-base"
                        >
                          <IconBrandWhatsapp size={18} stroke={1.75} aria-hidden />
                          Pedir
                          <span aria-hidden className="transition-transform duration-[180ms] group-hover/tlink:translate-x-[3px] motion-reduce:transition-none">
                            →
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
