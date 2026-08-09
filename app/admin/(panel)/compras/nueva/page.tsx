import Link from "next/link";
import { requireAdmin } from "../../../../lib/auth";
import { getProducts } from "../../../../lib/products";
import { getRate } from "../../../../lib/rate";
import { formatRate } from "../../../../lib/money";
import PurchaseForm from "./PurchaseForm";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  await requireAdmin();
  const [products, rate] = await Promise.all([getProducts(), getRate()]);

  return (
    <>
      <header className="mb-(--space-md)">
        <h1 className="crm-h1">Registrar compra</h1>
        <p className="crm-muted mt-0.5">
          Anota lo que pagaste al proveedor. Suma existencias y fija el costo
          del producto; el precio de venta lo decides aquí mismo.
          {rate
            ? ` Tasa aplicada: Bs ${formatRate(rate.value)} por dólar.`
            : ""}
        </p>
      </header>

      {!rate ? (
        <p className="crm-note crm-note--bad">
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
