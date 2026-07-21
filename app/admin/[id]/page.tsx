import { notFound } from "next/navigation";
import { requireAdmin } from "../../lib/auth";
import { getProduct } from "../../lib/products";
import { updateProductAction } from "../actions";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full border-b border-hair bg-transparent py-2.5 text-[15px] text-cream outline-none transition-colors placeholder:text-ink/50 focus:border-accent";

const labelClass =
  "mb-1.5 block font-mono text-[10px] tracking-[0.22em] text-ink";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-[640px] px-6 py-10 md:px-10">
      <a
        href="/admin"
        className="font-mono text-[11px] tracking-[0.22em] text-ink transition-colors hover:text-cream"
      >
        ← INVENTARIO
      </a>

      <div className="mt-6 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="h-16 w-16 shrink-0 rounded object-cover"
        />
        <h1 className="font-display text-[34px] font-bold tracking-tight">
          Editar producto
        </h1>
      </div>

      {error === "nombre" ? (
        <p className="mt-6 border border-[#e08a8a]/40 bg-[#e08a8a]/10 px-4 py-3 font-mono text-[12px] tracking-[0.12em] text-[#e08a8a]">
          El nombre es obligatorio.
        </p>
      ) : null}

      <form
        action={updateProductAction}
        className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2"
      >
        <input type="hidden" name="id" value={product.id} />
        <div className="sm:col-span-2">
          <label htmlFor="name" className={labelClass}>
            NOMBRE
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={product.name}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="category" className={labelClass}>
            CATEGORÍA
          </label>
          <input
            id="category"
            name="category"
            type="text"
            defaultValue={product.category}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="image" className={labelClass}>
            IMAGEN (URL O RUTA)
          </label>
          <input
            id="image"
            name="image"
            type="text"
            defaultValue={product.image}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="price" className={labelClass}>
            PRECIO (USD)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="1"
            defaultValue={product.price}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="stock" className={labelClass}>
            STOCK
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={product.stock}
            className={inputClass}
          />
        </div>
        <label className="flex items-center gap-3 font-mono text-[11px] tracking-[0.16em] text-ink sm:col-span-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product.active}
            className="size-4 accent-[#d4916e]"
          />
          MOSTRAR EN EL SITIO
        </label>
        <div className="flex items-center gap-6 sm:col-span-2">
          <button
            type="submit"
            className="btn-accent bg-accent px-9 py-3.5 font-mono text-[12px] font-medium tracking-[0.2em] text-[#171412] transition-colors"
          >
            GUARDAR CAMBIOS
          </button>
          <a
            href="/admin"
            className="font-mono text-[11px] tracking-[0.2em] text-ink transition-colors hover:text-cream"
          >
            CANCELAR
          </a>
        </div>
      </form>
    </div>
  );
}
