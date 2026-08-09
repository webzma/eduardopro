import Link from "next/link";
import { IconShoppingCartPlus } from "@tabler/icons-react";
import { requireStaff } from "../../../../lib/auth";
import { getProducts } from "../../../../lib/products";
import { getRate } from "../../../../lib/rate";
import { formatRate } from "../../../../lib/money";
import { PageHeader } from "../../ui";
import SaleForm from "./SaleForm";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
  await requireStaff();
  const [products, rate] = await Promise.all([getProducts(), getRate()]);

  // Se puede vender algo que no esté publicado en la web, pero no algo sin
  // existencias: se ocultan del selector en vez de dejar añadirlo y fallar.
  const sellable = products.filter((product) => product.stock > 0);

  return (
    <>
      <PageHeader
        title="Registrar venta"
        icon={IconShoppingCartPlus}
        description={
          rate ? (
            <>
              Tasa aplicada: Bs {formatRate(rate.value)} por dólar (
              {rate.source === "bcv" ? "BCV" : "respaldo manual"}). Queda
              guardada con la venta.
            </>
          ) : (
            "Sin tasa disponible."
          )
        }
      />

      {!rate ? (
        <p className="rounded-md border border-l-4 border-l-destructive bg-tintsignal px-4 py-2 text-sm text-destructive">
          No hay tasa disponible: el BCV no responde y no hay respaldo manual
          configurado. No se pueden registrar ventas sin tasa, porque el
          histórico quedaría sin referencia en bolívares.{" "}
          <Link href="/admin/ajustes" className="underline">
            Fijar una tasa de respaldo
          </Link>
          .
        </p>
      ) : sellable.length === 0 ? (
        <p className="rounded-md border border-l-4 border-l-navy bg-tintnavy px-4 py-2 text-sm">
          No hay productos con existencias.{" "}
          <Link href="/admin/inventario" className="underline">
            Revisar el inventario
          </Link>
          .
        </p>
      ) : (
        <SaleForm products={sellable} rate={rate.value} />
      )}
    </>
  );
}
