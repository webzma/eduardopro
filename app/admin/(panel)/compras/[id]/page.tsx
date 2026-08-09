import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft, IconCircleCheck } from "@tabler/icons-react";
import { requireAdmin } from "../../../../lib/auth";
import { getPurchase } from "../../../../lib/purchases";
import {
  formatPct,
  formatRate,
  formatUsd,
  marginPct,
} from "../../../../lib/money";
import { DocLine, Notice, Total } from "../../ui";

export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Caracas",
});

export default async function PurchaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireAdmin();
  const [{ id }, { ok }] = await Promise.all([params, searchParams]);
  const purchase = await getPurchase(id);
  if (!purchase) notFound();

  const units = purchase.lines.reduce((n, l) => n + l.qty, 0);

  return (
    <>
      <Link
        href="/admin/compras"
        className="crm-btn crm-btn--quiet mb-(--space-sm)"
      >
        <IconArrowLeft size={16} stroke={1.75} aria-hidden />
        Compras
      </Link>

      {ok ? (
        <div className="mb-(--space-md)">
          <Notice kind="ok" icon={IconCircleCheck}>
            Compra registrada. Las existencias ya están sumadas y el costo
            actualizado.
          </Notice>
        </div>
      ) : null}

      <header className="mb-(--space-md)">
        <h1 className="crm-h1">Compra</h1>
        <p className="crm-muted mt-0.5">
          {DATE.format(new Date(purchase.boughtAt))}
          {purchase.supplier ? ` · ${purchase.supplier}` : ""}
          {purchase.buyerEmail ? ` · ${purchase.buyerEmail}` : ""}
        </p>
      </header>

      <div className="grid gap-(--space-md) lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <section className="crm-card" aria-labelledby="renglones">
          <div className="crm-card__head">
            <h2 id="renglones" className="crm-h2">
              Renglones
            </h2>
            <span className="crm-muted text-xs">
              {units} {units === 1 ? "unidad" : "unidades"}
            </span>
          </div>
          <ul className="crm-lines">
            {purchase.lines.map((line) => {
              const margin =
                line.salePriceUsd === null
                  ? null
                  : marginPct(line.salePriceUsd, line.unitCostUsd);
              return (
                <DocLine
                  key={line.id}
                  qty={line.qty}
                  name={
                    line.productId ? (
                      <Link
                        href={`/admin/inventario/${line.productId}`}
                        className="underline decoration-transparent hover:decoration-inherit"
                      >
                        {line.productName}
                      </Link>
                    ) : (
                      <>
                        {line.productName}
                        <span className="crm-muted text-xs">
                          {" "}
                          · ya no está en el catálogo
                        </span>
                      </>
                    )
                  }
                  note={`${formatUsd(line.unitCostUsd)} c/u de costo`}
                  amountUsd={line.unitCostUsd * line.qty}
                  extra={
                    line.salePriceUsd === null ? undefined : (
                      <>
                        venta {formatUsd(line.salePriceUsd)}
                        {margin !== null ? ` · margen ${formatPct(margin)}` : ""}
                      </>
                    )
                  }
                />
              );
            })}
          </ul>
        </section>

        <section className="crm-card" aria-labelledby="resumen-compra">
          <div className="crm-card__head">
            <h2 id="resumen-compra" className="crm-h2">
              Resumen
            </h2>
          </div>
          <div className="crm-card__body">
            <dl className="flex flex-col gap-(--space-2xs) text-sm">
              <div className="flex justify-between gap-(--space-sm)">
                <dt className="crm-muted">Unidades</dt>
                <dd className="tabular-nums">{units}</dd>
              </div>
              <div className="flex justify-between gap-(--space-sm)">
                <dt className="crm-muted">Tasa aplicada</dt>
                <dd className="tabular-nums">
                  Bs {formatRate(purchase.rate)}
                  <span className="crm-muted">
                    {" "}
                    ({purchase.rateSource === "bcv" ? "BCV" : "manual"})
                  </span>
                </dd>
              </div>
              {purchase.note ? (
                <div className="flex justify-between gap-(--space-sm)">
                  <dt className="crm-muted">Nota</dt>
                  <dd className="text-right">{purchase.note}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-(--space-sm) border-t border-(--crm-line) pt-(--space-sm)">
              <Total
                label="Total pagado"
                usd={purchase.totalUsd}
                rate={purchase.rate}
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
