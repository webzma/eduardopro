import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { IconArrowLeft, IconCircleCheck } from "@tabler/icons-react";
import { requireStaff } from "../../../../lib/auth";
import { getSale } from "../../../../lib/sales";
import {
  formatPct,
  formatRate,
  formatUsd,
  PAYMENT_LABELS,
  ROLE_LABELS,
} from "../../../../lib/money";
import { imageSrc } from "../../../../lib/images";
import { Facts, Field, GrandTotal, Notice } from "../../ui";

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

      <header className="mb-(--space-md) flex flex-wrap items-center gap-(--space-2xs)">
        <h1 className="crm-h1">Venta</h1>
        <span className="crm-rec__ref">
          #{sale.id.slice(0, 6).toUpperCase()}
        </span>
      </header>

      <div className="grid gap-(--space-md) lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex flex-col gap-(--space-md)">
          {/* Los datos de cabecera, cada uno con su nombre. */}
          <div className="crm-card">
            <div className="crm-card__body">
              <Facts>
                <Field label="Fecha" value={DATE.format(new Date(sale.soldAt))} />
                <Field
                  label="Forma de pago"
                  value={
                    PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod
                  }
                />
                <Field
                  label="Tasa aplicada"
                  value={`Bs ${formatRate(sale.rate)}`}
                  hint={`por dólar · ${sale.rateSource === "bcv" ? "BCV" : "manual"}`}
                />
                {isAdmin ? (
                  <Field
                    label="Registrada por"
                    value={sale.sellerRole ? ROLE_LABELS[sale.sellerRole] : "—"}
                  />
                ) : null}
                {sale.note ? <Field label="Nota" value={sale.note} /> : null}
              </Facts>
            </div>
          </div>

          {/* Aquí la tabla SÍ es lo correcto: pocas filas, columnas fijas, y
              la cabecera es la etiqueta de cada dato. */}
          <section className="crm-card overflow-hidden" aria-labelledby="renglones">
            <div className="crm-card__head">
              <h2 id="renglones" className="crm-h2">
                Renglones
              </h2>
              <span className="crm-muted text-xs">
                {units} {units === 1 ? "unidad" : "unidades"}
              </span>
            </div>
            <div className="crm-scroll">
              <table className="crm-doc">
                <caption className="sr-only">
                  Productos incluidos en esta venta
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col" className="crm-doc__num">
                      Cantidad
                    </th>
                    <th scope="col" className="crm-doc__num">
                      Precio unit.
                    </th>
                    {isAdmin ? (
                      <th scope="col" className="crm-doc__num">
                        Costo unit.
                      </th>
                    ) : null}
                    <th scope="col" className="crm-doc__num">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sale.lines.map((line) => (
                    <tr key={line.id}>
<th
                          scope="row"
                          className="p-(--space-sm) text-left font-medium"
                        >
                          <div className="flex items-center gap-(--space-2xs)">
                            <Image
                              src={imageSrc(line.productImage ?? "")}
                              alt=""
                              width={40}
                              height={40}
                              className="size-10 shrink-0 rounded border border-(--crm-line) bg-paper2 object-cover"
                            />
                            <span className="min-w-0">
                              {line.productName}
                              {/* product_id queda en NULL si el producto se
                                  borró: el nombre se copió al vender para que
                                  esto sobreviva. */}
                              {line.productId === null ? (
                                <span className="crm-muted block text-xs font-normal">
                                  Ya no está en el catálogo
                                </span>
                              ) : null}
                            </span>
                          </div>
                        </th>
                      <td className="crm-doc__num">{line.qty}</td>
                      <td className="crm-doc__num">
                        {formatUsd(line.unitPriceUsd)}
                      </td>
                      {isAdmin ? (
                        <td className="crm-doc__num">
                          {line.unitCostUsd > 0 ? (
                            formatUsd(line.unitCostUsd)
                          ) : (
                            <span className="crm-muted">Sin registrar</span>
                          )}
                        </td>
                      ) : null}
                      <td className="crm-doc__num font-medium">
                        {formatUsd(line.unitPriceUsd * line.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3}>Total</td>
                    <td className="crm-doc__num">{formatUsd(sale.totalUsd)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>

        <section className="flex flex-col gap-(--space-sm)" aria-labelledby="cobro">
          <h2 id="cobro" className="sr-only">
            Cobro
          </h2>
          <GrandTotal
            label="Total cobrado"
            usd={sale.totalUsd}
            rate={sale.rate}
            note={`A la tasa del día de la venta: Bs ${formatRate(sale.rate)} por dólar.`}
          />

          {isAdmin ? (
            <div className="crm-card">
              <div className="crm-card__body">
                <Facts stack>
                  <Field
                    label="Ganancia"
                    value={formatUsd(profit)}
                    hint={
                      anyCostless
                        ? "Incompleta: hay renglones sin costo registrado"
                        : sale.totalUsd > 0
                          ? `${formatPct((profit / sale.totalUsd) * 100)} de lo cobrado`
                          : undefined
                    }
                  />
                  <Field
                    label="Costo de la mercancía"
                    value={formatUsd(sale.totalUsd - profit)}
                  />
                </Facts>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
