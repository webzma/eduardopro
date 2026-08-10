import Link from "next/link";
import {
  IconPackageImport,
  IconShoppingBagX,
  IconTruckDelivery,
  IconPackages,
  IconCashBanknote,
} from "@tabler/icons-react";
import { requireAdmin } from "../../../lib/auth";
import { getPurchases } from "../../../lib/purchases";
import { formatBs, formatUsd } from "../../../lib/money";
import PeriodFilter from "../PeriodFilter";
import { isPeriod, periodStart, type Period } from "@/app/lib/period";
import { formatDate, formatDateTime, formatTime } from "@/app/lib/dates";
import {
  celdaSecundaria,
  EmptyState,
  PageHeader,
  ProductMosaic,
  RowMeta,
  RowMetaItem,
  Stat,
} from "../ui";
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

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  await requireAdmin();
  const { periodo } = await searchParams;
  const period: Period = isPeriod(periodo) ? periodo : "mes";
  const purchases = await getPurchases(200, periodStart(period));
  const totalUsd = purchases.reduce((sum, p) => sum + p.totalUsd, 0);
  const totalUnits = purchases.reduce(
    (n, p) => n + p.lines.reduce((m, l) => m + l.qty, 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="Compras"
        icon={IconTruckDelivery}
        description="Lo que le pagaste a los proveedores."
        action={
          <Link href="/admin/compras/nueva" className={buttonVariants()}>
            <IconPackageImport size={16} stroke={1.75} aria-hidden />
            Registrar compra
          </Link>
        }
      />

      <div className="mb-4">
        <PeriodFilter base="/admin/compras" active={period} />
      </div>

      {purchases.length > 0 ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Stat
            label="Compras del periodo"
            value={String(purchases.length)}
            icon={IconTruckDelivery}
            tone="navy"
          />
          <Stat
            label="Unidades recibidas"
            value={String(totalUnits)}
            icon={IconPackages}
            tone="amber"
          />
          {/* Rojo, no verde: esto es dinero que SALE. Pintarlo del mismo verde
              que lo facturado sería mentir con el color. */}
          <Stat
            label="Total pagado"
            value={formatUsd(totalUsd)}
            icon={IconCashBanknote}
            tone="signal"
          />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        {purchases.length === 0 ? (
          <EmptyState icon={IconShoppingBagX} title="Todavía no hay compras">
            <Link href="/admin/compras/nueva" className="underline">
              Registra la primera
            </Link>
          </EmptyState>
        ) : (
          // La región con scroll es focusable: una zona que se desplaza en
          // horizontal tiene que poder recorrerse con el teclado.
          <div
            className="overflow-x-auto"
            role="region"
            aria-labelledby="tabla-compras"
            tabIndex={0}
          >
            <Table className="table-fixed lg:table-auto">
              <TableCaption id="tabla-compras" className="sr-only">
                Compras registradas, con su fecha, proveedor y total
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 lg:w-28">
                    <span className="sr-only">Productos</span>
                  </TableHead>
                  <TableHead>Producto / ID</TableHead>
                  <TableHead className={celdaSecundaria}>Fecha y hora</TableHead>
                  <TableHead className={celdaSecundaria}>Proveedor</TableHead>
                  <TableHead className={`${celdaSecundaria} text-right`}>
                    Unidades
                  </TableHead>
                  <TableHead className={`${celdaSecundaria} text-right`}>
                    Total pagado
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {purchases.map((purchase) => {
                  const units = purchase.lines.reduce((n, l) => n + l.qty, 0);
                  const fecha = new Date(purchase.boughtAt);
                  // Los 6 primeros caracteres del uuid bastan para nombrar una
                  // compra en voz alta sin leer 36 caracteres.
                  const ref = `#${purchase.id.slice(0, 6).toUpperCase()}`;
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell className="py-3">
                        {/* Varios renglones, varias fotos en el mismo cuadro. */}
                        <ProductMosaic
                          className="w-20 lg:w-24"
                          images={purchase.lines.map((l) => l.productImage)}
                        />
                      </TableCell>

                      {/* th, no td: el nombre es la cabecera de su fila, así un
                          lector de pantalla lo repite al leer cada celda. Y es
                          el único enlace de la fila. */}
                      <th
                        scope="row"
                        className="w-full p-2 text-left align-middle font-normal"
                      >
                        <div className="flex items-start justify-between gap-2 lg:block">
                          <Link
                            href={`/admin/compras/${purchase.id}`}
                            aria-label={`Compra ${ref} del ${formatDateTime(fecha)}, ${formatUsd(purchase.totalUsd)}`}
                            className="block min-w-0 rounded-sm hover:underline lg:max-w-64 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            <span className="block truncate font-medium">
                              {purchase.lines
                                .map((l) => l.productName)
                                .join(", ") || "Sin renglones"}
                            </span>
                            <span className="mt-0.5 block text-xs font-semibold tracking-[0.04em] text-muted-foreground">
                              {ref}
                              {purchase.lines.length > 1
                                ? ` · ${purchase.lines.length} productos`
                                : null}
                            </span>
                          </Link>
                          <span className="shrink-0 text-right lg:hidden">
                            <span className="block font-semibold tabular-nums text-signal">
                              {formatUsd(purchase.totalUsd)}
                            </span>
                            <span className="mt-0.5 block text-[0.6875rem] tabular-nums text-muted-foreground">
                              {formatBs(purchase.totalUsd, purchase.rate)}
                            </span>
                          </span>
                        </div>
                        <RowMeta>
                          <RowMetaItem label="Fecha">
                            {formatDateTime(fecha)}
                          </RowMetaItem>
                          <RowMetaItem label="Uds.">{units}</RowMetaItem>
                          <RowMetaItem label="Proveedor">
                            {purchase.supplier ?? "—"}
                          </RowMetaItem>
                        </RowMeta>
                      </th>

                      <TableCell className={`${celdaSecundaria} whitespace-nowrap`}>
                        <span className="block">{formatDate(fecha)}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {formatTime(fecha)}
                        </span>
                      </TableCell>

                      <TableCell className={celdaSecundaria}>
                        <span className="block max-w-40 truncate">
                          {purchase.supplier ?? "—"}
                        </span>
                      </TableCell>

                      <TableCell
                        className={`${celdaSecundaria} text-right tabular-nums whitespace-nowrap`}
                      >
                        {units}
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {purchase.lines.length}{" "}
                          {purchase.lines.length === 1
                            ? "renglón"
                            : "renglones"}
                        </span>
                      </TableCell>

                      <TableCell
                        className={`${celdaSecundaria} text-right whitespace-nowrap`}
                      >
                        <span className="block font-semibold tabular-nums text-signal">
                          {formatUsd(purchase.totalUsd)}
                        </span>
                        {/* A la tasa guardada con la compra, no a la de hoy: el
                            histórico no se mueve cuando cambia el dólar. */}
                        <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                          {formatBs(purchase.totalUsd, purchase.rate)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-medium lg:hidden">
                    Total en pantalla
                    <span className="ml-2 font-semibold tabular-nums">
                      {formatUsd(totalUsd)}
                    </span>
                  </TableCell>
                  <TableCell
                    colSpan={5}
                    className="hidden font-medium lg:table-cell"
                  >
                    Total en pantalla
                  </TableCell>
                  <TableCell
                    className={`${celdaSecundaria} text-right font-semibold tabular-nums`}
                  >
                    {formatUsd(totalUsd)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
