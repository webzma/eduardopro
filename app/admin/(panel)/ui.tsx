import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Icon } from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Card, CardContent } from "@/app/components/ui/card";
import { formatBs, formatUsd } from "@/app/lib/money";
import { imageSrc } from "@/app/lib/images";
import { cn } from "@/app/lib/utils";

/* Piezas compartidas del panel, construidas sobre shadcn.
 *
 * Regla que las gobierna a todas: NINGÚN dato se muestra sin su etiqueta. Una
 * fila que dice "08-ago · 50 · X" obliga a adivinar qué es cada cosa; con
 * "Fecha / Unidades / Proveedor" encima no hay nada que adivinar.
 *
 * Segunda regla, la del color: cada tono SIGNIFICA algo y significa siempre lo
 * mismo. Verde es dinero que entra, ámbar es un aviso, azul es dato neutro y
 * rojo es lo que exige acción. Un color decorativo, puesto porque quedaba
 * bonito, rompe el sistema entero: en cuanto un verde no quiere decir nada,
 * ninguno quiere decir nada. */

/** Los cuatro tonos del panel. `neutral` es la tarjeta de siempre. */
export type Tone = "jade" | "amber" | "navy" | "signal" | "neutral";

const TONES: Record<Tone, { bar: string; chip: string; surface: string }> = {
  // Las fichas de color llevan crema, nunca tinta: en --signal la tinta mide
  // 2.98 y no llega a AA. Lo que vale para el rojo se aplica a los cuatro.
  jade: { bar: "bg-jade", chip: "bg-jade text-paper", surface: "bg-tintjade" },
  amber: {
    bar: "bg-amber",
    chip: "bg-amber text-paper",
    surface: "bg-tintamber",
  },
  navy: { bar: "bg-navy", chip: "bg-navy text-paper", surface: "bg-tintnavy" },
  signal: {
    bar: "bg-signal",
    chip: "bg-signal text-paper",
    surface: "bg-tintsignal",
  },
  neutral: {
    bar: "bg-border",
    chip: "bg-secondary text-secondary-foreground",
    surface: "bg-card",
  },
};

export function PageHeader({
  title,
  description,
  icon: Glyph,
  action,
}: {
  title: string;
  description?: ReactNode;
  /** Marca de la sección. La misma que lleva en el menú lateral, para que se
   *  reconozca dónde estás sin leer el título. */
  icon?: Icon;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 border-b-2 border-border pb-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {Glyph ? (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <Glyph size={22} stroke={1.75} aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}

/**
 * Cifra grande con su etiqueta, su color y su icono. Es la tarjeta que abre
 * cada pantalla del panel: sustituye a las tres fichas planas que había en
 * Ventas y Compras y al Kpi que el Resumen tenía por su cuenta.
 */
export function Stat({
  label,
  value,
  sub,
  icon: Glyph,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: Icon;
  tone?: Tone;
}) {
  const t = TONES[tone];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border shadow-sm",
        t.surface,
      )}
    >
      {/* La franja de color va al borde, no detrás del texto: tiñe la tarjeta
          sin bajarle el contraste a la cifra. */}
      <span className={cn("absolute inset-y-0 left-0 w-1.5", t.bar)} aria-hidden />
      <div className="flex items-start gap-3 p-4 pl-5">
        {Glyph ? (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md",
              t.chip,
            )}
          >
            <Glyph size={20} stroke={1.75} aria-hidden />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-0.5 text-xl leading-tight font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {sub ? (
            <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
              {sub}
            </p>
          ) : null}
        </div>
      </div>
    </div>
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
    <Alert
      role={kind === "bad" ? "alert" : "status"}
      variant={kind === "bad" ? "destructive" : "default"}
      className={cn(
        "border-l-4",
        kind === "ok" && "border-l-jade bg-tintjade",
        kind === "info" && "border-l-navy bg-tintnavy",
        kind === "bad" && "bg-tintsignal",
      )}
    >
      {Glyph ? <Glyph size={16} stroke={1.75} aria-hidden /> : null}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
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
    <div className="px-4 py-12 text-center text-sm text-muted-foreground">
      <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-tintnavy text-navy">
        <Glyph size={26} stroke={1.5} aria-hidden />
      </span>
      <p className="font-medium text-foreground">{title}</p>
      {children ? <p className="mt-1">{children}</p> : null}
    </div>
  );
}

