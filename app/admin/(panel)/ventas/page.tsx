import Link from "next/link";
import { IconShoppingCartPlus, IconReceiptOff } from "@tabler/icons-react";
import { requireStaff } from "../../../lib/auth";
import { getSales } from "../../../lib/sales";
import { formatUsd, PAYMENT_LABELS } from "../../../lib/money";
import { EmptyState, PageHeader, Record } from "../ui";

export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Caracas",
});

const FULL_DATE = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Caracas",
});

export default async function SalesPage() {
  const { role } = await requireStaff();
  // Sin filtro por vendedor: RLS ya lo hace. El admin recibe todo y el
  // vendedor solo lo suyo, venga de donde venga la consulta.
  const sales = await getSales();
  const totalUsd = sales.reduce((sum, sale) => sum + sale.totalUsd, 0);

  return (
    <>
      <PageHeader
        title="Ventas"
        description={
          <>
            {role === "admin"
              ? "Todas las ventas del negocio."
              : "Tus ventas. El histórico completo lo ve el administrador."}
            {sales.length > 0 ? ` ${sales.length} en pantalla.` : ""}
          </>
        }
        action={
          <Link href="/admin/ventas/nueva" className="crm-btn crm-btn--primary">
            <IconShoppingCartPlus size={16} stroke={1.75} aria-hidden />
            Registrar venta
          </Link>
        }
      />

      <div className="crm-card">
        {sales.length === 0 ? (
          <EmptyState icon={IconReceiptOff} title="Todavía no hay ventas">
            <Link href="/admin/ventas/nueva" className="underline">
              Registra la primera
            </Link>
          </EmptyState>
        ) : (
          <>
            {/* Lista, no tabla: un historial se escanea de arriba abajo, no se
                compara columna a columna, y así baja a móvil sin scroll
                horizontal ni encabezados que se pierden de vista. */}
            <ul className="crm-list">
              {sales.map((sale) => {
                const units = sale.lines.reduce((n, l) => n + l.qty, 0);
                const productos =
                  sale.lines.map((l) => l.productName).join(", ") ||
                  "Sin renglones";
                return (
                  <Record
                    key={sale.id}
                    href={`/admin/ventas/${sale.id}`}
                    label={`Venta del ${FULL_DATE.format(new Date(sale.soldAt))}, ${formatUsd(sale.totalUsd)}`}
                    title={productos}
                    amountUsd={sale.totalUsd}
                    // La tasa guardada con la venta, no la de hoy: el histórico
                    // no debe moverse cuando cambia el dólar.
                    rate={sale.rate}
                    meta={
                      <>
                        <span>{DATE.format(new Date(sale.soldAt))}</span>
                        <span aria-hidden>·</span>
                        <span>
                          {units} {units === 1 ? "unidad" : "unidades"}
                        </span>
                        <span aria-hidden>·</span>
                        <span className="crm-badge crm-badge--quiet">
                          {PAYMENT_LABELS[sale.paymentMethod] ??
                            sale.paymentMethod}
                        </span>
                        {role === "admin" && sale.sellerEmail ? (
                          <>
                            <span aria-hidden>·</span>
                            <span className="truncate">{sale.sellerEmail}</span>
                          </>
                        ) : null}
                      </>
                    }
                  />
                );
              })}
            </ul>

            <p className="crm-total border-t border-(--crm-line) p-(--space-sm)">
              <span className="text-sm font-medium">Total en pantalla</span>
              <span className="text-base font-semibold tabular-nums">
                {formatUsd(totalUsd)}
              </span>
            </p>
          </>
        )}
      </div>
    </>
  );
}
