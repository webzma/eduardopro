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
import { formatDateTime } from "../../../../lib/dates";
import {
  celdaSecundaria,
  Chip,
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
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3")}
      >
        <IconArrowLeft size={16} stroke={1.75} aria-hidden />
        Compras
      </Link>

      {ok ? (
        <div className="mb-6">
          <Notice kind="ok" icon={IconCircleCheck}>
            Compra registrada. Las existencias ya están sumadas y el costo
            actualizado.
          </Notice>
        </div>
      ) : null}

      <header className="mb-6 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Compra</h1>
        <span className="rounded-sm bg-muted px-1 py-px text-[0.6875rem] font-semibold tracking-[0.04em] text-secondary-foreground">
          #{purchase.id.slice(0, 6).toUpperCase()}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="p-4">
              <Facts>
                <Field
                  label="Fecha"
                  value={formatDateTime(purchase.boughtAt)}
                />
                <Field
                  label="Proveedor"
                  value={purchase.supplier ?? "Sin proveedor"}
                />
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

          <section
            className="rounded-lg border bg-card shadow-sm overflow-hidden"
            aria-labelledby="renglones"
          >
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
                  Productos incluidos en esta compra, con su costo y el precio
                  de venta que quedó fijado
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
                      Costo unit.
                    </TableHead>
                    <TableHead
                      className={`${celdaSecundaria} text-right tabular-nums whitespace-nowrap`}
                    >
                      Precio venta
                    </TableHead>
                    <TableHead
                      className={`${celdaSecundaria} text-right tabular-nums whitespace-nowrap`}
                    >
                      Margen
                    </TableHead>
                    <TableHead className="w-24 text-right tabular-nums whitespace-nowrap lg:w-auto">
                      Subtotal
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.lines.map((line) => {
                    const margin =
                      line.salePriceUsd === null
                        ? null
                        : marginPct(line.salePriceUsd, line.unitCostUsd);
                    return (
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
                                  <span className="block text-xs font-normal text-muted-foreground">
                                    Ya no está en el catálogo
                                  </span>
                                </>
                              )}
                              <RowMeta>
                                <RowMetaItem label="Cantidad">
                                  {line.qty}
                                </RowMetaItem>
                                <RowMetaItem label="Costo">
                                  {formatUsd(line.unitCostUsd)}
                                </RowMetaItem>
                                <RowMetaItem label="Venta">
                                  {line.salePriceUsd === null
                                    ? "—"
                                    : formatUsd(line.salePriceUsd)}
                                </RowMetaItem>
                                {margin === null ? null : margin < 15 ? (
                                  <Chip tone="amber">
                                    Margen {formatPct(margin)} · bajo
                                  </Chip>
                                ) : (
                                  <RowMetaItem label="Margen">
                                    {formatPct(margin)}
                                  </RowMetaItem>
                                )}
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
                          {formatUsd(line.unitCostUsd)}
                        </TableCell>
                        <TableCell
                          className={`${celdaSecundaria} text-right tabular-nums whitespace-nowrap`}
                        >
                          {line.salePriceUsd === null
                            ? "—"
                            : formatUsd(line.salePriceUsd)}
                        </TableCell>
                        <TableCell
                          className={`${celdaSecundaria} text-right tabular-nums whitespace-nowrap`}
                        >
                          {margin === null ? (
                            "—"
                          ) : margin < 15 ? (
                            // Color Y palabra: el color solo no se ve con
                            // daltonismo ni en una impresión.
                            <span className="text-primary">
                              {formatPct(margin)}
                              <span className="block text-xs">bajo</span>
                            </span>
                          ) : (
                            formatPct(margin)
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums whitespace-nowrap font-medium">
                          {formatUsd(line.unitCostUsd * line.qty)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    {/* colSpan no entiende de media queries: se pinta un pie
                      por tamaño de pantalla y cada uno aparece en el suyo. */}
                    <TableCell className="lg:hidden">Total pagado</TableCell>
                    <TableCell colSpan={5} className="hidden lg:table-cell">
                      Total pagado
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {formatUsd(purchase.totalUsd)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </section>
        </div>

        <section className="flex min-w-0 flex-col gap-4" aria-labelledby="pago">
          <h2 id="pago" className="sr-only">
            Pago
          </h2>
          <GrandTotal
            label="Total pagado"
            usd={purchase.totalUsd}
            rate={purchase.rate}
            note={`A la tasa del día de la compra: Bs ${formatRate(purchase.rate)} por dólar.`}
          />

          <div className="rounded-lg border bg-card shadow-sm">
            <div className="p-4">
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
