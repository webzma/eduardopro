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
import { cn } from "@/app/lib/utils";
import { buttonVariants } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";

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
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3")}
      >
        <IconArrowLeft size={16} stroke={1.75} />
        Inventario
      </Link>

      <header className="mb-6 flex items-center gap-4">
        <Image
          src={imageSrc(product.image)}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded border border-border object-cover"
        />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{product.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {product.category || "Sin categoría"}
            {rate ? ` · ${formatBs(product.price, rate.value)}` : ""}
          </p>
        </div>
      </header>

      {error ? (
        <p role="alert" className="rounded-md border border-l-4 bg-card px-4 py-2 text-sm border-l-destructive text-destructive mb-6">
          <IconAlertTriangle size={16} stroke={1.75} className="inline align-text-bottom" />{" "}
          {detalle ??
            (error === "nombre"
              ? "El nombre es obligatorio."
              : "No se pudo guardar.")}
        </p>
      ) : null}

      <div className="rounded-lg border bg-card shadow-sm max-w-2xl">
        <div className="p-4">
          <form
            action={updateProductAction}
            className="grid gap-4 sm:grid-cols-2"
          >
            <input type="hidden" name="id" value={product.id} />

            <div className="sm:col-span-2">
              <Label htmlFor="name" className="mb-1 block">
                Nombre
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={product.name}
                
              />
            </div>
            <div>
              <Label htmlFor="category" className="mb-1 block">
                Categoría
              </Label>
              <Input
                id="category"
                name="category"
                type="text"
                defaultValue={product.category}
                
              />
            </div>
            <fieldset className="sm:col-span-2">
              <legend className="mb-1 block">Foto</legend>
              <ImagePicker current={imageSrc(product.image)} />
            </fieldset>
            <div>
              <Label htmlFor="cost" className="mb-1 block">
                Costo en USD
              </Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                min="0"
                step="0.01"
                defaultValue={product.cost}
                
              />
              <p className="text-sm text-muted-foreground mt-1 text-xs">
                Lo actualiza cada compra que registres.
              </p>
            </div>
            <div>
              <Label htmlFor="price" className="mb-1 block">
                Precio de venta en USD
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={product.price}
                
              />
              <p className="text-sm text-muted-foreground mt-1 text-xs">
                Los bolívares se calculan con la tasa del día; no se guardan.
              </p>
            </div>
            <div>
              <Label htmlFor="stock" className="mb-1 block">
                Stock
              </Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                defaultValue={product.stock}
                
              />
            </div>

            <Label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                name="active"
                defaultChecked={product.active}
                className="size-4 accent-signal"
              />
              Mostrar en el sitio público
            </Label>

            <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
              <button type="submit" className={buttonVariants()}>
                <IconDeviceFloppy size={16} stroke={1.75} />
                Guardar cambios
              </button>
              <Link
                href="/admin/inventario"
                className={buttonVariants({ variant: "outline" })}
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
