import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft, IconCircleCheck } from "@tabler/icons-react";
import { requireStaff } from "../../../../lib/auth";
import { getSale } from "../../../../lib/sales";
import {
  formatPct,
  formatRate,
  formatUsd,
  PAYMENT_LABELS,
  PAYS_IN_BS,
} from "../../../../lib/money";
import { DocLine, Notice, Total } from "../../ui";

export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Caracas",
});

export default async function SaleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { role } = await requireStaff();
  const [{ id }, { ok }] = await Promise.all([params, searchParams]);

  // Si la venta es de otro vendedor, RLS devuelve null y esto sale como 404 —
  // que es justo lo que debe ver: ni el contenido, ni la confirmación de que
  // esa venta existe.
  const sale = await getSale(id);
  if (!sale) notFound();

  const paidInBs = PAYS_IN_BS.has(sale.paymentMethod);
  const isAdmin = role === "admin";
  const units = sale.lines.reduce((n, l) => n + l.qty, 0);
  const profit = sale.lines.reduce(
    (sum, l) => sum + l.qty * (l.unitPriceUsd - l.unitCostUsd),
    0,
  );
  const anyCostless = sale.lines.some((l) => l.unitCostUsd <= 0);

  return (
    <>
      <Link href="/admin/ventas" className="crm-btn crm-btn--quiet mb-(--space-sm)">
        <IconArrowLeft size={16} stroke={1.75} aria-hidden />
        Ventas
      </Link>

      {ok ? (
        <div className="mb-(--space-md)">
          <Notice kind="ok" icon={IconCircleCheck}>
            Venta registrada. El stock ya quedó descontado.
          </Notice>
        </div>
      ) : null}

      <header className="mb-(--space-md)">
        <h1 className="crm-h1">Venta</h1>
        <p className="crm-muted mt-0.5">
          {DATE.format(new Date(sale.soldAt))}
          {isAdmin && sale.sellerEmail ? ` · ${sale.sellerEmail}` : ""}
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
            {sale.lines.map((line) => (
              <DocLine
                key={line.id}
                qty={line.qty}
                name={line.productName}
                note={
                  <>
                    {formatUsd(line.unitPriceUsd)} c/u
                    {/* product_id queda en NULL si el producto se borró: el
                        nombre se copió al vender para que esto sobreviva. */}
                    {line.productId === null
                      ? " · ya no está en el catálogo"
                      : ""}
                  </>
                }
                amountUsd={line.unitPriceUsd * line.qty}
                extra={
                  isAdmin && line.unitCostUsd > 0
                    ? `costo ${formatUsd(line.unitCostUsd)}`
                    : undefined
                }
              />
            ))}
          </ul>
        </section>

        <section className="crm-card" aria-labelledby="resumen-venta">
          <div className="crm-card__head">
            <h2 id="resumen-venta" className="crm-h2">
              Resumen
            </h2>
          </div>
          <div className="crm-card__body">
            <dl className="flex flex-col gap-(--space-2xs) text-sm">
              <div className="flex justify-between gap-(--space-sm)">
                <dt className="crm-muted">Método de pago</dt>
                <dd>
                  {PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}
                </dd>
              </div>
              <div className="flex justify-between gap-(--space-sm)">
                <dt className="crm-muted">Tasa aplicada</dt>
                <dd className="tabular-nums">
                  Bs {formatRate(sale.rate)}
                  <span className="crm-muted">
                    {" "}
                    ({sale.rateSource === "bcv" ? "BCV" : "manual"})
                  </span>
                </dd>
              </div>
              {isAdmin ? (
                <div className="flex justify-between gap-(--space-sm)">
                  <dt className="crm-muted">Ganancia</dt>
                  <dd className="tabular-nums">
                    {formatUsd(profit)}
                    {anyCostless ? (
                      <span className="crm-muted"> · incompleta</span>
                    ) : sale.totalUsd > 0 ? (
                      <span className="crm-muted">
                        {" "}
                        · {formatPct((profit / sale.totalUsd) * 100)}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
              {sale.note ? (
                <div className="flex justify-between gap-(--space-sm)">
                  <dt className="crm-muted">Nota</dt>
                  <dd className="text-right">{sale.note}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-(--space-sm) border-t border-(--crm-line) pt-(--space-sm)">
              {/* Se destaca la moneda en la que realmente se cobró. */}
              <Total
                label="Total"
                usd={sale.totalUsd}
                rate={sale.rate}
                emphasis={paidInBs ? "bs" : "usd"}
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
