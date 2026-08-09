import Link from "next/link";
import Image from "next/image";
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
import { imageSrc } from "../../../../lib/images";
import { Facts, Field, GrandTotal, Notice } from "../../ui";

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
  // Lo que dejará esta compra si todo se vende al precio fijado.
  const potential = purchase.lines.reduce(
    (sum, l) =>
      sum +
      (l.salePriceUsd === null ? 0 : l.qty * (l.salePriceUsd - l.unitCostUsd)),
    0,
  );

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

      <header className="mb-(--space-md) flex flex-wrap items-center gap-(--space-2xs)">
        <h1 className="crm-h1">Compra</h1>
        <span className="crm-rec__ref">
          #{purchase.id.slice(0, 6).toUpperCase()}
        </span>
      </header>

      <div className="grid gap-(--space-md) lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex flex-col gap-(--space-md)">
          <div className="crm-card">
            <div className="crm-card__body">
              <Facts>
                <Field
                  label="Fecha"
                  value={DATE.format(new Date(purchase.boughtAt))}
                />
                <Field label="Proveedor" value={purchase.supplier ?? "—"} />
                <Field
                  label="Tasa aplicada"
                  value={`Bs ${formatRate(purchase.rate)}`}
                  hint={`por dólar · ${purchase.rateSource === "bcv" ? "BCV" : "manual"}`}
                />
                {/* register_purchase() exige is_admin(), así que quien la registró era
                    administrador en ese momento por construcción. */}
                <Field label="Registrada por" value="Administrador" />
                {purchase.note ? (
                  <Field label="Nota" value={purchase.note} />
                ) : null}
              </Facts>
            </div>
          </div>

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
                  Productos incluidos en esta compra, con su costo y el precio
                  de venta que quedó fijado
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col" className="crm-doc__num">
                      Cantidad
                    </th>
                    <th scope="col" className="crm-doc__num">
                      Costo unit.
                    </th>
                    <th scope="col" className="crm-doc__num">
                      Precio venta
                    </th>
                    <th scope="col" className="crm-doc__num">
                      Margen
                    </th>
                    <th scope="col" className="crm-doc__num">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.lines.map((line) => {
                    const margin =
                      line.salePriceUsd === null
                        ? null
                        : marginPct(line.salePriceUsd, line.unitCostUsd);
                    return (
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
                              {line.productId ? (
                                <Link
                                  href={`/admin/inventario/${line.productId}`}
                                  className="underline decoration-transparent hover:decoration-inherit"
                                >
                                  {line.productName}
                                </Link>
                              ) : (
                                <>
                                  {line.productName}
                                  <span className="crm-muted block text-xs font-normal">
                                    Ya no está en el catálogo
                                  </span>
                                </>
                              )}
                            </span>
                          </div>
                        </th>
                        <td className="crm-doc__num">{line.qty}</td>
                        <td className="crm-doc__num">
                          {formatUsd(line.unitCostUsd)}
                        </td>
                        <td className="crm-doc__num">
                          {line.salePriceUsd === null
                            ? "—"
                            : formatUsd(line.salePriceUsd)}
                        </td>
                        <td className="crm-doc__num">
                          {margin === null ? (
                            "—"
                          ) : margin < 15 ? (
                            // Color Y palabra: el color solo no se ve con
                            // daltonismo ni en una impresión.
                            <span className="text-signal">
                              {formatPct(margin)}
                              <span className="block text-xs">bajo</span>
                            </span>
                          ) : (
                            formatPct(margin)
                          )}
                        </td>
                        <td className="crm-doc__num font-medium">
                          {formatUsd(line.unitCostUsd * line.qty)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5}>Total pagado</td>
                    <td className="crm-doc__num">
                      {formatUsd(purchase.totalUsd)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>

        <section className="flex flex-col gap-(--space-sm)" aria-labelledby="pago">
          <h2 id="pago" className="sr-only">
            Pago
          </h2>
          <GrandTotal
            label="Total pagado"
            usd={purchase.totalUsd}
            rate={purchase.rate}
            note={`A la tasa del día de la compra: Bs ${formatRate(purchase.rate)} por dólar.`}
          />

          <div className="crm-card">
            <div className="crm-card__body">
              <Facts stack>
                <Field label="Unidades recibidas" value={units} />
                <Field
                  label="Ganancia si se vende todo"
                  value={formatUsd(potential)}
                  hint="A los precios de venta fijados en esta compra"
                />
              </Facts>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
