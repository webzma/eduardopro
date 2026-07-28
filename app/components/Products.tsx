import { whatsappOrderUrl } from "../lib/site";
import { getActiveProducts } from "../lib/products";
import { ScissorsIcon } from "./icons";

// F6 · Product card grid — uniform on purpose. The rhythm comes from the
// products, not from varying the tiles.
export default async function Products() {
  const products = await getActiveProducts();

  return (
    <section id="coleccion" className="bg-paper py-(--space-2xl) md:py-(--space-3xl)">
      <div className="mx-auto max-w-7xl px-(--page-gutter)">
        <header className="flex flex-col justify-between gap-(--space-sm) md:flex-row md:items-end">
          <h2 className="t-head">El catálogo.</h2>
          {products.length > 0 ? (
            <p className="t-label tnum text-navy">
              {products.length}{" "}
              {products.length === 1 ? "producto" : "productos"} · pide por
              WhatsApp
            </p>
          ) : null}
        </header>

        {products.length === 0 ? (
          <div className="mt-(--space-xl) flex flex-col items-center border-2 border-coal bg-paper2 px-(--page-gutter) py-(--space-3xl) text-center shadow-(--shadow-hard)">
            <span className="flex size-16 items-center justify-center border-2 border-coal bg-signal text-coal">
              <ScissorsIcon className="size-7" />
            </span>
            <p className="t-head mt-(--space-md)" style={{ fontSize: "2rem" }}>
              Afilando el catálogo.
            </p>
            <p className="t-label mt-(--space-2xs) text-coal2">
              Próximamente nuevos productos
            </p>
          </div>
        ) : (
          // Tailwind's grid-cols-N expands to repeat(N, minmax(0,1fr)), so the
          // image-bearing tracks can't blow out on a long product name.
          <div className="mt-(--space-xl) grid grid-cols-1 gap-(--space-md) sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => {
              const soldOut = product.stock <= 0;
              return (
                <article
                  key={product.id}
                  className={`card flex flex-col ${soldOut ? "card--sold" : ""}`}
                >
                  <div className="halftone relative aspect-square overflow-hidden border-b-2 border-coal bg-paper2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="card__img size-full object-cover"
                    />
                    {soldOut ? (
                      <span className="t-label absolute top-0 left-0 border-r-2 border-b-2 border-coal bg-navy px-(--space-2xs) py-1 text-paper">
                        Agotado
                      </span>
                    ) : product.stock <= 3 ? (
                      <span className="t-label tnum absolute top-0 left-0 border-r-2 border-b-2 border-coal bg-signal px-(--space-2xs) py-1 text-coal">
                        Últimas {product.stock}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col p-(--space-sm)">
                    <p className="t-label text-navy">{product.category}</p>
                    <h3 className="mt-(--space-3xs) font-display text-2xl leading-tight font-extrabold uppercase">
                      {product.name}
                    </h3>
                    <div className="mt-(--space-md) flex flex-wrap items-center justify-between gap-(--space-2xs) border-t-2 border-navy pt-(--space-2xs)">
                      <span className="tnum font-display text-3xl leading-none font-extrabold text-signaldeep">
                        ${product.price}
                      </span>
                      {soldOut ? (
                        <span className="t-label text-ash">Sin stock</span>
                      ) : (
                        <a
                          href={whatsappOrderUrl(
                            `Hola, quiero pedir: ${product.name}`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tlink text-base"
                        >
                          Pedir
                          <span aria-hidden className="tlink__arrow">
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