/** Etiqueta encima, valor debajo. La unidad mínima de todo el panel. */
export function Field({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  /** Segunda línea: el equivalente en bolívares, un matiz, una advertencia. */
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[0.6875rem] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-px text-sm font-medium tabular-nums">
        {value}
        {hint ? (
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </dd>
    </div>
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
    <span className="flex shrink-0 items-center" aria-hidden>
      {shown.map((image, i) => (
        <Image
          key={i}
          src={imageSrc(image ?? "")}
          alt=""
          width={28}
          height={28}
          className="size-7 rounded-sm border border-border bg-muted object-cover not-first:-ml-2"
        />
      ))}
      {rest > 0 ? (
        <span className="inline-flex h-7 min-w-7 items-center justify-center px-[3px] text-[0.6875rem] font-semibold text-secondary-foreground">
          +{rest}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Etiqueta de color con punto. El punto hace el trabajo que el color NO puede
 * hacer solo: quien no distingue verde de ámbar sigue viendo cuatro formas
 * distintas de rellenar la píldora, y el texto siempre está ahí.
 */
export function Chip({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        t.surface,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", t.bar)} aria-hidden />
      {children}
    </span>
  );
}

/** Cada forma de cobro, su color. Efectivo en dólares es el que más pesa en
 *  caja, así que se lleva el verde; lo que entra en bolívares va en azul. */
export const PAYMENT_TONES: Record<string, Tone> = {
  usd_efectivo: "jade",
  bs_efectivo: "navy",
  pago_movil: "navy",
  transferencia: "navy",
  otro: "neutral",
};

/** Distintivo de referencia corta (#A3F2C1). */
export function Ref({ children }: { children: ReactNode }) {
  return (
    // De tinta sobre crema (17.04): la referencia es el identificador que se
    // dicta por teléfono, no una nota al margen que se pueda perder.
    <span className="shrink-0 rounded-sm bg-coal px-1.5 py-px text-[0.6875rem] font-semibold tracking-[0.04em] text-paper">
      {children}
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
  fields,
  amountLabel,
  amountUsd,
  rate,
  label,
  tone = "jade",
}: {
  href: string;
  /** Referencia corta: sin ella, dos registros del mismo día son
   *  indistinguibles al hablar de ellos. */
  reference: string;
  media?: ReactNode;
  title: ReactNode;
  /** Los <Field> del cuerpo, sin incluir el importe. */
  fields: ReactNode;
  amountLabel: string;
  amountUsd: number;
  rate: number;
  /** Nombre accesible del enlace: sin él solo se leería la referencia. */
  label: string;
  /** Color del filo y del importe. Verde por defecto: estos registros son
   *  ventas, y una venta es dinero que entra. */
  tone?: Tone;
}) {
  const t = TONES[tone];
  return (
    <li className="not-first:border-t not-first:border-border">
      <Link
        href={href}
        aria-label={label}
        // El anillo va por dentro: con outline normal se recortaría contra el
        // borde de la tarjeta.
        className="relative block py-4 pr-4 pl-5 transition-colors even:bg-zebra hover:bg-tintamber focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
      >
        <span
          className={cn("absolute inset-y-0 left-0 w-1.5", t.bar)}
          aria-hidden
        />
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {media}
          <Ref>{reference}</Ref>
          <span className="min-w-0 flex-1 basis-48 text-sm font-semibold">
            {title}
          </span>
        </div>
        {/* auto-fit + minmax: cuatro columnas en escritorio, dos en móvil, sin
            un solo media query que mantener. */}
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] gap-x-4 gap-y-2">
          {fields}
          <Field
            className={cn(
              "sm:text-right [&_dd]:text-base [&_dd]:font-semibold",
              tone === "jade" && "[&_dd]:text-jade",
              tone === "navy" && "[&_dd]:text-navy",
              tone === "signal" && "[&_dd]:text-signal",
            )}
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
    <dl
      className={cn(
        "grid gap-4",
        stack
          ? "grid-cols-1 gap-2"
          : "grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]",
      )}
    >
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
    /* Antes era un bloque negro. Destacaba, sí, pero un rectángulo de tinta
     * en un panel de crema se lee como un cuerpo extraño. El peso lo dan
     * ahora el tamaño y el acento, que es lo que ya usa el resto del panel. */
    <Card className="gap-0 border-primary/30 bg-primary/5 py-4">
      <CardContent className="px-4">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="block text-4xl leading-tight font-semibold tracking-tight text-primary tabular-nums">
          {formatUsd(usd)}
        </span>
        <span className="mt-0.5 block text-lg font-medium tabular-nums">
          {formatBs(usd, rate)}
        </span>
        {note ? (
          <span className="mt-2 block text-xs text-muted-foreground">
            {note}
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
