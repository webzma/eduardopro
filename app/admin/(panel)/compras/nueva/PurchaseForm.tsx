"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconPackageImport,
  IconAlertTriangle,
  IconLoader2,
  IconCheck,
  IconSparkles,
  IconWand,
  IconPackages,
  IconTruckDelivery,
} from "@tabler/icons-react";
import {
  registerPurchaseAction,
  type PurchaseFormState,
} from "../../../actions";
import {
  formatBs,
  formatPct,
  formatUsd,
  marginPct,
  priceForMargin,
} from "../../../../lib/money";
import type { Product } from "../../../../lib/products";
import { imageSrc } from "../../../../lib/images";
import { cn } from "@/app/lib/utils";
import { buttonVariants } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import ImagePicker from "../../ImagePicker";

/** Margen por defecto al sugerir precio de venta para algo nuevo. */
const DEFAULT_MARGIN = 40;

type Line = {
  key: string;
  isNew: boolean;
  productId?: string;
  name: string;
  category: string;
  image?: string;
  qty: number;
  unitCost: number;
  salePrice: number;
  /** Precio que ya tenía el producto, para avisar si se está cambiando. */
  previousPrice?: number;
};

export default function PurchaseForm({
  products,
  rate,
}: {
  products: Product[];
  rate: number;
}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  /* Un campo solo se marca en rojo DESPUÉS de haberlo visitado. Sin esto, al
   * añadir un renglón salen tres avisos de error de campos que el usuario
   * todavía no ha tenido ocasión de rellenar: ruido que enseña a ignorar el
   * color rojo justo cuando más falta hace que signifique algo. */
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());

  const touch = (key: string, field: string) =>
    setTouched((prev) => new Set(prev).add(`${key}:${field}`));
  const touchedAt = (key: string, field: string) =>
    touched.has(`${key}:${field}`);
  const [state, formAction, pending] = useActionState<
    PurchaseFormState,
    FormData
  >(registerPurchaseAction, {});

  const chosen = useMemo(
    () => new Set(lines.map((l) => l.productId).filter(Boolean)),
    [lines],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        !chosen.has(p.id) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)),
    );
  }, [products, query, chosen]);

  const total = lines.reduce((sum, l) => sum + l.unitCost * l.qty, 0);

  function addExisting(product: Product) {
    setLines((prev) => [
      ...prev,
      {
        key: product.id,
        isNew: false,
        productId: product.id,
        name: product.name,
        category: product.category,
        image: product.image,
        qty: 1,
        // Se parte del último costo conocido para no escribir desde cero.
        unitCost: product.cost,
        salePrice: product.price,
        previousPrice: product.price,
      },
    ]);
  }

  function addNew() {
    setLines((prev) => [
      ...prev,
      {
        key: `nuevo-${crypto.randomUUID().slice(0, 8)}`,
        isNew: true,
        name: query.trim(),
        category: "",
        qty: 1,
        unitCost: 0,
        salePrice: 0,
      },
    ]);
    setQuery("");
  }

  function patch(key: string, next: Partial<Line>) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...next } : l)),
    );
  }

  function remove(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  /** Rellena el precio de venta con el margen por defecto. */
  function suggest(line: Line) {
    if (line.unitCost <= 0) return;
    patch(line.key, {
      salePrice: Math.round(priceForMargin(line.unitCost, DEFAULT_MARGIN) * 100) / 100,
    });
  }

  const payload = lines.map((l) => ({
    key: l.key,
    isNew: l.isNew,
    productId: l.productId,
    name: l.name,
    category: l.category,
    qty: l.qty,
    unitCost: l.unitCost,
    salePrice: l.salePrice > 0 ? l.salePrice : undefined,
  }));

  const incomplete = lines.some(
    (l) => (l.isNew && !l.name.trim()) || l.qty <= 0 || l.unitCost <= 0,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="lines" value={JSON.stringify(payload)} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div className="flex flex-col gap-6">
          {/* ── Qué llegó ── */}
          <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border bg-band p-4">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <IconPackageImport size={18} stroke={1.75} aria-hidden />
                2. Mercancía recibida
              </h2>
              <span className="text-sm text-muted-foreground text-xs">
                {lines.length} {lines.length === 1 ? "renglón" : "renglones"}
              </span>
            </div>

            {lines.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                <IconPackageImport
                  size={28}
                  stroke={1.5}
                  className="mx-auto mb-2 opacity-40"
                />
                Busca abajo lo que compraste, o añádelo como producto nuevo.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {lines.map((line, index) => {
                  const margin = marginPct(line.salePrice, line.unitCost);
                  const priceChanged =
                    line.previousPrice !== undefined &&
                    line.salePrice !== line.previousPrice;
                  const id = (f: string) => `l-${line.key}-${f}`;
                  const badName = touchedAt(line.key, "name") && !line.name.trim();
                  const badCost = touchedAt(line.key, "cost") && line.unitCost <= 0;
                  return (
                    <li key={line.key}>
                      {/* fieldset + legend: sin esto son tres bloques de campos
                          idénticos y un lector de pantalla no puede decir a
                          cuál pertenece cada "Cantidad". */}
                      <fieldset className="min-w-0 border-0 p-4">
                        <legend className="mb-2 flex w-full items-center gap-2">
                          <span className="shrink-0 rounded-sm bg-muted px-1 py-px text-[0.6875rem] font-semibold tracking-[0.04em] text-secondary-foreground">
                            {index + 1}
                          </span>
                          {line.isNew ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-secondary-foreground whitespace-nowrap shrink-0">
                              <IconSparkles size={13} stroke={1.75} aria-hidden />
                              Producto nuevo
                            </span>
                          ) : (
                            <span className="flex min-w-0 items-center gap-2">
                              <Image
                                src={imageSrc(line.image ?? "")}
                                alt=""
                                width={56}
                                height={56}
                                className="size-14 shrink-0 rounded-md border border-border object-cover shadow-sm"
                              />
                              <span className="truncate text-sm font-medium">
                                {line.name}
                              </span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => remove(line.key)}
                            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "ml-auto shrink-0 text-destructive")}
                          >
                            <IconTrash size={16} stroke={1.75} aria-hidden />
                            Quitar
                            <span className="sr-only">
                              {" "}
                              el renglón {index + 1}
                              {line.name ? `, ${line.name}` : ""}
                            </span>
                          </button>
                        </legend>

                        {line.isNew ? (
                          <div className="mb-2 grid gap-2 sm:grid-cols-2">
                            <div>
                              {/* Etiqueta visible, no solo placeholder: el
                                  placeholder desaparece al escribir y quien
                                  vuelve al campo ya no sabe qué iba ahí. */}
                              <Label htmlFor={id("name")} className="mb-1 block text-xs">
                                Nombre del producto{" "}
                                <span className="text-primary" aria-hidden>
                                  *
                                </span>
                              </Label>
                              <Input
                                id={id("name")}
                                value={line.name}
                                onChange={(e) =>
                                  patch(line.key, { name: e.target.value })
                                }
                                onBlur={() => touch(line.key, "name")}
                                required
                                placeholder="Ej. Tijera de corte"
                                aria-invalid={badName || undefined}
                                aria-describedby={badName ? id("name-e") : undefined}
                                
                              />
                              <p id={id("name-e")} className="mt-0.5 block min-h-[1lh] text-xs tabular-nums text-muted-foreground text-destructive font-medium">
                                {badName ? "Escribe cómo se llama." : null}
                              </p>
                            </div>
                            <div>
                              <Label
                                htmlFor={id("cat")}
                                className="mb-1 block text-xs"
                              >
                                Categoría{" "}
                                <span className="text-sm font-normal text-muted-foreground">
                                  (opcional)
                                </span>
                              </Label>
                              <Input
                                id={id("cat")}
                                value={line.category}
                                onChange={(e) =>
                                  patch(line.key, { category: e.target.value })
                                }
                                placeholder="Ej. Tijera profesional"
                              />
                            </div>

                            {/* El producto se crea AQUÍ, así que aquí tiene que
                                poder ponérsele foto: si no, nace con el
                                marcador de posición y hay que ir a Inventario a
                                arreglarlo, que es justo el viaje que este
                                formulario existe para evitar. */}
                            <div className="sm:col-span-2">
                              <Label className="mb-1 block text-xs">
                                Foto{" "}
                                <span className="text-sm font-normal text-muted-foreground">
                                  (opcional)
                                </span>
                              </Label>
                              <ImagePicker
                                name={`imagen-${line.key}`}
                                label={`Foto de ${line.name.trim() || `el producto nuevo del renglón ${index + 1}`}`}
                              />
                            </div>
                          </div>
                        ) : null}

                        <div className="grid gap-2 sm:grid-cols-[6rem_minmax(0,1fr)_minmax(0,1.4fr)]">
                          <div>
                            <Label htmlFor={id("qty")} className="mb-1 block text-xs">
                              Cantidad{" "}
                              <span className="text-primary" aria-hidden>
                                *
                              </span>
                            </Label>
                            <Input
                              id={id("qty")}
                              type="number"
                              min="1"
                              step="1"
                              value={line.qty}
                              onChange={(e) =>
                                patch(line.key, {
                                  qty: Math.max(1, Math.trunc(+e.target.value || 0)),
                                })
                              }
                              
                            />
                          </div>

                          <div>
                            <Label htmlFor={id("cost")} className="mb-1 block text-xs">
                              Costo unitario{" "}
                              <span className="text-primary" aria-hidden>
                                *
                              </span>
                            </Label>
                            <Input
                              id={id("cost")}
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.unitCost || ""}
                              onChange={(e) =>
                                patch(line.key, {
                                  unitCost: Math.max(0, +e.target.value || 0),
                                })
                              }
                              onBlur={() => touch(line.key, "cost")}
                              placeholder="0.00"
                              aria-invalid={badCost || undefined}
                              aria-describedby={id("cost-h")}
                              
                            />
                            <p
                              id={id("cost-h")}
                              className={`mt-0.5 block min-h-[1lh] text-xs tabular-nums text-muted-foreground ${badCost ? "text-destructive font-medium" : ""}`}
                            >
                              {badCost
                                ? "Cuánto pagaste por unidad."
                                : line.unitCost > 0
                                  ? formatBs(line.unitCost, rate)
                                  : null}
                            </p>
                          </div>

                          <div>
                            <Label
                              htmlFor={id("price")}
                              className="mb-1 block text-xs"
                            >
                              Precio de venta
                            </Label>
                            <div className="flex gap-1">
                              <Input
                                id={id("price")}
                                type="number"
                                min="0"
                                step="0.01"
                                value={line.salePrice || ""}
                                onChange={(e) =>
                                  patch(line.key, {
                                    salePrice: Math.max(0, +e.target.value || 0),
                                  })
                                }
                                placeholder="0.00"
                                aria-describedby={id("price-h")}
                                
                              />
                              <button
                                type="button"
                                onClick={() => suggest(line)}
                                disabled={line.unitCost <= 0}
                                className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
                              >
                                <IconWand size={15} stroke={1.75} aria-hidden />
                                {DEFAULT_MARGIN} %
                                <span className="sr-only">
                                  {" "}
                                  Calcular precio con {DEFAULT_MARGIN} % de margen
                                </span>
                              </button>
                            </div>
                            <p id={id("price-h")} className="mt-0.5 block min-h-[1lh] text-xs tabular-nums text-muted-foreground">
                              {margin !== null ? (
                                <span
                                  className={
                                    margin < 15 ? "text-primary" : "text-secondary-foreground"
                                  }
                                >
                                  Margen {formatPct(margin)} ·{" "}
                                  {formatUsd(line.salePrice - line.unitCost)} por
                                  unidad
                                  {margin < 15 ? " · bajo" : ""}
                                </span>
                              ) : line.unitCost > 0 ? (
                                <span className="text-sm text-muted-foreground">
                                  Pon el precio o pulsa {DEFAULT_MARGIN} %
                                </span>
                              ) : null}
                            </p>
                            {priceChanged ? (
                              <p className="mt-0.5 text-xs text-primary">
                                Cambia el precio del catálogo (antes{" "}
                                {formatUsd(line.previousPrice!)})
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </fieldset>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ── Buscador ── */}
          <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border bg-band p-4">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <IconPackages size={18} stroke={1.75} aria-hidden />
                1. Añadir al pedido
              </h2>
              <div className="relative basis-full sm:max-w-64 sm:flex-1 sm:basis-auto">
                <IconSearch
                  size={16}
                  stroke={1.75}
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-ash"
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar en el catálogo…"
                  aria-label="Buscar productos"
                  className="pl-7"
                />
              </div>
            </div>

            <div className="p-4">
              <button
                type="button"
                onClick={addNew}
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                <IconSparkles size={16} stroke={1.75} />
                {query.trim()
                  ? `Añadir «${query.trim()}» como producto nuevo`
                  : "Añadir un producto nuevo"}
              </button>
            </div>

            {results.length > 0 ? (
              <ul className="divide-y divide-border">
                {results.slice(0, 30).map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center gap-3 p-3 even:bg-zebra sm:gap-4 sm:px-4"
                  >
                    <Image
                      src={imageSrc(product.image)}
                      alt=""
                      width={72}
                      height={72}
                      className="size-18 shrink-0 rounded-md border border-border object-cover shadow-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {product.name}
                      </p>
                      <p className="truncate text-xs tabular-nums text-muted-foreground">
                        {product.stock} en stock · venta{" "}
                        {formatUsd(product.price)}
                        {product.cost > 0
                          ? ` · último costo ${formatUsd(product.cost)}`
                          : " · sin costo registrado"}
                      </p>
                      {/* El botón baja bajo el texto: en una sola fila con la
                          foto no cabe en un teléfono. */}
                      <div className="mt-2 flex">
                        <button
                          type="button"
                          onClick={() => addExisting(product)}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "ml-auto",
                          )}
                        >
                          <IconPlus size={16} stroke={1.75} />
                          Añadir
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                {query.trim()
                  ? "Nada coincide. Añádelo como producto nuevo."
                  : "Todo el catálogo está ya en el pedido."}
              </p>
            )}
          </div>
        </div>

        {/* ── Resumen ── */}
        <div className="overflow-hidden rounded-lg border-2 border-navy bg-card shadow-sm lg:sticky lg:top-6">
          {/* Azul, no rojo: el rojo es la columna de cobrar. Una compra es
              dinero que sale, y las dos pantallas no pueden parecer la misma. */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-navy p-4 text-paper">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <IconTruckDelivery size={18} stroke={1.75} aria-hidden />
              3. Cerrar la compra
            </h2>
          </div>
          <div className="p-4">
            <Label htmlFor="supplier" className="mb-1 block">
              Proveedor <span className="text-sm text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="supplier"
              name="supplier"
              type="text"
              placeholder="A quién le compraste"
              
            />

            <Label htmlFor="note" className="mb-1 block text-sm font-medium text-secondary-foreground mt-3">
              Nota <span className="text-sm text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="note"
              name="note"
              type="text"
              placeholder="Nº de factura, forma de pago…"
              
            />

            <div
              className="mt-6 rounded-md border-2 border-signal bg-tintsignal p-3"
              aria-live="polite"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[0.6875rem] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                  Total pagado
                </span>
                <span className="text-2xl leading-tight font-semibold tabular-nums text-signal">
                  {formatUsd(total)}
                </span>
              </div>
              <div className="mt-0.5 flex items-baseline justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  A la tasa del día
                </span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatBs(total, rate)}
                </span>
              </div>
            </div>

            {state.error ? (
              <p role="alert" className="mt-3 rounded-md border border-l-4 border-l-destructive bg-tintsignal px-4 py-2 text-sm text-destructive">
                <IconAlertTriangle
                  size={16}
                  stroke={1.75}
                  className="inline align-text-bottom"
                />{" "}
                {state.error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={lines.length === 0 || incomplete || pending}
              className={cn(buttonVariants({ size: "lg" }), "mt-3 w-full")}
            >
              {pending ? (
                <>
                  <IconLoader2 size={16} stroke={2} className="animate-spin" />
                  Registrando…
                </>
              ) : (
                <>
                  <IconCheck size={16} stroke={2} />
                  Registrar compra
                </>
              )}
            </button>
            <p className="text-sm text-muted-foreground mt-2 text-center text-xs">
              {incomplete && lines.length > 0
                ? "Falta nombre, cantidad o costo en algún renglón."
                : "Se suman las existencias y se actualiza el costo."}
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
