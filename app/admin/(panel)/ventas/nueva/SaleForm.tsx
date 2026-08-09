"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import {
  IconSearch,
  IconPlus,
  IconMinus,
  IconTrash,
  IconShoppingCart,
  IconAlertTriangle,
  IconLoader2,
  IconCheck,
} from "@tabler/icons-react";
import { registerSaleAction, type SaleFormState } from "../../../actions";
import { formatBs, formatUsd, PAYMENT_LABELS } from "../../../../lib/money";
import type { Product } from "../../../../lib/products";
import { imageSrc } from "../../../../lib/images";

type Line = { product: Product; qty: number };

export default function SaleForm({
  products,
  rate,
}: {
  products: Product[];
  rate: number;
}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  const [state, formAction, pending] = useActionState<
    SaleFormState,
    FormData
  >(registerSaleAction, {});

  const inCart = useMemo(
    () => new Map(lines.map((line) => [line.product.id, line.qty])),
    [lines],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [products, query]);

  const total = lines.reduce(
    (sum, line) => sum + line.product.price * line.qty,
    0,
  );

  function add(product: Product) {
    setLines((prev) => {
      const found = prev.find((line) => line.product.id === product.id);
      if (!found) return [...prev, { product, qty: 1 }];
      // Tope en el stock: el servidor lo rechazaría igual, pero es mejor no
      // dejar construir una venta que no se va a poder guardar.
      if (found.qty >= product.stock) return prev;
      return prev.map((line) =>
        line.product.id === product.id ? { ...line, qty: line.qty + 1 } : line,
      );
    });
  }

  function setQty(id: string, qty: number) {
    setLines((prev) =>
      prev.flatMap((line) => {
        if (line.product.id !== id) return [line];
        const next = Math.min(Math.max(0, qty), line.product.stock);
        return next === 0 ? [] : [{ ...line, qty: next }];
      }),
    );
  }

  return (
    <form action={formAction}>
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          lines.map((line) => ({ productId: line.product.id, qty: line.qty })),
        )}
      />

      <div className="grid gap-(--space-md) lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
        {/* ── Buscador y catálogo ── */}
        <div className="crm-card">
          <div className="crm-card__head">
            <h2 className="crm-h2">Productos</h2>
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
                placeholder="Buscar por nombre o categoría…"
                aria-label="Buscar productos"
                className="crm-field pl-7"
              />
            </div>
          </div>

          {results.length === 0 ? (
            <p className="crm-empty">Ningún producto coincide con la búsqueda.</p>
          ) : (
            <ul className="divide-y divide-(--crm-line-soft)">
              {results.map((product) => {
                const taken = inCart.get(product.id) ?? 0;
                const left = product.stock - taken;
                return (
                  <li
                    key={product.id}
                    className="flex items-center gap-(--space-sm) p-(--space-2xs) px-(--space-sm)"
                  >
                    <Image
                      src={imageSrc(product.image)}
                      alt=""
                      width={36}
                      height={36}
                      className="size-9 shrink-0 rounded border border-(--crm-line) object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {product.name}
                      </p>
                      <p className="crm-muted truncate text-xs">
                        {product.category || "Sin categoría"} ·{" "}
                        {formatUsd(product.price)} ·{" "}
                        {formatBs(product.price, rate)}
                      </p>
                    </div>
                    <span
                      className={`crm-badge ${
                        left <= 0
                          ? "crm-badge--warn"
                          : left <= 3
                            ? "crm-badge--quiet"
                            : "crm-badge--quiet"
                      }`}
                    >
                      {left} disp.
                    </span>
                    <button
                      type="button"
                      onClick={() => add(product)}
                      disabled={left <= 0}
                      className="crm-btn crm-btn--ghost"
                    >
                      <IconPlus size={16} stroke={1.75} />
                      Añadir
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Ticket ── */}
        <div className="crm-card lg:sticky lg:top-(--space-md)">
          <div className="crm-card__head">
            <h2 className="crm-h2">Venta</h2>
            {lines.length > 0 ? (
              <button
                type="button"
                onClick={() => setLines([])}
                className="crm-btn crm-btn--quiet"
              >
                <IconTrash size={16} stroke={1.75} />
                Vaciar
              </button>
            ) : null}
          </div>

          <div className="crm-card__body">
            {lines.length === 0 ? (
              <div className="crm-empty">
                <IconShoppingCart size={28} stroke={1.5} className="mx-auto mb-2 opacity-40" />
                Añade productos para empezar la venta.
              </div>
            ) : (
              <ul className="flex flex-col gap-(--space-xs)">
                {lines.map((line) => (
                  <li key={line.product.id} className="flex items-center gap-(--space-2xs)">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {line.product.name}
                      </p>
                      <p className="crm-muted text-xs tabular-nums">
                        {formatUsd(line.product.price)} c/u
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQty(line.product.id, line.qty - 1)}
                      aria-label={`Quitar una unidad de ${line.product.name}`}
                      className="crm-step"
                    >
                      <IconMinus size={15} stroke={2} />
                    </button>
                    {/* Input, no texto: con solo los botones ± poner 12
                        unidades son doce pulsaciones y no hay forma de
                        teclear la cantidad. */}
                    <input
                      type="number"
                      min="1"
                      max={line.product.stock}
                      value={line.qty}
                      onChange={(e) =>
                        setQty(line.product.id, Math.trunc(+e.target.value || 0))
                      }
                      aria-label={`Cantidad de ${line.product.name}`}
                      className="crm-field w-14 px-1 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setQty(line.product.id, line.qty + 1)}
                      disabled={line.qty >= line.product.stock}
                      aria-label={`Añadir una unidad de ${line.product.name}`}
                      className="crm-step"
                    >
                      <IconPlus size={15} stroke={2} />
                    </button>
                    <span className="w-16 text-right text-sm font-medium tabular-nums">
                      {formatUsd(line.product.price * line.qty)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-(--space-md) border-t border-(--crm-line) pt-(--space-sm)">
              <label htmlFor="payment" className="crm-label">
                Método de pago
              </label>
              <select
                id="payment"
                name="payment"
                defaultValue="usd_efectivo"
                className="crm-field"
              >
                {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <label htmlFor="note" className="crm-label mt-(--space-xs)">
                Nota <span className="crm-muted">(opcional)</span>
              </label>
              <input
                id="note"
                name="note"
                type="text"
                placeholder="Cliente, referencia del pago…"
                className="crm-field"
              />
            </div>

            <div
              className="mt-(--space-md) border-t border-(--crm-line) pt-(--space-sm)"
              aria-live="polite"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Total</span>
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
                <IconAlertTriangle size={16} stroke={1.75} className="inline align-text-bottom" />{" "}
                {state.error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={lines.length === 0 || pending}
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
                  Registrar venta
                </>
              )}
            </button>
            <p className="crm-muted mt-(--space-2xs) text-center text-xs">
              Al registrarla se descuenta el stock automáticamente.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
