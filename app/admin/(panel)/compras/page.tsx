import Link from "next/link";
import { IconPackageImport, IconShoppingBagX } from "@tabler/icons-react";
import { requireAdmin } from "../../../lib/auth";
import { getPurchases } from "../../../lib/purchases";
import { formatUsd } from "../../../lib/money";
import { EmptyState, PageHeader, Record } from "../ui";

export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Caracas",
});

const FULL_DATE = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Caracas",
});

export default async function PurchasesPage() {
  await requireAdmin();
  const purchases = await getPurchases();
  const totalUsd = purchases.reduce((sum, p) => sum + p.totalUsd, 0);

  return (
    <>
      <PageHeader
        title="Compras"
        description={
          <>
            Lo que le pagaste a los proveedores.
            {purchases.length > 0 ? ` ${purchases.length} en pantalla.` : ""}
          </>
        }
        action={
          <Link
            href="/admin/compras/nueva"
            className="crm-btn crm-btn--primary"
          >
            <IconPackageImport size={16} stroke={1.75} aria-hidden />
            Registrar compra
          </Link>
        }
      />

      <div className="crm-card">
        {purchases.length === 0 ? (
          <EmptyState icon={IconShoppingBagX} title="Todavía no hay compras">
            <Link href="/admin/compras/nueva" className="underline">
              Registra la primera
            </Link>
          </EmptyState>
        ) : (
          <>
            <ul className="crm-list">
              {purchases.map((purchase) => {
                const units = purchase.lines.reduce((n, l) => n + l.qty, 0);
                const productos =
                  purchase.lines.map((l) => l.productName).join(", ") ||
                  "Sin renglones";
                return (
                  <Record
                    key={purchase.id}
                    href={`/admin/compras/${purchase.id}`}
                    label={`Compra del ${FULL_DATE.format(new Date(purchase.boughtAt))}, ${formatUsd(purchase.totalUsd)}`}
                    title={productos}
                    amountUsd={purchase.totalUsd}
                    rate={purchase.rate}
                    meta={
                      <>
                        <span>{DATE.format(new Date(purchase.boughtAt))}</span>
                        <span aria-hidden>·</span>
                        <span>
                          {units} {units === 1 ? "unidad" : "unidades"}
                        </span>
                        {purchase.supplier ? (
                          <>
                            <span aria-hidden>·</span>
                            <span className="truncate">
                              {purchase.supplier}
                            </span>
                          </>
                        ) : null}
                      </>
                    }
                  />
                );
              })}
            </ul>

            <p className="crm-total border-t border-(--crm-line) p-(--space-sm)">
              <span className="text-sm font-medium">Total en pantalla</span>
              <span className="text-base font-semibold tabular-nums">
                {formatUsd(totalUsd)}
              </span>
            </p>
          </>
        )}
      </div>
    </>
  );
}
