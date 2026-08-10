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
import { formatDateTime } from "../../../../lib/dates";
import {
  celdaSecundaria,
  Facts,
  Field,
  GrandTotal,
  Notice,
  RowMeta,
  RowMetaItem,
} from "../../ui";
import { cn } from "@/app/lib/utils";
import { buttonVariants } from "@/app/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";

export const dynamic = "force-dynamic";

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
      <Link href="/admin/ventas" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3")}>
        <IconArrowLeft size={16} stroke={1.75} aria-hidden />
        Ventas
      </Link>

      {ok ? (
        <div className="mb-6">
          <Notice kind="ok" icon={IconCircleCheck}>
            Venta registrada. El stock ya quedó descontado.
          </Notice>
        </div>
      ) : null}

      <header className="mb-6 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Venta</h1>
        <span className="rounded-sm bg-muted px-1 py-px text-[0.6875rem] font-semibold tracking-[0.04em] text-secondary-foreground">
          #{sale.id.slice(0, 6).toUpperCase()}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {/* min-w-0: sin esto la tabla de renglones ensancha la columna del
            grid y con ella la página entera, en vez de quedarse dentro de su
            zona con scroll. */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* Los datos de cabecera, cada uno con su nombre. */}
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="p-4">
              <Facts>
                <Field label="Fecha" value={formatDateTime(sale.soldAt)} />
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
          <section className="rounded-lg border bg-card shadow-sm overflow-hidden" aria-labelledby="renglones">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
              <h2 id="renglones" className="text-base font-semibold">
                Renglones
              </h2>
              <span className="text-sm text-muted-foreground text-xs">
                {units} {units === 1 ? "unidad" : "unidades"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <Table className="table-fixed lg:table-auto">
                <TableCaption className="sr-only">
                  Productos incluidos en esta venta
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-full">Producto</TableHead>
                    <TableHead
                      className={`${celdaSecundaria} text-right tabular-nums whitespace-nowrap`}
                    >
                      Cantidad
                    </TableHead>
                    <TableHead
                      className={`${celdaSecundaria} text-right tabular-nums whitespace-nowrap`}
                    >
                      Precio unit.
                    </TableHead>
                    {isAdmin ? (
                      <TableHead
                        className={`${celdaSecundaria} text-right tabular-nums whitespace-nowrap`}
                      >
                        Costo unit.
                      </TableHead>
                    ) : null}
                    <TableHead className="w-24 text-right tabular-nums whitespace-nowrap lg:w-auto">
                      Subtotal
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.lines.map((line) => (
                    <TableRow key={line.id}>
                      <th
                        scope="row"
                        className="p-2 text-left align-middle font-normal"
                      >
                          <div className="flex items-start gap-3">
                            <Image
                              src={imageSrc(line.productImage ?? "")}
                              alt=""
                              width={80}
                              height={80}
                              className="size-16 shrink-0 rounded-md border border-border bg-muted object-cover shadow-sm lg:size-20"
                            />
                            <div className="min-w-0">
                              {line.productName}
                              {/* product_id queda en NULL si el producto se
                                  borró: el nombre se copió al vender para que
                                  esto sobreviva. */}
                              {line.productId === null ? (
                                <span className="block text-xs font-normal text-muted-foreground">
                                  Ya no está en el catálogo
                                </span>
                              ) : null}
                              <RowMeta>
                                <RowMetaItem label="Cantidad">
                                  {line.qty}
                                </RowMetaItem>
                                <RowMetaItem label="Precio">
                                  {formatUsd(line.unitPriceUsd)}
                                </RowMetaItem>
                                {isAdmin ? (
                                  <RowMetaItem label="Costo">
                                    {line.unitCostUsd > 0
                                      ? formatUsd(line.unitCostUsd)
                                      : "Sin registrar"}
                                  </RowMetaItem>
                                ) : null}
                              </RowMeta>
                            </div>
                          </div>
                        </th>
                      <TableCell
                        className={`${celdaSecundaria} text-right tabular-nums whitespace-nowrap`}
                      >
                        {line.qty}
                      </TableCell>
                      <TableCell
                        className={`${celdaSecundaria} text-right tabular-nums whitespace-nowrap`}
                      >
                        {formatUsd(line.unitPriceUsd)}
                      </TableCell>
                      {isAdmin ? (
                        <TableCell
                          className={`${celdaSecundaria} text-right tabular-nums whitespace-nowrap`}
                        >
                          {line.unitCostUsd > 0 ? (
                            formatUsd(line.unitCostUsd)
                          ) : (
                            <span className="text-sm text-muted-foreground">Sin registrar</span>
                          )}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-right tabular-nums whitespace-nowrap font-medium">
                        {formatUsd(line.unitPriceUsd * line.qty)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    {/* colSpan no entiende de media queries: un pie por
                        tamaño de pantalla, cada uno visible en el suyo. */}
                    <TableCell className="lg:hidden">Total</TableCell>
                    <TableCell
                      colSpan={isAdmin ? 4 : 3}
                      className="hidden lg:table-cell"
                    >
                      Total
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">{formatUsd(sale.totalUsd)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </section>
        </div>

        <section className="flex min-w-0 flex-col gap-4" aria-labelledby="cobro">
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
            <div className="rounded-lg border bg-card shadow-sm">
              <div className="p-4">
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
