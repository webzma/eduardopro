import Link from "next/link";
import Image from "next/image";
import { IconBrandWhatsapp } from "@tabler/icons-react";
import { whatsappOrderUrl } from "../lib/site";
import { imageSrc } from "../lib/images";
import type { Product } from "../lib/products";

/* La tarjeta de producto, una sola vez. La usan la portada —que enseña seis— y
 * el catálogo completo: si viviera copiada en las dos, la primera vez que se
 * cambiara el precio o el botón de pedir, una de las dos se quedaría atrás. */
export default function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;

  return (
    <article
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy">
          {product.category}
        </p>
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
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ash">
              Sin stock
            </span>
          ) : (
            <a
              href={whatsappOrderUrl(`Hola, quiero pedir: ${product.name}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="group/tlink inline-flex items-center gap-[0.4em] font-display font-normal uppercase tracking-[0.04em] whitespace-nowrap text-signal shadow-[inset_0_-2px_0_var(--signal)] transition-shadow duration-[180ms] hover:text-paper hover:shadow-[inset_0_-0.5em_0_var(--signal)] active:text-coal motion-reduce:transition-none text-base"
            >
              <IconBrandWhatsapp size={18} stroke={1.75} aria-hidden />
              Pedir
              <span
                aria-hidden
                className="transition-transform duration-[180ms] group-hover/tlink:translate-x-[3px] motion-reduce:transition-none"
              >
                →
              </span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
