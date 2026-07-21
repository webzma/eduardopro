import Reveal from "./Reveal";
import { whatsappOrderUrl } from "../lib/site";
import { getActiveProducts } from "../lib/products";

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
          <p className="border border-hair bg-bg p-10 text-center font-mono text-[12px] tracking-[0.16em] text-ink">
            PRÓXIMAMENTE NUEVOS PRODUCTOS
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, index) => {
              const soldOut = product.stock <= 0;
              return (
                <Reveal key={product.id} delay={(index % 4) * 90}>
                  <div className="prod-card group flex h-full flex-col border border-hair bg-bg transition-colors duration-500">
                    <div className="relative overflow-hidden bg-[#211d19]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.image}
                        alt={product.name}
                        className="prod-img h-56 w-full object-cover"
                      />
                      {soldOut ? (
                        <span className="absolute left-4 top-4 bg-bg/85 px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-[#e08a8a] backdrop-blur-sm">
                          AGOTADO
                        </span>
                      ) : product.stock <= 3 ? (
                        <span className="absolute left-4 top-4 bg-bg/85 px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-accent backdrop-blur-sm">
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
                            className="wa-link font-mono text-[12px] tracking-[0.16em] text-cream transition-colors"
                          >
                            PEDIR →
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
