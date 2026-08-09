import Link from "next/link";
import {
  IconCashBanknote,
  IconCalendarMonth,
  IconBuildingWarehouse,
  IconAlertTriangle,
  IconShoppingCartPlus,
  IconCashRegister,
  IconReceiptOff,
  IconTruckDelivery,
  IconTrendingUp,
  type Icon,
} from "@tabler/icons-react";
import { requireStaff } from "../../lib/auth";
import { getProducts, SupabaseSetupError } from "../../lib/products";
import { getSales, getSummary } from "../../lib/sales";
import { getMonthSpend } from "../../lib/purchases";
import { getRate } from "../../lib/rate";
import { formatBs, formatUsd, PAYMENT_LABELS } from "../../lib/money";
import { EmptyState, Field, Notice, PageHeader, Record, Thumbs } from "./ui";
import { buttonVariants } from "@/app/components/ui/button";
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

function Kpi({
  label,
  value,
  sub,
  icon: Glyph,
  alert,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: Icon;
  /** Tiñe la cifra de rojo — solo cuando pide acción, nunca decorativo. */
  alert?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="p-4 flex items-start gap-4">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
            alert
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-secondary-foreground"
          }`}
        >
          <Glyph size={20} stroke={1.75} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="mb-1 text-sm text-muted-foreground">{label}</p>
          <p className={`text-xl leading-tight font-semibold tracking-tight tabular-nums ${alert ? "text-primary" : ""}`}>
            {value}
          </p>
          {sub ? <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">{sub}</p> : null}
        </div>
      </div>
    </div>
  );
}

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Vendido hoy"
          icon={IconCashBanknote}
          value={formatUsd(summary.todayUsd)}
          sub={
            rate
              ? `${formatBs(summary.todayUsd, rate.value)} · ${summary.todayCount} ${summary.todayCount === 1 ? "venta" : "ventas"}`
              : `${summary.todayCount} ventas`
          }
        />
        <Kpi
          label="Vendido este mes"
          icon={IconCalendarMonth}
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
          <Kpi
            label="Valor del inventario"
            icon={IconBuildingWarehouse}
            value={formatUsd(stockValue)}
            sub={
              rate
                ? `${formatBs(stockValue, rate.value)} · ${products.length} productos`
                : `${products.length} productos`
            }
          />
        ) : (
          <Kpi
            label="Disponible para vender"
            icon={IconBuildingWarehouse}
            value={String(products.filter((p) => p.stock > 0).length)}
            sub={`De ${products.length} productos en catálogo`}
          />
        )}
        <Kpi
          label="Stock bajo"
          icon={IconAlertTriangle}
          alert={lowStock.length > 0}
          value={String(lowStock.length)}
          sub={`Productos con ${LOW_STOCK} o menos`}
        />
      </div>

      {isAdmin ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Comprado este mes"
            icon={IconTruckDelivery}
            value={formatUsd(monthSpend)}
            sub={rate ? formatBs(monthSpend, rate.value) : undefined}
          />
          {/* Si falta el costo en alguna línea, esa venta cuenta como 100 %
              beneficio y la cifra sale inflada. Se dice, no se disimula. */}
          <Kpi
            label="Ganancia del mes"
            icon={IconTrendingUp}
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
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
            <h2 className="text-base font-semibold">Últimas ventas</h2>
            <Link href="/admin/ventas" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Ver todas
            </Link>
          </div>
          {sales.length === 0 ? (
            <EmptyState icon={IconReceiptOff} title="Aún no hay ventas registradas" />
          ) : (
            <ul>
              {sales.map((sale) => {
                const productos =
                  sale.lines.map((l) => l.productName).join(", ") ||
                  "Sin renglones";
                return (
                  <Record
                    key={sale.id}
                    href={`/admin/ventas/${sale.id}`}
                    reference={`#${sale.id.slice(0, 6).toUpperCase()}`}
                  media={
                    <Thumbs images={sale.lines.map((l) => l.productImage)} />
                  }
                    title={productos}
                    label={`Venta ${sale.id.slice(0, 6)}, ${formatUsd(sale.totalUsd)}`}
                    amountLabel="Total"
                    amountUsd={sale.totalUsd}
                    rate={sale.rate}
                    fields={
                      <>
                        <Field
                          label="Fecha"
                          value={TIME.format(new Date(sale.soldAt))}
                        />
                        <Field
                          label="Forma de pago"
                          value={
                            PAYMENT_LABELS[sale.paymentMethod] ??
                            sale.paymentMethod
                          }
                        />
                      </>
                    }
                  />
                );
              })}
            </ul>
          )}
        </div>

      </div>
    </>
  );
}
