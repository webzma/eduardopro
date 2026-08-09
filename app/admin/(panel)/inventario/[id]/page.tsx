import Link from "next/link";
import Image from "next/image";
import { IconArrowLeft, IconDeviceFloppy, IconAlertTriangle } from "@tabler/icons-react";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/auth";
import { getProduct } from "../../../../lib/products";
import { getRate } from "../../../../lib/rate";
import { formatBs } from "../../../../lib/money";
import { updateProductAction } from "../../../actions";
import ImagePicker from "../ImagePicker";
import { imageSrc } from "../../../../lib/images";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; detalle?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [{ error, detalle }, product, rate] = await Promise.all([
    searchParams,
    getProduct(id),
    getRate(),
  ]);
  if (!product) notFound();

  return (
    <>
      <Link
        href="/admin/inventario"
        className="crm-btn crm-btn--quiet mb-(--space-sm)"
      >
        <IconArrowLeft size={16} stroke={1.75} />
        Inventario
      </Link>

      <header className="mb-(--space-md) flex items-center gap-(--space-sm)">
        <Image
          src={imageSrc(product.image)}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded border border-(--crm-line) object-cover"
        />
        <div>
          <h1 className="crm-h1">{product.name}</h1>
          <p className="crm-muted mt-0.5">
            {product.category || "Sin categoría"}
            {rate ? ` · ${formatBs(product.price, rate.value)}` : ""}
          </p>
        </div>
      </header>

      {error ? (
        <p role="alert" className="crm-note crm-note--bad mb-(--space-md)">
          <IconAlertTriangle size={16} stroke={1.75} className="inline align-text-bottom" />{" "}
          {detalle ??
            (error === "nombre"
              ? "El nombre es obligatorio."
              : "No se pudo guardar.")}
        </p>
      ) : null}

      <div className="crm-card max-w-2xl">
        <div className="crm-card__body">
          <form
            action={updateProductAction}
            className="grid gap-(--space-sm) sm:grid-cols-2"
          >
            <input type="hidden" name="id" value={product.id} />

            <div className="sm:col-span-2">
              <label htmlFor="name" className="crm-label">
                Nombre
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={product.name}
                className="crm-field"
              />
            </div>
            <div>
              <label htmlFor="category" className="crm-label">
                Categoría
              </label>
              <input
                id="category"
                name="category"
                type="text"
                defaultValue={product.category}
                className="crm-field"
              />
            </div>
            <fieldset className="sm:col-span-2">
              <legend className="crm-label">Foto</legend>
              <ImagePicker current={imageSrc(product.image)} />
            </fieldset>
            <div>
              <label htmlFor="cost" className="crm-label">
                Costo en USD
              </label>
              <input
                id="cost"
                name="cost"
                type="number"
                min="0"
                step="0.01"
                defaultValue={product.cost}
                className="crm-field"
              />
              <p className="crm-muted mt-1 text-xs">
                Lo actualiza cada compra que registres.
              </p>
            </div>
            <div>
              <label htmlFor="price" className="crm-label">
                Precio de venta en USD
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={product.price}
                className="crm-field"
              />
              <p className="crm-muted mt-1 text-xs">
                Los bolívares se calculan con la tasa del día; no se guardan.
              </p>
            </div>
            <div>
              <label htmlFor="stock" className="crm-label">
                Stock
              </label>
              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                defaultValue={product.stock}
                className="crm-field"
              />
            </div>

            <label className="flex items-center gap-(--space-2xs) text-sm sm:col-span-2">
              <input
                type="checkbox"
                name="active"
                defaultChecked={product.active}
                className="size-4 accent-signal"
              />
              Mostrar en el sitio público
            </label>

            <div className="flex flex-wrap items-center gap-(--space-2xs) sm:col-span-2">
              <button type="submit" className="crm-btn crm-btn--primary">
                <IconDeviceFloppy size={16} stroke={1.75} />
                Guardar cambios
              </button>
              <Link
                href="/admin/inventario"
                className="crm-btn crm-btn--ghost"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
