import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  IconArrowLeft,
  IconBrandWhatsapp,
  IconMapPin,
  IconTruckDelivery,
} from "@tabler/icons-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { getActiveProduct, getActiveProducts } from "@/app/lib/products";
import { getRate } from "@/app/lib/rate";
import { formatBs, formatUsd } from "@/app/lib/money";
import { imageSrc } from "@/app/lib/images";
import { LOCATION, whatsappOrderUrl } from "@/app/lib/site";

// El catálogo se lee en vivo: un producto agotado o retirado no puede seguir
// sirviéndose desde una copia estática.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getActiveProduct(id);
  if (!product) return { title: "Producto no encontrado · EduardoPro" };

  const description = `${product.category || "Suministros de barbería"} · ${formatUsd(product.price)} · Precio de gremio en ${LOCATION.town}, ${LOCATION.region}. Pide por WhatsApp.`;
  return {
    title: `${product.name} · EduardoPro`,
    description,
    // Si el enlace se pega en WhatsApp, que se vea la foto del producto: es
    // por donde entra cada pedido de esta tienda.
    openGraph: {
      title: product.name,
      description,
      images: [{ url: imageSrc(product.image) }],
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const [product, rate] = await Promise.all([
    getActiveProduct(id),
    getRate(),
  ]);
  if (!product) notFound();

  const soldOut = product.stock <= 0;
  // Los demás productos del catálogo, para no dejar la ficha sin salida.
  const others = (await getActiveProducts())
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  const pedido = whatsappOrderUrl(
    `Hola, quiero pedir: ${product.name} (${formatUsd(product.price)}).`,
  );

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-paper py-10 md:py-16">
          <div className="mx-auto max-w-7xl px-[clamp(1rem,4vw,2.5rem)]">
            <Link
              href="/#coleccion"
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-navy uppercase underline-offset-4 hover:underline"
            >
              <IconArrowLeft size={16} stroke={2} aria-hidden />
              Volver al catálogo
            </Link>

            {/* La foto ocupa la mitad en escritorio y el ancho entero en el
                teléfono: en una tienda de herramienta, la foto ES la ficha. */}
            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
              <div
                className={`halftone relative aspect-square overflow-hidden border-2 border-coal bg-paper2 shadow-[6px_6px_0_var(--coal)] ${
                  soldOut ? "[&_img]:opacity-50 [&_img]:grayscale" : ""
                }`}
              >
                <Image
                  src={imageSrc(product.image)}
                  alt={product.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
                {soldOut ? (
                  <span className="absolute top-0 left-0 border-r-2 border-b-2 border-coal bg-navy px-3 py-1.5 text-xs font-semibold tracking-[0.18em] text-paper uppercase">
                    Agotado
                  </span>
                ) : product.stock <= 3 ? (
                  <span className="absolute top-0 left-0 border-r-2 border-b-2 border-coal bg-signal px-3 py-1.5 text-xs font-semibold tracking-[0.18em] text-paper uppercase tabular-nums">
                    Últimas {product.stock}
                  </span>
                ) : null}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.18em] text-navy uppercase">
                  {product.category || "Barbería"}
                </p>
                <h1 className="mt-1 min-w-0 font-display text-[clamp(2rem,6vw,3.25rem)] leading-[1.06] font-normal tracking-[-0.01em] uppercase [overflow-wrap:anywhere]">
                  {product.name}
                </h1>

                <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t-2 border-navy pt-4">
                  <span className="font-display text-[clamp(2.5rem,8vw,4rem)] leading-none text-signal tabular-nums">
                    {formatUsd(product.price)}
                  </span>
                  {/* En bolívares a la tasa del día. Si no hay tasa se calla:
                      un número inventado aquí es un precio mal cobrado. */}
                  {rate ? (
                    <span className="text-[length:var(--text-md)] tabular-nums text-coal2">
                      {formatBs(product.price, rate.value)}
                      <span className="ml-1 text-xs tracking-[0.18em] uppercase opacity-70">
                        {rate.source === "bcv" ? "· tasa BCV" : "· tasa del día"}
                      </span>
                    </span>
                  ) : null}
                </div>

                <p className="mt-6 max-w-[46ch] text-[length:var(--text-md)] leading-relaxed text-coal2">
                  {soldOut
                    ? "Ahora mismo no queda en tienda. Escríbenos y te avisamos en cuanto entre."
                    : `Precio de gremio, el mismo que paga la barbería. Disponible en la tienda de ${LOCATION.town} y con envío a donde estés.`}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <a
                    href={pedido}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 py-3 min-h-11 border-2 border-coal shadow-[4px_4px_0_var(--coal)] font-display font-normal tracking-[0.04em] uppercase whitespace-nowrap px-4 text-sm sm:px-8 sm:text-[length:var(--text-md)] transition-[transform,box-shadow,background-color] duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--coal)] active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none bg-signal text-paper"
                  >
                    <IconBrandWhatsapp size={20} stroke={1.75} aria-hidden />
                    {soldOut ? "Avísame cuando entre" : "Pedir por WhatsApp"}
                  </a>
                </div>

                <dl className="mt-10 border-t-2 border-navy">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-2 border-navy py-3">
                    <dt className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-navy uppercase">
                      <IconMapPin size={15} stroke={2} aria-hidden />
                      En tienda
                    </dt>
                    <dd className="text-sm text-coal2">
                      {LOCATION.town}, {LOCATION.region} — llévatelo el mismo día
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-2 border-navy py-3">
                    <dt className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-navy uppercase">
                      <IconTruckDelivery size={15} stroke={2} aria-hidden />
                      Fuera de {LOCATION.town}
                    </dt>
                    <dd className="text-sm text-coal2">
                      Enviamos a donde estés, coordinado por WhatsApp
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        {others.length > 0 ? (
          <section className="bg-paper2 py-12 md:py-20">
            <div className="mx-auto max-w-7xl px-[clamp(1rem,4vw,2.5rem)]">
              <h2 className="font-display text-[length:var(--text-xl)] leading-tight font-normal uppercase">
                También en el catálogo
              </h2>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((other) => (
                  <Link
                    key={other.id}
                    href={`/producto/${other.id}`}
                    className="group/card flex flex-col border-2 border-coal bg-paper shadow-[6px_6px_0_var(--coal)] transition-[transform,box-shadow] duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[9px_9px_0_var(--coal)] motion-reduce:transition-none"
                  >
                    <span className="halftone relative block aspect-square overflow-hidden border-b-2 border-coal bg-paper2">
                      <Image
                        src={imageSrc(other.image)}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </span>
                    <span className="flex flex-1 flex-col p-4">
                      <span className="text-xs font-semibold tracking-[0.18em] text-navy uppercase">
                        {other.category}
                      </span>
                      <span className="mt-1 font-display text-xl leading-tight uppercase">
                        {other.name}
                      </span>
                      <span className="mt-4 font-display text-2xl leading-none text-signal tabular-nums">
                        {formatUsd(other.price)}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
