import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Icon } from "@tabler/icons-react";
import { formatBs, formatUsd } from "../../lib/money";
import { imageSrc } from "../../lib/images";

/* Piezas compartidas del panel.
 *
 * Regla que las gobierna a todas: NINGÚN dato se muestra sin su etiqueta. Una
 * fila que dice "08-ago · 50 · X" obliga a adivinar qué es cada cosa; con
 * "Fecha / Unidades / Proveedor" encima no hay nada que adivinar. */

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

/** Etiqueta encima, valor debajo. La unidad mínima de todo el panel. */
export function Field({
  label,
  value,
  hint,
  className = "",
}: {
  label: string;
  value: ReactNode;
  /** Segunda línea: el equivalente en bolívares, un matiz, una advertencia. */
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="crm-f__label">{label}</dt>
      <dd className="crm-f__value">
        {value}
        {hint ? (
          <span className="crm-f__value--muted mt-0.5 block text-xs">
            {hint}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

/** Importe en las dos monedas, como valor de un Field. */
export function Amount({ usd, rate }: { usd: number; rate?: number | null }) {
  return (
    <>
      {formatUsd(usd)}
      {rate ? (
        <span className="crm-f__value--muted block text-xs">
          {formatBs(usd, rate)}
        </span>
      ) : null}
    </>
  );
}

/** Fotos de los productos de un registro, solapadas. Puramente decorativas:
 *  los nombres van al lado. */
export function Thumbs({
  images,
  max = 3,
}: {
  images: (string | null)[];
  max?: number;
}) {
  if (images.length === 0) return null;
  const shown = images.slice(0, max);
  const rest = images.length - shown.length;
  return (
    <span className="crm-thumbs" aria-hidden>
      {shown.map((image, i) => (
        <Image
          key={i}
          src={imageSrc(image ?? "")}
          alt=""
          width={28}
          height={28}
          className="size-7"
        />
      ))}
      {rest > 0 ? <span className="crm-thumbs__more">+{rest}</span> : null}
    </span>
  );
}

/**
 * Fila de un historial. La fila entera es el enlace —un destino de tabulación
 * por registro, área de pulsación grande en móvil— y cada dato va etiquetado.
 */
export function Record({
  href,
  reference,
  media,
  title,
  badge,
  fields,
  amountLabel,
  amountUsd,
  rate,
  label,
}: {
  href: string;
  /** Referencia corta: sin ella, dos registros del mismo día son
   *  indistinguibles al hablar de ellos. */
  reference: string;
  /** Miniaturas de los productos, si el registro los tiene. */
  media?: ReactNode;
  title: ReactNode;
  badge?: ReactNode;
  /** Los <Field> del cuerpo, sin incluir el importe. */
  fields: ReactNode;
  amountLabel: string;
  amountUsd: number;
  rate: number;
  /** Nombre accesible del enlace: sin él solo se leería la referencia. */
  label: string;
}) {
  return (
    <li className="crm-rec">
      <Link href={href} className="crm-rec__link" aria-label={label}>
        <div className="crm-rec__top">
          {media}
          <span className="crm-rec__ref">{reference}</span>
          <span className="crm-rec__title">{title}</span>
          {badge}
        </div>
        <dl className="crm-rec__grid">
          {fields}
          <Field
            className="crm-rec__money"
            label={amountLabel}
            value={formatUsd(amountUsd)}
            hint={formatBs(amountUsd, rate)}
          />
        </dl>
      </Link>
    </li>
  );
}

/** Ficha de datos sueltos: etiqueta arriba, valor debajo. */
export function Facts({
  stack,
  children,
}: {
  /** Una sola columna, para barras laterales estrechas. */
  stack?: boolean;
  children: ReactNode;
}) {
  return (
    <dl className={`crm-facts ${stack ? "crm-facts--stack" : ""}`}>
      {children}
    </dl>
  );
}

/** El total del documento, con el peso visual que le corresponde. */
export function GrandTotal({
  label,
  usd,
  rate,
  note,
}: {
  label: string;
  usd: number;
  rate: number;
  note?: ReactNode;
}) {
  return (
    <div className="crm-grand">
      <span className="crm-grand__label">{label}</span>
      <span className="crm-grand__usd">{formatUsd(usd)}</span>
      <span className="crm-grand__bs">{formatBs(usd, rate)}</span>
      {note ? (
        <span className="mt-(--space-2xs) block text-xs text-paper/60">
          {note}
        </span>
      ) : null}
    </div>
  );
}
