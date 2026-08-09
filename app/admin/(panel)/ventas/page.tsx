import Link from "next/link";
import {
  IconShoppingCartPlus,
  IconReceiptOff,
  IconReceipt,
  IconPackages,
  IconCashBanknote,
} from "@tabler/icons-react";
import { requireStaff } from "@/app/lib/auth";
import { getSales } from "@/app/lib/sales";
import {
  formatBs,
  formatUsd,
  PAYMENT_LABELS,
  ROLE_LABELS,
} from "@/app/lib/money";
import { imageSrc } from "@/app/lib/images";
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
import PeriodFilter from "../PeriodFilter";
import { isPeriod, periodStart, type Period } from "@/app/lib/period";
import { Chip, EmptyState, PAYMENT_TONES, PageHeader, Stat } from "../ui";

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

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { role } = await requireStaff();
  // Sin filtro por vendedor: RLS ya lo hace. El admin recibe todo y el
  // vendedor solo lo suyo, venga de donde venga la consulta.
  const { periodo } = await searchParams;
  const period: Period = isPeriod(periodo) ? periodo : "mes";
  const sales = await getSales(200, periodStart(period));
  const isAdmin = role === "admin";
  const totalUsd = sales.reduce((sum, s) => sum + s.totalUsd, 0);
  const totalUnits = sales.reduce(
    (n, s) => n + s.lines.reduce((m, l) => m + l.qty, 0),
    0,
  );
  // Columnas que preceden a la del total, para el colSpan del pie.
  const leading = isAdmin ? 6 : 5;

  return (
    <>
      <PageHeader
        title="Ventas"
        icon={IconReceipt}
        description={
          isAdmin
            ? "Todas las ventas del negocio."
            : "Tus ventas. El histórico completo lo ve el administrador."
        }
        action={
          <Link href="/admin/ventas/nueva" className={buttonVariants()}>
            <IconShoppingCartPlus size={16} stroke={1.75} aria-hidden />
            Registrar venta
          </Link>
        }
      />

      <div className="mb-4">
        <PeriodFilter base="/admin/ventas" active={period} />
      </div>

      {sales.length > 0 ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Stat
            label="Ventas del periodo"
            value={String(sales.length)}
            icon={IconReceipt}
            tone="navy"
          />
          <Stat
            label="Unidades vendidas"
            value={String(totalUnits)}
            icon={IconPackages}
            tone="amber"
          />
          <Stat
            label="Total facturado"
            value={formatUsd(totalUsd)}
            icon={IconCashBanknote}
            tone="jade"
          />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        {sales.length === 0 ? (
          <EmptyState icon={IconReceiptOff} title="Todavía no hay ventas">
            <Link href="/admin/ventas/nueva" className="underline">
              Registra la primera
            </Link>
          </EmptyState>
        ) : (
          // La región con scroll es focusable: una zona que se desplaza en
          // horizontal tiene que poder recorrerse con el teclado.
          <div
            className="overflow-x-auto"
            role="region"
            aria-labelledby="tabla-ventas"
            tabIndex={0}
          >
            <Table>
              <TableCaption id="tabla-ventas" className="sr-only">
                Ventas registradas, con su fecha, forma de pago y total
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">
                    <span className="sr-only">Foto</span>
                  </TableHead>
                  <TableHead>Producto / ID</TableHead>
                  <TableHead>Fecha y hora</TableHead>
                  <TableHead>Forma de pago</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  {isAdmin ? <TableHead>Registrada por</TableHead> : null}
                  <TableHead className="text-right">Total cobrado</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sales.map((sale) => {
                  const units = sale.lines.reduce((n, l) => n + l.qty, 0);
                  const fecha = new Date(sale.soldAt);
                  const ref = `#${sale.id.slice(0, 6).toUpperCase()}`;
                  const extra = sale.lines.length - 1;
                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="py-3">
                        <span className="relative block size-14">
                          <Avatar className="size-14 rounded-md border">
                            <AvatarImage
                              src={imageSrc(sale.lines[0]?.productImage ?? "")}
                              alt=""
                              className="object-cover"
                            />
                            <AvatarFallback className="rounded-md text-xs">
                              {(sale.lines[0]?.productName ?? "?")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Una venta puede llevar varios productos: se
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
                          href={`/admin/ventas/${sale.id}`}
                          aria-label={`Venta ${ref} del ${FULL.format(fecha)}, ${formatUsd(sale.totalUsd)}`}
                          className="block max-w-64 rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <span className="block truncate font-medium">
                            {sale.lines.map((l) => l.productName).join(", ") ||
                              "Sin renglones"}
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
                        <Chip tone={PAYMENT_TONES[sale.paymentMethod]}>
                          {PAYMENT_LABELS[sale.paymentMethod] ??
                            sale.paymentMethod}
                        </Chip>
                      </TableCell>

                      <TableCell className="text-right tabular-nums whitespace-nowrap">
                        {units}
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {sale.lines.length}{" "}
                          {sale.lines.length === 1 ? "renglón" : "renglones"}
                        </span>
                      </TableCell>

                      {isAdmin ? (
                        <TableCell className="whitespace-nowrap">
                          {sale.sellerRole ? ROLE_LABELS[sale.sellerRole] : "—"}
                        </TableCell>
                      ) : null}

                      <TableCell className="text-right whitespace-nowrap">
                        {/* Verde: en este panel el verde es siempre dinero que
                            entra, aquí y en el Resumen. */}
                        <span className="block font-semibold tabular-nums text-jade">
                          {formatUsd(sale.totalUsd)}
                        </span>
                        {/* A la tasa guardada con la venta, no a la de hoy: el
                            histórico no se mueve cuando cambia el dólar. */}
                        <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                          {formatBs(sale.totalUsd, sale.rate)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TableCell colSpan={leading} className="font-medium">
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
