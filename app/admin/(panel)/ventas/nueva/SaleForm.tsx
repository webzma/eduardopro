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
import { buttonVariants } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/app/lib/utils";

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
  // El Select de Radix no es un <select> nativo, así que no viaja solo en el
  // envío: el valor se guarda en estado y se manda por un input oculto.
  const [payment, setPayment] = useState("usd_efectivo");
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
        {/* ── Buscador y catálogo ── */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
            <h2 className="text-base font-semibold">Productos</h2>
            <div className="relative max-w-64 flex-1">
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
                placeholder="Buscar por nombre o categoría…"
                aria-label="Buscar productos"
                className="pl-7"
              />
            </div>
          </div>

          {results.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">Ningún producto coincide con la búsqueda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((product) => {
                const taken = inCart.get(product.id) ?? 0;
                const left = product.stock - taken;
                return (
                  <li
                    key={product.id}
                    className="flex items-center gap-4 p-2 px-4"
                  >
                    <Image
                      src={imageSrc(product.image)}
                      alt=""
                      width={36}
                      height={36}
                      className="size-9 shrink-0 rounded border border-border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {product.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate text-xs">
                        {product.category || "Sin categoría"} ·{" "}
                        {formatUsd(product.price)} ·{" "}
                        {formatBs(product.price, rate)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
                        left <= 0
                          ? "bg-primary/15 text-primary"
                          : left <= 3
                            ? "bg-muted text-secondary-foreground"
                            : "bg-muted text-secondary-foreground"
                      }`}
                    >
                      {left} disp.
                    </span>
                    <button
                      type="button"
                      onClick={() => add(product)}
                      disabled={left <= 0}
                      className={buttonVariants({ variant: "outline" })}
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
        <div className="rounded-lg border bg-card shadow-sm lg:sticky lg:top-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
            <h2 className="text-base font-semibold">Venta</h2>
            {lines.length > 0 ? (
              <button
                type="button"
                onClick={() => setLines([])}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <IconTrash size={16} stroke={1.75} />
                Vaciar
              </button>
            ) : null}
          </div>

          <div className="p-4">
            {lines.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                <IconShoppingCart size={28} stroke={1.5} className="mx-auto mb-2 opacity-40" />
                Añade productos para empezar la venta.
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {lines.map((line) => (
                  <li key={line.product.id} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {line.product.name}
                      </p>
                      <p className="text-sm text-muted-foreground text-xs tabular-nums">
                        {formatUsd(line.product.price)} c/u
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQty(line.product.id, line.qty - 1)}
                      aria-label={`Quitar una unidad de ${line.product.name}`}
                      className={buttonVariants({ variant: "outline", size: "icon-sm" })}
                    >
                      <IconMinus size={15} stroke={2} />
                    </button>
                    {/* Input, no texto: con solo los botones ± poner 12
                        unidades son doce pulsaciones y no hay forma de
                        teclear la cantidad. */}
                    <Input
                      type="number"
                      min="1"
                      max={line.product.stock}
                      value={line.qty}
                      onChange={(e) =>
                        setQty(line.product.id, Math.trunc(+e.target.value || 0))
                      }
                      aria-label={`Cantidad de ${line.product.name}`}
                      className="w-14 px-1 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setQty(line.product.id, line.qty + 1)}
                      disabled={line.qty >= line.product.stock}
                      aria-label={`Añadir una unidad de ${line.product.name}`}
                      className={buttonVariants({ variant: "outline", size: "icon-sm" })}
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

            <div className="mt-6 border-t border-border pt-4">
              <Label htmlFor="payment">Método de pago</Label>
              <Select
                name="payment"
                value={payment}
                onValueChange={setPayment}
              >
                <SelectTrigger id="payment" className="w-full">
                  <SelectValue placeholder="Elige cómo se cobró" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label htmlFor="note" className="mb-1 block text-sm font-medium text-secondary-foreground mt-3">
                Nota <span className="text-sm text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="note"
                name="note"
                type="text"
                placeholder="Cliente, referencia del pago…"
                
              />
            </div>

            <div
              className="mt-6 border-t border-border pt-4"
              aria-live="polite"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="text-xl font-semibold tabular-nums">
                  {formatUsd(total)}
                </span>
              </div>
              <div className="mt-0.5 flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground text-xs">A la tasa del día</span>
                <span className="text-base font-medium tabular-nums text-primary">
                  {formatBs(total, rate)}
                </span>
              </div>
            </div>

            {state.error ? (
              <p role="alert" className="rounded-md border border-l-4 bg-card px-4 py-2 text-sm border-l-destructive text-destructive mt-3">
                <IconAlertTriangle size={16} stroke={1.75} className="inline align-text-bottom" />{" "}
                {state.error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={lines.length === 0 || pending}
              className={cn(buttonVariants(), "mt-3 w-full")}
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
            <p className="text-sm text-muted-foreground mt-2 text-center text-xs">
              Al registrarla se descuenta el stock automáticamente.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
