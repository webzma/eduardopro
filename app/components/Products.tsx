import Reveal from "./Reveal";
import { whatsappOrderUrl } from "../lib/site";
import { getActiveProducts } from "../lib/products";
import { ScissorsIcon } from "./icons";

export default async function Products() {
  const products = await getActiveProducts();

  return (
    <section
      id="coleccion"
      className="border-t border-hair bg-bg2 py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <Reveal className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-5 font-mono text-[11px] tracking-[0.3em] text-accent">
              COLECCIÓN
            </p>
            <h2 className="font-display text-[46px] font-bold leading-none tracking-tight md:text-[68px]">
              La colección
            </h2>
          </div>
          <p className="max-w-sm text-[15px] text-ink md:text-right">
            Esenciales que no pueden faltar. Elige, pide por WhatsApp y recíbelo
            en casa.
          </p>
        </Reveal>

        {products.length === 0 ? (
          <div className="flex flex-col items-center border border-hair bg-bg px-6 py-20 text-center">
            <span className="mb-6 flex size-16 items-center justify-center rounded-full border border-accent/30 bg-(--accent-soft) text-accent">
              <ScissorsIcon className="size-7" />
            </span>
            <p className="font-display text-[28px] leading-tight text-cream md:text-[34px]">
              Afilando la colección
            </p>
            <p className="mt-3 max-w-xs font-mono text-[11px] tracking-[0.16em] text-ink">
              PRÓXIMAMENTE NUEVOS PRODUCTOS
            </p>
            <span aria-hidden className="mt-8 h-px w-10 bg-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, index) => {
              const soldOut = product.stock <= 0;
              return (
                <Reveal key={product.id} delay={(index % 4) * 90}>
                  <div
                    className={`prod-card group flex h-full flex-col border border-hair bg-bg ${
                      soldOut ? "prod-card--sold" : ""
                    }`}
                  >
                    <div className="relative overflow-hidden bg-[#211d19]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.image}
                        alt={product.name}
                        className="prod-img h-56 w-full object-cover"
                      />
                      {soldOut ? (
                        <span className="absolute left-4 top-4 border border-[#e08a8a]/40 bg-bg/85 px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-[#e08a8a] backdrop-blur-sm">
                          AGOTADO
                        </span>
                      ) : product.stock <= 3 ? (
                        <span className="absolute left-4 top-4 border border-accent/40 bg-bg/85 px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-accent backdrop-blur-sm">
                          ÚLTIMAS {product.stock}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <p className="mb-2 font-mono text-[10px] tracking-[0.24em] text-ink">
                        {product.category}
                      </p>
                      <h3 className="mb-3 font-display text-[24px]">
                        {product.name}
                      </h3>
                      <div className="mt-auto flex items-center justify-between border-t border-hair pt-4">
                        <span className="font-display text-[26px] text-accent">
                          ${product.price}
                        </span>
                        {soldOut ? (
                          <span className="font-mono text-[12px] tracking-[0.16em] text-ink">
                            AGOTADO
                          </span>
                        ) : (
                          <a
                            href={whatsappOrderUrl(
                              `Hola, quiero pedir: ${product.name}`,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="wa-link group/cta inline-flex items-center gap-2 font-mono text-[12px] tracking-[0.16em] text-cream transition-colors"
                          >
                            PEDIR
                            <span className="transition-transform duration-300 group-hover/cta:translate-x-1">
                              →
                            </span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
