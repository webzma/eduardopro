import Link from "next/link";
import { IconPackageImport, IconShoppingBagX } from "@tabler/icons-react";
import { requireAdmin } from "../../../lib/auth";
import { getPurchases } from "../../../lib/purchases";
import { formatUsd } from "../../../lib/money";
import PeriodFilter from "../PeriodFilter";
import { isPeriod, periodStart, type Period } from "@/app/lib/period";
import { EmptyState, Field, PageHeader, Record, Thumbs } from "../ui";
import { buttonVariants } from "@/app/components/ui/button";

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
        <dl className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-4">
          <Field
            label="Compras del periodo"
            value={String(purchases.length)}
            className="rounded-lg border bg-card shadow-sm p-4"
          />
          <Field
            label="Unidades recibidas"
            value={String(totalUnits)}
            className="rounded-lg border bg-card shadow-sm p-4"
          />
          <Field
            label="Total pagado"
            value={formatUsd(totalUsd)}
            className="rounded-lg border bg-card shadow-sm p-4"
          />
        </dl>
      ) : null}

      <div className="rounded-lg border bg-card shadow-sm">
        {purchases.length === 0 ? (
          <EmptyState icon={IconShoppingBagX} title="Todavía no hay compras">
            <Link href="/admin/compras/nueva" className="underline">
              Registra la primera
            </Link>
          </EmptyState>
        ) : (
          <ul>
            {purchases.map((purchase) => {
              const units = purchase.lines.reduce((n, l) => n + l.qty, 0);
              const fecha = new Date(purchase.boughtAt);
              const productos =
                purchase.lines.map((l) => l.productName).join(", ") ||
                "Sin renglones";
              return (
                <Record
                  key={purchase.id}
                  href={`/admin/compras/${purchase.id}`}
                  // Los 6 primeros caracteres del uuid bastan para nombrar una
                  // compra en voz alta sin leer 36 caracteres.
                  reference={`#${purchase.id.slice(0, 6).toUpperCase()}`}
                  media={
                    <Thumbs images={purchase.lines.map((l) => l.productImage)} />
                  }
                  title={productos}
                  label={`Compra ${purchase.id.slice(0, 6)} del ${FULL.format(fecha)}, ${formatUsd(purchase.totalUsd)}`}
                  amountLabel="Total pagado"
                  amountUsd={purchase.totalUsd}
                  // La tasa guardada con la compra, no la de hoy.
                  rate={purchase.rate}
                  fields={
                    <>
                      <Field
                        label="Fecha"
                        value={DAY.format(fecha)}
                        hint={TIME.format(fecha)}
                      />
                      <Field
                        label="Proveedor"
                        value={purchase.supplier ?? "—"}
                      />
                      <Field
                        label="Unidades"
                        value={units}
                        hint={`${purchase.lines.length} ${purchase.lines.length === 1 ? "renglón" : "renglones"}`}
                      />
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
