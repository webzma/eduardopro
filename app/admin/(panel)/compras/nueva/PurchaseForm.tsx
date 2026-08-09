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

      <div className="grid gap-(--space-md) lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div className="flex flex-col gap-(--space-md)">
          {/* ── Qué llegó ── */}
          <div className="crm-card">
            <div className="crm-card__head">
              <h2 className="crm-h2">Mercancía recibida</h2>
              <span className="crm-muted text-xs">
                {lines.length} {lines.length === 1 ? "renglón" : "renglones"}
              </span>
            </div>

            {lines.length === 0 ? (
              <div className="crm-empty">
                <IconPackageImport
                  size={28}
                  stroke={1.5}
                  className="mx-auto mb-2 opacity-40"
                />
                Busca abajo lo que compraste, o añádelo como producto nuevo.
              </div>
            ) : (
              <ul className="divide-y divide-(--crm-line-soft)">
                {lines.map((line) => {
                  const margin = marginPct(line.salePrice, line.unitCost);
                  const priceChanged =
                    line.previousPrice !== undefined &&
                    line.salePrice !== line.previousPrice;
                  return (
                    <li key={line.key} className="p-(--space-sm)">
                      <div className="flex items-start gap-(--space-2xs)">
                        {line.isNew ? (
                          <span className="crm-badge crm-badge--signal mt-1">
                            <IconSparkles size={13} stroke={1.75} />
                            Nuevo
                          </span>
                        ) : (
                          <Image
                            src={imageSrc(line.image ?? "")}
                            alt=""
                            width={36}
                            height={36}
                            className="size-9 shrink-0 rounded border border-(--crm-line) object-cover"
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          {line.isNew ? (
                            <div className="grid gap-(--space-3xs) sm:grid-cols-2">
                              <input
                                value={line.name}
                                onChange={(e) =>
                                  patch(line.key, { name: e.target.value })
                                }
                                placeholder="Nombre del producto"
                                aria-label="Nombre del producto nuevo"
                                aria-invalid={!line.name.trim() || undefined}
                                className="crm-field"
                              />
                              <input
                                value={line.category}
                                onChange={(e) =>
                                  patch(line.key, { category: e.target.value })
                                }
                                placeholder="Categoría (opcional)"
                                aria-label="Categoría"
                                className="crm-field"
                              />
                            </div>
                          ) : (
                            <>
                              <p className="truncate text-sm font-medium">
                                {line.name}
                              </p>
                              <p className="crm-muted truncate text-xs">
                                {line.category || "Sin categoría"}
                              </p>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => remove(line.key)}
                          aria-label={`Quitar ${line.name || "el renglón"}`}
                          className="crm-btn crm-btn--quiet crm-btn--danger"
                        >
                          <IconTrash size={16} stroke={1.75} />
                        </button>
                      </div>

                      <div className="mt-(--space-2xs) grid gap-(--space-2xs) sm:grid-cols-[6rem_1fr_1fr]">
                        <div>
                          <label className="crm-label text-xs">Cantidad</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={line.qty}
                            onChange={(e) =>
                              patch(line.key, {
                                qty: Math.max(1, Math.trunc(+e.target.value || 0)),
                              })
                            }
                            className="crm-field"
                          />
                        </div>
                        <div>
                          <label className="crm-label text-xs">
                            Costo unitario
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitCost || ""}
                            onChange={(e) =>
                              patch(line.key, {
                                unitCost: Math.max(0, +e.target.value || 0),
                              })
                            }
                            placeholder="0.00"
                            aria-invalid={line.unitCost <= 0 || undefined}
                            className="crm-field"
                          />
                          <p className="crm-muted mt-0.5 text-xs tabular-nums">
                            {formatBs(line.unitCost, rate)}
                          </p>
                        </div>
                        <div>
                          <label className="crm-label text-xs">
                            Precio de venta
                          </label>
                          <div className="flex gap-(--space-3xs)">
                            <input
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
                              className="crm-field"
                            />
                            <button
                              type="button"
                              onClick={() => suggest(line)}
                              disabled={line.unitCost <= 0}
                              title={`Sugerir precio con ${DEFAULT_MARGIN} % de margen`}
                              className="crm-btn crm-btn--ghost shrink-0"
                            >
                              {DEFAULT_MARGIN} %
                            </button>
                          </div>
                          <p className="crm-muted mt-0.5 text-xs tabular-nums">
                            {margin !== null ? (
                              <>
                                Margen {formatPct(margin)} ·{" "}
                                {formatUsd(line.salePrice - line.unitCost)} por
                                unidad
                              </>
                            ) : (
                              "Pon costo y precio para ver el margen"
                            )}
                          </p>
                          {priceChanged ? (
                            <p className="mt-0.5 text-xs text-signal">
                              Cambia el precio del catálogo (antes{" "}
                              {formatUsd(line.previousPrice!)})
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ── Buscador ── */}
          <div className="crm-card">
            <div className="crm-card__head">
              <h2 className="crm-h2">Añadir al pedido</h2>
              <div className="relative max-w-64 flex-1">
                <IconSearch
                  size={16}
                  stroke={1.75}
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-ash"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar en el catálogo…"
                  aria-label="Buscar productos"
                  className="crm-field pl-7"
                />
              </div>
            </div>

            <div className="crm-card__body">
              <button
                type="button"
                onClick={addNew}
                className="crm-btn crm-btn--ghost w-full"
              >
                <IconSparkles size={16} stroke={1.75} />
                {query.trim()
                  ? `Añadir «${query.trim()}» como producto nuevo`
                  : "Añadir un producto nuevo"}
              </button>
            </div>

            {results.length > 0 ? (
              <ul className="divide-y divide-(--crm-line-soft)">
                {results.slice(0, 30).map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center gap-(--space-sm) px-(--space-sm) py-(--space-2xs)"
                  >
                    <Image
                      src={imageSrc(product.image)}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 shrink-0 rounded border border-(--crm-line) object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {product.name}
                      </p>
                      <p className="crm-muted truncate text-xs tabular-nums">
                        {product.stock} en stock · venta{" "}
                        {formatUsd(product.price)}
                        {product.cost > 0
                          ? ` · último costo ${formatUsd(product.cost)}`
                          : " · sin costo registrado"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addExisting(product)}
                      className="crm-btn crm-btn--ghost"
                    >
                      <IconPlus size={16} stroke={1.75} />
                      Añadir
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="crm-empty">
                {query.trim()
                  ? "Nada coincide. Añádelo como producto nuevo."
                  : "Todo el catálogo está ya en el pedido."}
              </p>
            )}
          </div>
        </div>

        {/* ── Resumen ── */}
        <div className="crm-card lg:sticky lg:top-(--space-md)">
          <div className="crm-card__head">
            <h2 className="crm-h2">Compra</h2>
          </div>
          <div className="crm-card__body">
            <label htmlFor="supplier" className="crm-label">
              Proveedor <span className="crm-muted">(opcional)</span>
            </label>
            <input
              id="supplier"
              name="supplier"
              type="text"
              placeholder="A quién le compraste"
              className="crm-field"
            />

            <label htmlFor="note" className="crm-label mt-(--space-xs)">
              Nota <span className="crm-muted">(opcional)</span>
            </label>
            <input
              id="note"
              name="note"
              type="text"
              placeholder="Nº de factura, forma de pago…"
              className="crm-field"
            />

            <div
              className="mt-(--space-md) border-t border-(--crm-line) pt-(--space-sm)"
              aria-live="polite"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Total pagado</span>
                <span className="text-xl font-semibold tabular-nums">
                  {formatUsd(total)}
                </span>
              </div>
              <div className="mt-0.5 flex items-baseline justify-between">
                <span className="crm-muted text-xs">A la tasa del día</span>
                <span className="text-base font-medium tabular-nums text-signal">
                  {formatBs(total, rate)}
                </span>
              </div>
            </div>

            {state.error ? (
              <p role="alert" className="crm-note crm-note--bad mt-(--space-sm)">
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
              className="crm-btn crm-btn--primary mt-(--space-sm) w-full"
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
            <p className="crm-muted mt-(--space-2xs) text-center text-xs">
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
