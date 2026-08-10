import Link from "next/link";
import {
  IconPackageImport,
  IconShoppingBagX,
  IconTruckDelivery,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconFilterOff,
} from "@tabler/icons-react";
import { requireAdmin } from "../../../lib/auth";
import { getPurchasesPage } from "../../../lib/purchases";
import { formatBs, formatUsd } from "../../../lib/money";
import PeriodFilter from "../PeriodFilter";
import {
  isPeriod,
  periodStart,
  veDayFromKey,
  veEndOfDay,
  type Period,
} from "@/app/lib/period";
import { formatDate, formatDateTime, formatTime } from "@/app/lib/dates";
import { cn } from "@/app/lib/utils";
import {
  celdaSecundaria,
  EmptyState,
  PageHeader,
  ProductMosaic,
  RowMeta,
  RowMetaItem,
} from "../ui";
import { buttonVariants } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";

export const dynamic = "force-dynamic";

/** Compras por página. El mismo número que en Ventas: las dos pantallas se
 *  usan igual y no hay razón para que se comporten distinto. */
const PER_PAGE = 25;

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Cómo se lee cada atajo dentro de una frase. */
const SCOPE_LABELS: Record<Period, string> = {
  hoy: "de hoy",
  "7d": "de los últimos 7 días",
  mes: "de este mes",
  todo: "de todo el histórico",
};

/** Lo que manda el <input type="date">. Si llega otra cosa, no hay filtro: en
 *  una fecha inventada es mejor no recortar nada que recortar por hoy. */
