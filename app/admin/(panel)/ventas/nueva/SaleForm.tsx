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
  IconPackages,
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
import { Chip } from "../../ui";
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
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border bg-band p-4">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <IconPackages size={18} stroke={1.75} aria-hidden />
              1. Elige los productos
            </h2>
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
                    className={cn(
                      "flex items-center gap-4 p-2 px-4 transition-colors even:bg-zebra",
                      // Lo que ya va en el carrito se marca en verde: al
                      // recorrer una lista larga se ve qué está pedido sin
                      // tener que mirar al ticket.
                      taken > 0 && "bg-tintjade even:bg-tintjade",
                    )}
                  >
                    <Image
                      src={imageSrc(product.image)}
                      alt=""
                      width={44}
                      height={44}
                      className="size-11 shrink-0 rounded border border-border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {product.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {product.category || "Sin categoría"} ·{" "}
                        <span className="font-semibold text-jade">
                          {formatUsd(product.price)}
                        </span>{" "}
                        · {formatBs(product.price, rate)}
                      </p>
                    </div>
                    {taken > 0 ? (
                      <Chip tone="jade">
                        {taken} en el carrito
                      </Chip>
                    ) : null}
                    {/* Agotado en rojo, por acabarse en ámbar, con existencias
                        en gris: el color solo aparece cuando dice algo. */}
                    <Chip
                      tone={left <= 0 ? "signal" : left <= 3 ? "amber" : "neutral"}
                    >
                      {left <= 0 ? "Agotado" : `${left} disp.`}
                    </Chip>
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
        <div className="overflow-hidden rounded-lg border-2 border-signal bg-card shadow-sm lg:sticky lg:top-6">
          {/* El ticket va en rojo de arriba abajo: es la columna donde se
              cierra la venta, no una tarjeta más de la pantalla. */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-signal p-4 text-paper">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <IconShoppingCart size={18} stroke={1.75} aria-hidden />
              2. Carrito
              {lines.length > 0 ? (
                <span className="rounded-full bg-paper px-2 text-sm font-bold text-signal tabular-nums">
                  {lines.length}
                </span>
              ) : null}
            </h2>
            {lines.length > 0 ? (
              <button
                type="button"
                onClick={() => setLines([])}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-paper hover:bg-paper hover:text-signal",
                )}
              >
                <IconTrash size={16} stroke={1.75} />
                Vaciar
              </button>
            ) : null}
          </div>

          <div className="p-4">
            {lines.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-tintsignal text-signal">
                  <IconShoppingCart size={26} stroke={1.5} aria-hidden />
                </span>
                Añade productos para empezar la venta.
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {lines.map((line) => (
                  <li
                    key={line.product.id}
                    className="rounded-md border border-border bg-zebra p-2"
                  >
                    {/* La foto también en el carrito, no solo en el catálogo.
                        Quien cobra mira el ticket, no la lista de la
                        izquierda: sin la foto aquí, comprobar que lo añadido
                        es lo que el cliente tiene en la mano obliga a leer
                        nombres que se parecen entre sí. */}
                    <div className="flex items-center gap-2">
                      <Image
                        src={imageSrc(line.product.image)}
                        alt=""
                        width={40}
                        height={40}
                        className="size-10 shrink-0 rounded border border-border object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {line.product.name}
                        </p>
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {formatUsd(line.product.price)} c/u
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-jade">
                        {formatUsd(line.product.price * line.qty)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQty(line.product.id, line.qty - 1)}
                        aria-label={`Quitar una unidad de ${line.product.name}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "icon-sm",
                        })}
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
                          setQty(
                            line.product.id,
                            Math.trunc(+e.target.value || 0),
                          )
                        }
                        aria-label={`Cantidad de ${line.product.name}`}
                        className="w-14 bg-card px-1 text-center"
                      />
                      <button
                        type="button"
                        onClick={() => setQty(line.product.id, line.qty + 1)}
                        disabled={line.qty >= line.product.stock}
                        aria-label={`Añadir una unidad de ${line.product.name}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "icon-sm",
                        })}
                      >
                        <IconPlus size={15} stroke={2} />
                      </button>
                      <span className="ml-auto text-xs text-muted-foreground">
                        Quedan {line.product.stock - line.qty}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 border-t-2 border-border pt-4">
              <p className="mb-2 text-[0.6875rem] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                3. Cómo se cobró
              </p>
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

              <Label
                htmlFor="note"
                className="mt-3 mb-1 block text-sm font-medium text-secondary-foreground"
              >
                Nota{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  (opcional)
                </span>
              </Label>
              <Input
                id="note"
                name="note"
                type="text"
                placeholder="Cliente, referencia del pago…"
              />
            </div>

            {/* El total, en verde y en su propia caja. Es la cifra que se le
                canta al cliente: no puede competir con el resto del panel. */}
            <div
              className="mt-6 rounded-md border-2 border-jade bg-tintjade p-3"
              aria-live="polite"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[0.6875rem] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                  Total a cobrar
                </span>
                <span className="text-2xl leading-tight font-semibold tabular-nums text-jade">
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
              <p
                role="alert"
                className="mt-3 rounded-md border border-l-4 border-l-destructive bg-tintsignal px-4 py-2 text-sm text-destructive"
              >
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
              disabled={lines.length === 0 || pending}
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
                  Registrar venta
                </>
              )}
            </button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Al registrarla se descuenta el stock automáticamente.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
