import Link from "next/link";
import { IconShoppingCartPlus, IconReceiptOff } from "@tabler/icons-react";
import { requireStaff } from "../../../lib/auth";
import { getSales } from "../../../lib/sales";
import { formatUsd, PAYMENT_LABELS, ROLE_LABELS } from "../../../lib/money";
import { EmptyState, Field, PageHeader, Record, Thumbs } from "../ui";

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

export default async function SalesPage() {
  const { role } = await requireStaff();
  // Sin filtro por vendedor: RLS ya lo hace. El admin recibe todo y el
  // vendedor solo lo suyo, venga de donde venga la consulta.
  const sales = await getSales();
  const isAdmin = role === "admin";
  const totalUsd = sales.reduce((sum, s) => sum + s.totalUsd, 0);
  const totalUnits = sales.reduce(
    (n, s) => n + s.lines.reduce((m, l) => m + l.qty, 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="Ventas"
        description={
          isAdmin
            ? "Todas las ventas del negocio."
            : "Tus ventas. El histórico completo lo ve el administrador."
        }
        action={
          <Link href="/admin/ventas/nueva" className="crm-btn crm-btn--primary">
            <IconShoppingCartPlus size={16} stroke={1.75} aria-hidden />
            Registrar venta
          </Link>
        }
      />

      {sales.length > 0 ? (
        <dl className="crm-facts mb-(--space-md)">
          <Field
            label="Ventas registradas"
            value={String(sales.length)}
            className="crm-card crm-card__body"
          />
          <Field
            label="Unidades vendidas"
            value={String(totalUnits)}
            className="crm-card crm-card__body"
          />
          <Field
            label="Total facturado"
            value={formatUsd(totalUsd)}
            className="crm-card crm-card__body"
          />
        </dl>
      ) : null}

      <div className="crm-card">
        {sales.length === 0 ? (
          <EmptyState icon={IconReceiptOff} title="Todavía no hay ventas">
            <Link href="/admin/ventas/nueva" className="underline">
              Registra la primera
            </Link>
          </EmptyState>
        ) : (
          <ul className="crm-list">
            {sales.map((sale) => {
              const units = sale.lines.reduce((n, l) => n + l.qty, 0);
              const fecha = new Date(sale.soldAt);
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
                  label={`Venta ${sale.id.slice(0, 6)} del ${FULL.format(fecha)}, ${formatUsd(sale.totalUsd)}`}
                  amountLabel="Total cobrado"
                  amountUsd={sale.totalUsd}
                  // La tasa guardada con la venta, no la de hoy: el histórico
                  // no debe moverse cuando cambia el dólar.
                  rate={sale.rate}
                  fields={
                    <>
                      <Field
                        label="Fecha"
                        value={DAY.format(fecha)}
                        hint={TIME.format(fecha)}
                      />
                      <Field
                        label="Forma de pago"
                        value={
                          PAYMENT_LABELS[sale.paymentMethod] ??
                          sale.paymentMethod
                        }
                      />
                      <Field
                        label="Unidades"
                        value={units}
                        hint={`${sale.lines.length} ${sale.lines.length === 1 ? "renglón" : "renglones"}`}
                      />
                      {isAdmin ? (
                        <Field
                          label="Registrada por"
                          value={
                            sale.sellerRole
                              ? ROLE_LABELS[sale.sellerRole]
                              : "—"
                          }
                        />
                      ) : null}
                    </>
                  }
                />
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
