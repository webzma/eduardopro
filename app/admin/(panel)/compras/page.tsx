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
import { imageSrc } from "@/app/lib/images";
import PeriodFilter from "../PeriodFilter";
import { isPeriod, periodStart, type Period } from "@/app/lib/period";
import { EmptyState, PageHeader, Stat } from "../ui";
import { buttonVariants } from "@/app/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
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

const DAY = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Caracas",
});

const TIME = new Intl.DateTimeFormat("es-VE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Caracas",
});

const FULL = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Caracas",
});

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
            <Table>
              <TableCaption id="tabla-compras" className="sr-only">
                Compras registradas, con su fecha, proveedor y total
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">
                    <span className="sr-only">Foto</span>
                  </TableHead>
                  <TableHead>Producto / ID</TableHead>
                  <TableHead>Fecha y hora</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Total pagado</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {purchases.map((purchase) => {
                  const units = purchase.lines.reduce((n, l) => n + l.qty, 0);
                  const fecha = new Date(purchase.boughtAt);
                  // Los 6 primeros caracteres del uuid bastan para nombrar una
                  // compra en voz alta sin leer 36 caracteres.
                  const ref = `#${purchase.id.slice(0, 6).toUpperCase()}`;
                  const extra = purchase.lines.length - 1;
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell className="py-3">
                        <span className="relative block size-14">
                          <Avatar className="size-14 rounded-md border">
                            <AvatarImage
                              src={imageSrc(
                                purchase.lines[0]?.productImage ?? "",
                              )}
                              alt=""
                              className="object-cover"
                            />
                            <AvatarFallback className="rounded-md text-xs">
                              {(purchase.lines[0]?.productName ?? "?")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Una compra puede llevar varios productos: se
                              muestra el primero y se cuenta el resto. */}
                          {extra > 0 ? (
                            <span
                              aria-hidden
                              className="absolute -right-1 -bottom-1 rounded-full bg-secondary px-1.5 text-[0.6875rem] font-semibold text-secondary-foreground ring-2 ring-card"
                            >
                              +{extra}
                            </span>
                          ) : null}
                        </span>
                      </TableCell>

                      {/* th, no td: el nombre es la cabecera de su fila, así un
                          lector de pantalla lo repite al leer cada celda. Y es
                          el único enlace de la fila. */}
                      <th
                        scope="row"
                        className="p-2 text-left align-middle font-normal"
                      >
                        <Link
                          href={`/admin/compras/${purchase.id}`}
                          aria-label={`Compra ${ref} del ${FULL.format(fecha)}, ${formatUsd(purchase.totalUsd)}`}
                          className="block max-w-64 rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <span className="block truncate font-medium">
                            {purchase.lines
                              .map((l) => l.productName)
                              .join(", ") || "Sin renglones"}
                          </span>
                          <span className="mt-0.5 block text-xs font-semibold tracking-[0.04em] text-muted-foreground">
                            {ref}
                          </span>
                        </Link>
                      </th>

                      <TableCell className="whitespace-nowrap">
                        <span className="block">{DAY.format(fecha)}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {TIME.format(fecha)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="block max-w-40 truncate">
                          {purchase.supplier ?? "—"}
                        </span>
                      </TableCell>

                      <TableCell className="text-right tabular-nums whitespace-nowrap">
                        {units}
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {purchase.lines.length}{" "}
                          {purchase.lines.length === 1
                            ? "renglón"
                            : "renglones"}
                        </span>
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap">
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
                  <TableCell colSpan={5} className="font-medium">
                    Total en pantalla
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
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
