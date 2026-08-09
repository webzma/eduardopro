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

/**
 * Las fotos de un registro en un solo cuadro. Con un producto es una foto
 * grande; con varios se reparte el cuadro en cuadrícula, y a partir de cuatro
 * la última celda cuenta las que faltan.
 *
 * Es la forma de que "esta venta llevó tres productos" se vea ANTES de leer
 * nada. La versión anterior —tres miniaturas de 28px solapadas— decía lo
 * mismo, pero tan pequeño que no se distinguía un champú de una cera.
 *
 * Decorativa por definición: los nombres van siempre al lado, así que va
 * aria-hidden y ninguna imagen lleva alt.
 */
export function ProductMosaic({
  images,
  className,
  sizes = "128px",
}: {
  images: (string | null)[];
  /** El ancho. El alto lo pone aspect-square: la cuadrícula solo cuadra si el
   *  cuadro es cuadrado. */
  className?: string;
  sizes?: string;
}) {
  const shown = images.slice(0, 4);
  const rest = images.length - shown.length;
  if (shown.length === 0) return null;
  return (
    <span
      aria-hidden
      className={cn(
        // gap-px sobre fondo de borde: las separaciones son el propio borde
        // asomando, no cuatro bordes que se suman y engordan la retícula.
        "relative grid aspect-square shrink-0 gap-px overflow-hidden rounded-md border border-border bg-border shadow-sm",
        shown.length === 1 ? "grid-cols-1" : "grid-cols-2",
        shown.length >= 3 && "grid-rows-2",
        className,
      )}
    >
      {shown.map((image, i) => (
        <span
          key={i}
          className={cn(
            "relative block bg-muted",
            // Con tres fotos la primera ocupa la columna izquierda entera: si
            // no, queda un hueco que parece una imagen que no cargó.
            shown.length === 3 && i === 0 && "row-span-2",
          )}
        >
          <Image
            src={imageSrc(image ?? "")}
            alt=""
            fill
            sizes={sizes}
            className="object-cover"
          />
          {/* El "+N" va SOBRE la última foto, no en una celda propia: así las
              cuatro celdas siguen siendo cuatro fotos. */}
          {rest > 0 && i === shown.length - 1 ? (
            <span className="absolute inset-0 flex items-center justify-center bg-coal/70 text-sm font-semibold text-paper tabular-nums">
              +{rest}
            </span>
          ) : null}
        </span>
      ))}
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
