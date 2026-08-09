import Link from "next/link";
import { IconPackageImport } from "@tabler/icons-react";
import { requireAdmin } from "../../../../lib/auth";
import { getProducts } from "../../../../lib/products";
import { getRate } from "../../../../lib/rate";
import { formatRate } from "../../../../lib/money";
import { PageHeader } from "../../ui";
import PurchaseForm from "./PurchaseForm";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  await requireAdmin();
  const [products, rate] = await Promise.all([getProducts(), getRate()]);

  return (
    <>
      <PageHeader
        title="Registrar compra"
        icon={IconPackageImport}
        description={
          <>
            Anota lo que pagaste al proveedor. Suma existencias y fija el costo
            del producto; el precio de venta lo decides aquí mismo.
            {rate
              ? ` Tasa aplicada: Bs ${formatRate(rate.value)} por dólar.`
              : ""}
          </>
        }
      />

      {!rate ? (
        <p className="rounded-md border border-l-4 border-l-destructive bg-tintsignal px-4 py-2 text-sm text-destructive">
          No hay tasa disponible: el BCV no responde y no hay respaldo manual.
          Sin tasa no se puede registrar la compra.{" "}
          <Link href="/admin/ajustes" className="underline">
            Fijar una tasa de respaldo
          </Link>
          .
        </p>
      ) : (
        <PurchaseForm products={products} rate={rate.value} />
      )}
    </>
  );
}
