import Link from "next/link";
import type { ReactNode } from "react";
import type { Icon } from "@tabler/icons-react";
import { formatBs, formatUsd } from "../../lib/money";

/* Piezas compartidas del panel. Existen para que las mismas decisiones
 * —qué es un error y qué un aviso, cómo se anuncia un importe, qué se dice
 * cuando no hay nada— se tomen una sola vez y no diverjan pantalla a pantalla. */

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-(--space-md) flex flex-wrap items-end justify-between gap-(--space-sm)">
      <div className="min-w-0">
        <h1 className="crm-h1">{title}</h1>
        {description ? <p className="crm-muted mt-0.5">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

/**
 * Un error NO es un aviso amable. `alert` interrumpe al lector de pantalla;
 * `status` espera a que termine lo que esté diciendo. Usar el segundo para un
 * fallo hace que se anuncie tarde, cuando el usuario ya siguió adelante.
 */
export function Notice({
  kind = "info",
  icon: Glyph,
  children,
}: {
  kind?: "info" | "ok" | "bad";
  icon?: Icon;
  children: ReactNode;
}) {
  return (
    <p
      role={kind === "bad" ? "alert" : "status"}
      className={`crm-note ${kind === "ok" ? "crm-note--ok" : ""} ${
        kind === "bad" ? "crm-note--bad" : ""
      } flex items-start gap-(--space-2xs)`}
    >
      {Glyph ? (
        <Glyph size={16} stroke={1.75} aria-hidden className="mt-0.5 shrink-0" />
      ) : null}
      <span>{children}</span>
    </p>
  );
}

export function EmptyState({
  icon: Glyph,
  title,
  children,
}: {
  icon: Icon;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="crm-empty">
      <Glyph size={28} stroke={1.5} aria-hidden className="mx-auto mb-2 opacity-40" />
      <p className="font-medium text-coal2">{title}</p>
      {children ? <p className="mt-1">{children}</p> : null}
    </div>
  );
}

/**
 * Importe en las dos monedas. `rate` opcional: sin tasa se muestra solo el
 * dólar en vez de inventar una conversión.
 *
 * El separador va en un <span aria-hidden> con espacio real alrededor: sin él
 * el lector encadena "109 dólares Bs 82.480" como si fuera una sola cifra.
 */
export function Money({
  usd,
  rate,
  className = "",
}: {
  usd: number;
  rate?: number | null;
  className?: string;
}) {
  return (
    <span className={className}>
      <span className="tabular-nums">{formatUsd(usd)}</span>
      {rate ? (
        <>
          <span aria-hidden> · </span>
          <span className="crm-muted tabular-nums">{formatBs(usd, rate)}</span>
        </>
      ) : null}
    </span>
  );
}

/** Fila de un historial. La fila entera es el enlace: un solo destino de
 *  tabulación por registro y un área de pulsación grande en móvil. */
export function Record({
  href,
  title,
  meta,
  amountUsd,
  rate,
  label,
}: {
  href: string;
  title: ReactNode;
  meta: ReactNode;
  amountUsd: number;
  rate: number;
  /** Nombre accesible del enlace: sin él solo se leería la fecha. */
  label: string;
}) {
  return (
    <li className="crm-record">
      <Link href={href} className="crm-record__link" aria-label={label}>
        <span className="crm-record__main">
          <span className="crm-record__title block">{title}</span>
          <span className="crm-record__meta">{meta}</span>
        </span>
        <span className="crm-record__aside">
          <span className="crm-record__amount block">{formatUsd(amountUsd)}</span>
          <span className="crm-record__sub block">
            {formatBs(amountUsd, rate)}
          </span>
        </span>
      </Link>
    </li>
  );
}

/** Renglón de un documento: producto, cantidad y subtotal. */
export function DocLine({
  name,
  note,
  qty,
  amountUsd,
  extra,
}: {
  name: ReactNode;
  note?: ReactNode;
  qty: number;
  amountUsd: number;
  extra?: ReactNode;
}) {
  return (
    <li className="crm-line">
      <span className="flex min-w-0 flex-1 items-baseline gap-(--space-2xs)">
        <span className="crm-line__qty shrink-0">
          <span className="sr-only">Cantidad: </span>
          {qty}
        </span>
        <span className="min-w-0">
          <span className="block text-sm">{name}</span>
          {note ? <span className="crm-muted block text-xs">{note}</span> : null}
        </span>
      </span>
      <span className="text-right">
        <span className="block text-sm font-medium tabular-nums">
          {formatUsd(amountUsd)}
        </span>
        {extra ? <span className="crm-muted block text-xs">{extra}</span> : null}
      </span>
    </li>
  );
}

/** Bloque de totales al pie de un documento. */
export function Total({
  label,
  usd,
  rate,
  emphasis,
}: {
  label: string;
  usd: number;
  rate: number;
  /** Cuál de las dos monedas se cobró de verdad. */
  emphasis?: "usd" | "bs";
}) {
  return (
    <div>
      <div className="crm-total">
        <span className="text-sm font-medium">{label}</span>
        <span
          className={`crm-total__value ${emphasis === "usd" ? "text-signal" : ""}`}
        >
          {formatUsd(usd)}
        </span>
      </div>
      <div className="crm-total mt-0.5">
        <span className="crm-muted text-xs">En bolívares</span>
        <span
          className={`text-base font-medium tabular-nums ${
            emphasis === "bs" ? "text-signal" : ""
          }`}
        >
          {formatBs(usd, rate)}
        </span>
      </div>
    </div>
  );
}