function dateKey(value: string | undefined): string {
  return value && DATE_KEY.test(value) ? value : "";
}

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{
    periodo?: string;
    q?: string;
    desde?: string;
    hasta?: string;
    pagina?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const search = (params.q ?? "").trim();
  let desde = dateKey(params.desde);
  let hasta = dateKey(params.hasta);
  // Fechas al revés: se enderezan en vez de devolver cero compras y dejar a
  // quien busca preguntándose qué hizo mal.
  if (desde && hasta && hasta < desde) [desde, hasta] = [hasta, desde];

  /* El rango a mano y los atajos de periodo son el MISMO filtro, así que no
   * pueden estar activos a la vez: en cuanto hay fechas, mandan ellas y
   * ningún atajo se pinta como elegido. */
  const range = Boolean(desde || hasta);
  const period: Period | null = range
    ? null
    : isPeriod(params.periodo)
      ? params.periodo
      : "mes";

  const sinceIso = desde
    ? veDayFromKey(desde).toISOString()
    : period
      ? periodStart(period)
      : null;
  // El día "hasta" entra entero: se corta en la medianoche siguiente.
  const untilIso = hasta
    ? veEndOfDay(veDayFromKey(hasta)).toISOString()
    : null;

  const { purchases, total, totalUsd, units, capped, page, pages } =
    await getPurchasesPage(
      { search, sinceIso, untilIso },
      Number(params.pagina) || 1,
      PER_PAGE,
    );

  const filtering = Boolean(search || range);
  const pageUsd = purchases.reduce((sum, p) => sum + p.totalUsd, 0);

  /* Qué se está mirando, dicho con palabras. Sin esto, las cifras de arriba
   * son tres números sueltos: 14 compras ¿de cuándo? */
  const rango =
    desde && hasta
      ? `del ${formatDate(veDayFromKey(desde))} al ${formatDate(veDayFromKey(hasta))}`
      : desde
        ? `desde el ${formatDate(veDayFromKey(desde))}`
        : hasta
          ? `hasta el ${formatDate(veDayFromKey(hasta))}`
          : period
            ? SCOPE_LABELS[period]
            : "";
  const alcance = [
    search ? `«${search}»` : null,
    rango,
    capped ? "se suman las 2000 más recientes" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  /** Enlace a otra página conservando el filtro. La página 1 no lleva
   *  parámetro: la URL de la primera pantalla queda limpia. */
  function pageHref(n: number): string {
    const query = new URLSearchParams();
    if (search) query.set("q", search);
    if (desde) query.set("desde", desde);
    if (hasta) query.set("hasta", hasta);
    if (period) query.set("periodo", period);
    if (n > 1) query.set("pagina", String(n));
    const text = query.toString();
    return text ? `/admin/compras?${text}` : "/admin/compras";
  }

  return (
    <>
      <PageHeader
        title="Compras"
        icon={IconTruckDelivery}
        description="Lo que le pagaste a los proveedores."
        action={
          <Link href="/admin/compras/nueva" className={buttonVariants()}>
            <IconPackageImport size={16} stroke={1.75} aria-hidden />
            Registrar compra
          </Link>
        }
      />

      {/* Los atajos de periodo y el buscador son EL MISMO filtro, así que van
          en una sola caja. */}
      <div className="mb-4 overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b border-border p-3">
          <PeriodFilter
            base="/admin/compras"
            active={period}
            keep={{ q: search }}
          />
        </div>

        {/* Un formulario GET de toda la vida: el filtro acaba en la URL, se
            puede compartir y volver atrás, y funciona sin JavaScript. Se envía
            sin `pagina` a propósito — al cambiar de filtro se empieza por la
            primera página, no por la séptima de la búsqueda anterior. */}
        <form
          method="get"
          action="/admin/compras"
          className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-end"
        >
          {period ? (
            <input type="hidden" name="periodo" value={period} />
          ) : null}

          <div className="min-w-0">
            <Label htmlFor="q" className="mb-1 block">
              Buscar producto
            </Label>
            <div className="relative">
              <IconSearch
                size={16}
                stroke={1.75}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="q"
                name="q"
                type="search"
                defaultValue={search}
                placeholder="Ej. cera, tijera…"
                className="pl-7"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="desde" className="mb-1 block">
              Desde
            </Label>
            <Input id="desde" name="desde" type="date" defaultValue={desde} />
          </div>

          <div>
            <Label htmlFor="hasta" className="mb-1 block">
              Hasta
            </Label>
            <Input id="hasta" name="hasta" type="date" defaultValue={hasta} />
          </div>

          {/* Contorno, no relleno: el rojo de esta pantalla es de "Registrar
              compra". Dos botones rojos y ninguno de los dos destaca. */}
          <button
            type="submit"
            className={buttonVariants({ variant: "outline" })}
          >
            <IconSearch size={16} stroke={1.75} aria-hidden />
            Filtrar
          </button>
        </form>
      </div>

      {/* Tres cifras en una línea, cada una con su palabra al lado. El rojo va
          en el dinero porque aquí SALE: pintarlo del verde de lo facturado
          sería mentir con el color. */}
      {total > 0 ? (
        <p className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            <strong className="text-base font-semibold tabular-nums text-foreground">
              {total}
            </strong>{" "}
            {total === 1 ? "compra" : "compras"}
          </span>
          <span>
            <strong className="font-semibold tabular-nums text-foreground">
              {units}
            </strong>{" "}
            {/* Con búsqueda por nombre son las unidades DE ESE producto, no
                las del pedido entero: es lo que se está preguntando, pero hay
                que decirlo o el número engaña. */}
            {search ? "unidades de lo buscado" : "unidades recibidas"}
          </span>
          <span>
            Pagado{" "}
            <strong className="font-semibold tabular-nums text-signal">
              {formatUsd(totalUsd)}
            </strong>
          </span>
          <span className="text-xs">{alcance}</span>
          {filtering ? (
            <Link
              href="/admin/compras"
              className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground"
            >
              <IconFilterOff size={14} stroke={1.75} aria-hidden />
              Limpiar filtros
            </Link>
          ) : null}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        {purchases.length === 0 ? (
          filtering ? (
            <EmptyState icon={IconShoppingBagX} title="Ninguna compra coincide">
              <Link href="/admin/compras" className="underline">
                Quitar los filtros
              </Link>
            </EmptyState>
          ) : (
            <EmptyState icon={IconShoppingBagX} title="Todavía no hay compras">
              <Link href="/admin/compras/nueva" className="underline">
                Registra la primera
              </Link>
            </EmptyState>
          )
        ) : (
          <>
            {/* El scroll es de la TABLA, no de la página: la cabecera se queda
                fija arriba y los filtros y la paginación no se van de la
                pantalla al recorrer las filas. La región es focusable porque
                una zona que se desplaza tiene que poder recorrerse con el
                teclado, y por eso mismo lleva su nombre accesible. */}
            <Table
              className="table-fixed lg:table-auto"
              containerProps={{
                // Se adapta a la pantalla en vez de ser un alto fijo: en un
                // portátil no tapa la paginación y en un monitor grande no
                // deja media pantalla en blanco.
                className:
                  "max-h-[clamp(22rem,64vh,50rem)] overflow-y-auto overscroll-contain",
                role: "region",
                "aria-labelledby": "tabla-compras",
                tabIndex: 0,
              }}
            >
              <TableCaption id="tabla-compras" className="sr-only">
                Compras registradas, con su fecha, proveedor y total
              </TableCaption>
              {/* La cabecera se pega a cada celda y no al <thead>: con
                  border-collapse, pegar la fila entera se lleva por delante su
                  línea inferior. De ahí también la sombra, que la repinta. */}
              <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-band [&_th]:shadow-[inset_0_-2px_0_var(--border)]">
                <TableRow>
                  <TableHead className="w-24 lg:w-28">
                    <span className="sr-only">Productos</span>
                  </TableHead>
                  <TableHead>Producto / ID</TableHead>
                  <TableHead className={celdaSecundaria}>Fecha y hora</TableHead>
                  <TableHead className={celdaSecundaria}>Proveedor</TableHead>
                  <TableHead className={`${celdaSecundaria} text-right`}>
                    Unidades
                  </TableHead>
                  <TableHead className={`${celdaSecundaria} text-right`}>
                    Total pagado
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {purchases.map((purchase) => {
                  const unidades = purchase.lines.reduce((n, l) => n + l.qty, 0);
                  const fecha = new Date(purchase.boughtAt);
                  // Los 6 primeros caracteres del uuid bastan para nombrar una
                  // compra en voz alta sin leer 36 caracteres.
                  const ref = `#${purchase.id.slice(0, 6).toUpperCase()}`;
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell className="py-3">
                        {/* Varios renglones, varias fotos en el mismo cuadro. */}
                        <ProductMosaic
                          className="w-20 lg:w-24"
                          images={purchase.lines.map((l) => l.productImage)}
                        />
                      </TableCell>

                      {/* th, no td: el nombre es la cabecera de su fila, así un
                          lector de pantalla lo repite al leer cada celda. Y es
                          el único enlace de la fila. */}
                      <th
                        scope="row"
                        className="w-full p-2 text-left align-middle font-normal"
                      >
                        <div className="flex items-start justify-between gap-2 lg:block">
                          <Link
                            href={`/admin/compras/${purchase.id}`}
                            aria-label={`Compra ${ref} del ${formatDateTime(fecha)}, ${formatUsd(purchase.totalUsd)}`}
                            className="block min-w-0 rounded-sm hover:underline lg:max-w-64 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            <span className="block truncate font-medium">
                              {purchase.lines
                                .map((l) => l.productName)
                                .join(", ") || "Sin renglones"}
                            </span>
                            <span className="mt-0.5 block text-xs font-semibold tracking-[0.04em] text-muted-foreground">
                              {ref}
                              {purchase.lines.length > 1
                                ? ` · ${purchase.lines.length} productos`
                                : null}
                            </span>
                          </Link>
                          <span className="shrink-0 text-right lg:hidden">
                            <span className="block font-semibold tabular-nums text-signal">
                              {formatUsd(purchase.totalUsd)}
                            </span>
                            <span className="mt-0.5 block text-[0.6875rem] tabular-nums text-muted-foreground">
                              {formatBs(purchase.totalUsd, purchase.rate)}
                            </span>
                          </span>
                        </div>
                        <RowMeta>
                          <RowMetaItem label="Fecha">
                            {formatDateTime(fecha)}
                          </RowMetaItem>
                          <RowMetaItem label="Uds.">{unidades}</RowMetaItem>
                          <RowMetaItem label="Proveedor">
                            {purchase.supplier ?? "—"}
                          </RowMetaItem>
                        </RowMeta>
                      </th>

                      <TableCell className={`${celdaSecundaria} whitespace-nowrap`}>
                        <span className="block">{formatDate(fecha)}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {formatTime(fecha)}
                        </span>
                      </TableCell>

                      <TableCell className={celdaSecundaria}>
                        <span className="block max-w-40 truncate">
                          {purchase.supplier ?? "—"}
                        </span>
                      </TableCell>

                      <TableCell
                        className={`${celdaSecundaria} text-right tabular-nums whitespace-nowrap`}
                      >
                        {/* Cuántos renglones ya lo dice la celda del producto
                            ("· 3 productos"): repetirlo aquí era ruido. */}
                        {unidades}
                      </TableCell>

                      <TableCell
                        className={`${celdaSecundaria} text-right whitespace-nowrap`}
                      >
                        <span className="block font-semibold tabular-nums text-signal">
                          {formatUsd(purchase.totalUsd)}
                        </span>
                        {/* A la tasa guardada con la compra, no a la de hoy: el
                            histórico no se mueve cuando cambia el dólar. */}
                        <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                          {formatBs(purchase.totalUsd, purchase.rate)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>

              <TableFooter>
                <TableRow>
                  {/* colSpan no entiende de media queries: se pintan dos pies
                      y cada uno aparece en su tamaño de pantalla. */}
                  <TableCell colSpan={2} className="font-medium lg:hidden">
                    Total de esta página
                    <span className="ml-2 font-semibold tabular-nums">
                      {formatUsd(pageUsd)}
                    </span>
                  </TableCell>
                  <TableCell
                    colSpan={5}
                    className="hidden font-medium lg:table-cell"
                  >
                    Total de esta página
                  </TableCell>
                  <TableCell
                    className={`${celdaSecundaria} text-right font-semibold tabular-nums`}
                  >
                    {formatUsd(pageUsd)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>

            {/* Paginación fuera de la zona que se desplaza: si viajara con las
                filas habría que bajar hasta el final para cambiar de página. */}
            <nav
              aria-label="Paginación de compras"
              className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-border p-3"
            >
              {/* Cuántas compras hay ya lo dice la línea de arriba: aquí solo
                  dónde estás. */}
              <p className="text-sm text-muted-foreground tabular-nums">
                Página {page} de {pages}
              </p>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link
                    href={pageHref(page - 1)}
                    rel="prev"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <IconChevronLeft size={16} stroke={1.75} aria-hidden />
                    Anterior
                  </Link>
                ) : (
                  // Deshabilitado como <span>, no como enlace muerto: un enlace
                  // que no lleva a ninguna parte se anuncia igual y frustra.
                  <span
                    aria-disabled="true"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "pointer-events-none opacity-50",
                    )}
                  >
                    <IconChevronLeft size={16} stroke={1.75} aria-hidden />
                    Anterior
                  </span>
                )}
                {page < pages ? (
                  <Link
                    href={pageHref(page + 1)}
                    rel="next"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Siguiente
                    <IconChevronRight size={16} stroke={1.75} aria-hidden />
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "pointer-events-none opacity-50",
                    )}
                  >
                    Siguiente
                    <IconChevronRight size={16} stroke={1.75} aria-hidden />
                  </span>
                )}
              </div>
            </nav>
          </>
        )}
      </div>
    </>
  );
}
