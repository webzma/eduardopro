import Link from "next/link";
import {
  IconCashBanknote,
  IconCalendarMonth,
  IconBuildingWarehouse,
  IconAlertTriangle,
  IconShoppingCartPlus,
  IconCashRegister,
  IconReceipt,
  IconReceiptOff,
  IconTruckDelivery,
  IconTrendingUp,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import { requireStaff } from "../../lib/auth";
import { getProducts, SupabaseSetupError } from "../../lib/products";
import { getSales, getSummary } from "../../lib/sales";
import { getMonthSpend } from "../../lib/purchases";
import { getRate } from "../../lib/rate";
import { formatBs, formatUsd, PAYMENT_LABELS } from "../../lib/money";
import {
  Chip,
  EmptyState,
  Notice,
  PAYMENT_TONES,
  PageHeader,
  ProductMosaic,
  Stat,
} from "./ui";
import { buttonVariants } from "@/app/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { getSettings } from "../../lib/settings";
import Pending from "./Pending";

export const dynamic = "force-dynamic";

const TIME = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Caracas",
});

const LOW_STOCK = 3;

export default async function DashboardPage() {
  const { role } = await requireStaff();
  const isAdmin = role === "admin";

  let products, summary, sales;
  try {
    [products, summary, sales] = await Promise.all([
      getProducts(),
      getSummary(),
      getSales(5),
    ]);
  } catch (err) {
    if (err instanceof SupabaseSetupError) {
      return (
        <>
          <h1 className="text-xl font-semibold tracking-tight">Falta configurar la base</h1>
          <div className="mt-4">
            <Notice kind="bad" icon={IconAlertTriangle}>
              {err.message}
            </Notice>
          </div>
        </>
      );
    }
    throw err;
  }

  const rate = await getRate();
  // RLS deja esto en 0 para el vendedor, pero la tarjeta tampoco se le pinta.
  const monthSpend = isAdmin ? await getMonthSpend(summary.monthStartIso) : 0;
  // Solo el admin puede leer settings (RLS), y solo a él le sirve el aviso.
  const settings = isAdmin ? await getSettings() : null;
  const lowStock = products.filter((p) => p.stock <= LOW_STOCK);
  const stockValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  return (
    <>
      <PageHeader
        title="Resumen"
        icon={IconLayoutDashboard}
        description={
          isAdmin
            ? "Cifras de todo el negocio."
            : "Tus cifras. Los totales del negocio los ve el administrador."
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/caja"
              className={buttonVariants({ variant: "outline" })}
            >
              <IconCashRegister size={16} stroke={1.75} aria-hidden />
              Cierre de caja
            </Link>
            <Link href="/admin/ventas/nueva" className={buttonVariants()}>
              <IconShoppingCartPlus size={16} stroke={1.75} aria-hidden />
              Registrar venta
            </Link>
          </div>
        }
      />

      <div className="mb-6">
        <Pending
          products={products}
          rate={rate}
          fallbackAgeDays={settings?.fallbackAgeDays ?? null}
          isAdmin={isAdmin}
        />
      </div>

      {/* Verde lo que entra, rojo lo que sale, ámbar lo que reclama atención.
          El mismo código de color que usan las tablas de Ventas y Compras. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Vendido hoy"
          icon={IconCashBanknote}
          tone="jade"
          value={formatUsd(summary.todayUsd)}
          sub={
            rate
              ? `${formatBs(summary.todayUsd, rate.value)} · ${summary.todayCount} ${summary.todayCount === 1 ? "venta" : "ventas"}`
              : `${summary.todayCount} ventas`
          }
        />
        <Stat
          label="Vendido este mes"
          icon={IconCalendarMonth}
          tone="jade"
          value={formatUsd(summary.monthUsd)}
          sub={
            rate
              ? `${formatBs(summary.monthUsd, rate.value)} · ${summary.monthCount} ${summary.monthCount === 1 ? "venta" : "ventas"}`
              : `${summary.monthCount} ventas`
          }
        />
        {/* El valor del inventario es dato de negocio: el vendedor ve en su
            lugar lo que sí necesita, cuánto puede vender ahora mismo. */}
        {isAdmin ? (
          <Stat
            label="Valor del inventario"
            icon={IconBuildingWarehouse}
            tone="navy"
            value={formatUsd(stockValue)}
            sub={
              rate
                ? `${formatBs(stockValue, rate.value)} · ${products.length} productos`
                : `${products.length} productos`
            }
          />
        ) : (
          <Stat
            label="Disponible para vender"
            icon={IconBuildingWarehouse}
            tone="navy"
            value={String(products.filter((p) => p.stock > 0).length)}
            sub={`De ${products.length} productos en catálogo`}
          />
        )}
        {/* Ámbar cuando hay poco stock, gris cuando no hay nada que mirar: el
            color aparece porque hay algo que hacer, no siempre. */}
        <Stat
          label="Stock bajo"
          icon={IconAlertTriangle}
          tone={lowStock.length > 0 ? "amber" : "neutral"}
          value={String(lowStock.length)}
          sub={`Productos con ${LOW_STOCK} o menos`}
        />
      </div>

      {isAdmin ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Comprado este mes"
            icon={IconTruckDelivery}
            tone="signal"
            value={formatUsd(monthSpend)}
            sub={rate ? formatBs(monthSpend, rate.value) : undefined}
          />
          {/* Si falta el costo en alguna línea, esa venta cuenta como 100 %
              beneficio y la cifra sale inflada. Se dice, no se disimula — y el
              ámbar lo dice antes de que nadie lea la letra pequeña. */}
          <Stat
            label="Ganancia del mes"
            icon={IconTrendingUp}
            tone={summary.profitPartial ? "amber" : "jade"}
            value={formatUsd(summary.monthProfit)}
            sub={
              summary.monthUsd === 0
                ? "Sin ventas aún"
                : summary.profitPartial
                  ? "Incompleta: hay ventas sin costo registrado"
                  : `${((summary.monthProfit / summary.monthUsd) * 100).toFixed(0)} % de lo vendido`
            }
          />
        </div>
      ) : null}

      <div className="mt-6">
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border bg-band p-4">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <IconReceipt size={18} stroke={1.75} aria-hidden />
              Últimas ventas
            </h2>
            <Link href="/admin/ventas" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Ver todas
            </Link>
          </div>
          {sales.length === 0 ? (
            <EmptyState icon={IconReceiptOff} title="Aún no hay ventas registradas" />
          ) : (
            // La misma tabla que /admin/ventas, recortada a lo que cabe en un
            // resumen. Dos formas distintas de listar lo mismo obligaban a
            // reaprender la pantalla al pasar de una a otra.
            <div
              className="overflow-x-auto"
              role="region"
              aria-labelledby="tabla-resumen"
              tabIndex={0}
            >
              <Table>
                <TableCaption id="tabla-resumen" className="sr-only">
                  Las últimas ventas registradas, con su fecha, forma de pago y
                  total
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">
                      <span className="sr-only">Productos</span>
                    </TableHead>
                    <TableHead>Producto / ID</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Forma de pago</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sales.map((sale) => {
                    const ref = `#${sale.id.slice(0, 6).toUpperCase()}`;
                    const fecha = new Date(sale.soldAt);
                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="py-3">
                          <ProductMosaic
                            className="w-24"
                            images={sale.lines.map((l) => l.productImage)}
                          />
                        </TableCell>

                        <th
                          scope="row"
                          className="p-2 text-left align-middle font-normal"
                        >
                          <Link
                            href={`/admin/ventas/${sale.id}`}
                            aria-label={`Venta ${ref}, ${formatUsd(sale.totalUsd)}`}
                            className="block max-w-64 rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            <span className="block truncate font-medium">
                              {sale.lines.map((l) => l.productName).join(", ") ||
                                "Sin renglones"}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {ref}
                              {sale.lines.length > 1
                                ? ` · ${sale.lines.length} productos`
                                : null}
                            </span>
                          </Link>
                        </th>

                        <TableCell className="whitespace-nowrap">
                          {TIME.format(fecha)}
                        </TableCell>

                        <TableCell>
                          <Chip tone={PAYMENT_TONES[sale.paymentMethod]}>
                            {PAYMENT_LABELS[sale.paymentMethod] ??
                              sale.paymentMethod}
                          </Chip>
                        </TableCell>

                        <TableCell className="text-right whitespace-nowrap">
                          <span className="block font-semibold tabular-nums text-jade">
                            {formatUsd(sale.totalUsd)}
                          </span>
                          <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                            {formatBs(sale.totalUsd, sale.rate)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
