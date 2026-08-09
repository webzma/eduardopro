import Link from "next/link";
import {
  IconCashRegister,
  IconChevronLeft,
  IconChevronRight,
  IconReceiptOff,
} from "@tabler/icons-react";
import { requireStaff } from "@/app/lib/auth";
import { getDayClose } from "@/app/lib/sales";
import { formatBs, formatUsd, PAYMENT_LABELS, PAYS_IN_BS } from "@/app/lib/money";
import { veDateKey, veDayFromKey } from "@/app/lib/period";
import { Badge } from "@/app/components/ui/badge";
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
import { EmptyState, Field, PageHeader } from "../ui";

export const dynamic = "force-dynamic";

const LONG = new Intl.DateTimeFormat("es-VE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Caracas",
});

const TIME = new Intl.DateTimeFormat("es-VE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Caracas",
});

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function CashClosePage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string }>;
}) {
  const { role } = await requireStaff();
  const { dia } = await searchParams;

  const day = veDayFromKey(dia);
  const close = await getDayClose(day);

  const hoyKey = veDateKey();
  const dayKey = veDateKey(day);
  const prev = veDateKey(new Date(day.getTime() - DAY_MS));
  const next = veDateKey(new Date(day.getTime() + DAY_MS));
  const esHoy = dayKey === hoyKey;

  // Lo que debería haber físicamente en cada sitio al contar.
  const enDolares = close.byMethod
    .filter((m) => !PAYS_IN_BS.has(m.method))
    .reduce((sum, m) => sum + m.totalUsd, 0);
  const enBolivares = close.byMethod
    .filter((m) => PAYS_IN_BS.has(m.method))
    .reduce((sum, m) => sum + m.totalBs, 0);

  return (
    <>
      <PageHeader
        title="Cierre de caja"
        description={
          role === "admin"
            ? "Lo que entró en el día, para cuadrar con el dinero físico."
            : "Tus ventas del día, para cuadrar tu turno."
        }
        action={
          <div className="flex items-center gap-1">
            <Link
              href={`/admin/caja?dia=${prev}`}
              aria-label="Día anterior"
              className={buttonVariants({ variant: "outline", size: "icon-sm" })}
            >
              <IconChevronLeft size={16} stroke={1.75} aria-hidden />
            </Link>
            {/* No se puede avanzar más allá de hoy: no hay caja del futuro. */}
            {esHoy ? (
              <span
                aria-hidden
                className={buttonVariants({
                  variant: "outline",
                  size: "icon-sm",
                  className: "pointer-events-none opacity-40",
                })}
              >
                <IconChevronRight size={16} stroke={1.75} />
              </span>
            ) : (
              <Link
                href={`/admin/caja?dia=${next}`}
                aria-label="Día siguiente"
                className={buttonVariants({
                  variant: "outline",
                  size: "icon-sm",
                })}
              >
                <IconChevronRight size={16} stroke={1.75} aria-hidden />
              </Link>
            )}
            {!esHoy ? (
              <Link
                href="/admin/caja"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Hoy
              </Link>
            ) : null}
          </div>
        }
      />

      <p className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <IconCashRegister size={18} stroke={1.75} aria-hidden />
        <span className="font-medium capitalize">{LONG.format(day)}</span>
        {esHoy ? <Badge variant="secondary">Hoy</Badge> : null}
      </p>

      {close.sales.length === 0 ? (
        <div className="rounded-lg border bg-card shadow-sm">
          <EmptyState
            icon={IconReceiptOff}
            title="No hay ventas registradas ese día"
          >
            {esHoy ? (
              <Link href="/admin/ventas/nueva" className="underline">
                Registrar la primera
              </Link>
            ) : null}
          </EmptyState>
        </div>
      ) : (
        <>
          {/* Lo primero que se mira al cerrar: cuánto hay que contar y dónde. */}
          <dl className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-4">
            <Field
              label="Efectivo y divisas en $"
              value={formatUsd(enDolares)}
              hint="Dólares en la caja"
              className="rounded-lg border border-primary/30 bg-primary/5 p-4"
            />
            <Field
              label="Cobrado en bolívares"
              value={`Bs ${enBolivares.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              hint="Efectivo Bs, pago móvil y transferencias"
              className="rounded-lg border border-primary/30 bg-primary/5 p-4"
            />
            <Field
              label="Total del día"
              value={formatUsd(close.totalUsd)}
              hint={`${close.sales.length} ${close.sales.length === 1 ? "venta" : "ventas"} · ${close.units} ${close.units === 1 ? "unidad" : "unidades"}`}
              className="rounded-lg border bg-card p-4 shadow-sm"
            />
          </dl>

          <div className="mb-6 rounded-lg border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableCaption className="sr-only">
                  Desglose del día por método de pago
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Método de pago</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="text-right">En dólares</TableHead>
                    <TableHead className="text-right">En bolívares</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {close.byMethod.map((m) => (
                    <TableRow key={m.method}>
                      <th
                        scope="row"
                        className="p-2 text-left align-middle font-normal"
                      >
                        <span className="font-medium">
                          {PAYMENT_LABELS[m.method] ?? m.method}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {PAYS_IN_BS.has(m.method)
                            ? "Se cobró en bolívares"
                            : "Se cobró en dólares"}
                        </span>
                      </th>
                      <TableCell className="text-right tabular-nums">
                        {m.count}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatUsd(m.totalUsd)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        Bs{" "}
                        {m.totalBs.toLocaleString("es-VE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-medium">Total</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {close.sales.length}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatUsd(close.totalUsd)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      Bs{" "}
                      {close.totalBs.toLocaleString("es-VE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>

          <section aria-labelledby="detalle" className="rounded-lg border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b p-4">
              <h2 id="detalle" className="text-base font-semibold">
                Ventas del día
              </h2>
              <Link
                href="/admin/ventas"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Ver histórico
              </Link>
            </div>
            <ul>
              {close.sales.map((sale) => (
                <li key={sale.id} className="not-first:border-t">
                  <Link
                    href={`/admin/ventas/${sale.id}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 p-4 transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
                  >
                    <span className="min-w-0 flex-1 basis-48">
                      <span className="block truncate text-sm font-medium">
                        {sale.lines.map((l) => l.productName).join(", ") ||
                          "Sin renglones"}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{TIME.format(new Date(sale.soldAt))}</span>
                        <span aria-hidden>·</span>
                        <span>
                          {PAYMENT_LABELS[sale.paymentMethod] ??
                            sale.paymentMethod}
                        </span>
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-semibold tabular-nums">
                        {formatUsd(sale.totalUsd)}
                      </span>
                      <span className="block text-xs tabular-nums text-muted-foreground">
                        {formatBs(sale.totalUsd, sale.rate)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
