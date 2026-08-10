import Link from "next/link";
import {
  IconShoppingCartPlus,
  IconReceiptOff,
  IconReceipt,
  IconPackages,
  IconCashBanknote,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconFilterOff,
} from "@tabler/icons-react";
import { requireStaff } from "@/app/lib/auth";
import { getSalesPage } from "@/app/lib/sales";
import {
  formatBs,
  formatUsd,
  PAYMENT_LABELS,
  ROLE_LABELS,
} from "@/app/lib/money";
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
  Chip,
  EmptyState,
  PAYMENT_TONES,
  PageHeader,
  ProductMosaic,
  RowMeta,
  RowMetaItem,
  Stat,
} from "../ui";

export const dynamic = "force-dynamic";

/** Ventas por página. Veinticinco caben en la ventana de la tabla sin que el
 *  desplazamiento se haga eterno ni haya que paginar cada tres filas. */
const PER_PAGE = 25;

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Lo que manda el <input type="date">. Si llega otra cosa, no hay filtro: en
 *  una fecha inventada es mejor no recortar nada que recortar por hoy. */
function dateKey(value: string | undefined): string {
  return value && DATE_KEY.test(value) ? value : "";
}

export default async function SalesPage({
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
  const { role } = await requireStaff();
  // Sin filtro por vendedor: RLS ya lo hace. El admin recibe todo y el
  // vendedor solo lo suyo, venga de donde venga la consulta.
  const params = await searchParams;
  const isAdmin = role === "admin";

  const search = (params.q ?? "").trim();
  let desde = dateKey(params.desde);
  let hasta = dateKey(params.hasta);
  // Fechas al revés: se enderezan en vez de devolver cero ventas y dejar a
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

  const { sales, total, totalUsd, units, capped, page, pages } =
    await getSalesPage(
      { search, sinceIso, untilIso },
      Number(params.pagina) || 1,
      PER_PAGE,
    );

  const filtering = Boolean(search || range);
  const pageUsd = sales.reduce((sum, s) => sum + s.totalUsd, 0);
  // Columnas que preceden a la del total, para el colSpan del pie.
  const leading = isAdmin ? 6 : 5;

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
    return text ? `/admin/ventas?${text}` : "/admin/ventas";
  }

  return (
    <>
      <PageHeader
        title="Ventas"
        icon={IconReceipt}
        description={
          isAdmin
            ? "Todas las ventas del negocio."
            : "Tus ventas. El histórico completo lo ve el administrador."
        }
        action={
          <Link href="/admin/ventas/nueva" className={buttonVariants()}>
            <IconShoppingCartPlus size={16} stroke={1.75} aria-hidden />
            Registrar venta
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <PeriodFilter
          base="/admin/ventas"
          active={period}
          keep={{ q: search }}
        />

        {/* Un formulario GET de toda la vida: el filtro acaba en la URL, se
            puede compartir y volver atrás, y funciona sin JavaScript. Se envía
            sin `pagina` a propósito — al cambiar de filtro se empieza por la
            primera página, no por la séptima de la búsqueda anterior. */}
        <form
          method="get"
          action="/admin/ventas"
          className="grid gap-3 rounded-lg border bg-card p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-end"
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

          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className={buttonVariants()}>
              <IconSearch size={16} stroke={1.75} aria-hidden />
              Filtrar
            </button>
            {filtering ? (
              <Link
                href="/admin/ventas"
                className={buttonVariants({ variant: "ghost" })}
              >
                <IconFilterOff size={16} stroke={1.75} aria-hidden />
                Limpiar
              </Link>
            ) : null}
          </div>
        </form>
      </div>

      {total > 0 ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Stat
            label={filtering ? "Ventas encontradas" : "Ventas del periodo"}
            value={String(total)}
            icon={IconReceipt}
            tone="navy"
            sub={
              pages > 1
                ? `Página ${page} de ${pages}`
                : undefined
            }
          />
          <Stat
            /* Con búsqueda por nombre esto cuenta las unidades DE ESE
               producto, no las del ticket entero: es lo que se está
               preguntando, pero hay que decirlo o el número engaña. */
            label={search ? "Unidades de lo buscado" : "Unidades vendidas"}
            value={String(units)}
            icon={IconPackages}
            tone="amber"
          />
          <Stat
            label="Total facturado"
            value={formatUsd(totalUsd)}
            icon={IconCashBanknote}
            tone="jade"
            sub={capped ? "Sobre las 2000 más recientes" : undefined}
          />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        {sales.length === 0 ? (
          filtering ? (
            <EmptyState icon={IconReceiptOff} title="Ninguna venta coincide">
              <Link href="/admin/ventas" className="underline">
                Quitar los filtros
              </Link>
            </EmptyState>
          ) : (
            <EmptyState icon={IconReceiptOff} title="Todavía no hay ventas">
              <Link href="/admin/ventas/nueva" className="underline">
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
                className: "max-h-[34rem] overflow-y-auto overscroll-contain",
                role: "region",
                "aria-labelledby": "tabla-ventas",
                tabIndex: 0,
              }}
            >
              <TableCaption id="tabla-ventas" className="sr-only">
                Ventas registradas, con su fecha, forma de pago y total
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
                  <TableHead className={celdaSecundaria}>Forma de pago</TableHead>
                  <TableHead className={`${celdaSecundaria} text-right`}>
                    Unidades
                  </TableHead>
                  {isAdmin ? (
                    <TableHead className={celdaSecundaria}>
                      Registrada por
                    </TableHead>
                  ) : null}
                  <TableHead className={`${celdaSecundaria} text-right`}>
                    Total cobrado
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sales.map((sale) => {
                  const unidades = sale.lines.reduce((n, l) => n + l.qty, 0);
                  const fecha = new Date(sale.soldAt);
                  const ref = `#${sale.id.slice(0, 6).toUpperCase()}`;
                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="py-3">
                        {/* Cuando la venta lleva varios productos el cuadro se
                            reparte entre ellos: se ve que fueron varios sin
                            leer la lista de nombres. */}
                        <ProductMosaic
                          className="w-20 md:w-24"
                          images={sale.lines.map((l) => l.productImage)}
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
                            href={`/admin/ventas/${sale.id}`}
                            aria-label={`Venta ${ref} del ${formatDateTime(fecha)}, ${formatUsd(sale.totalUsd)}`}
                            className="block min-w-0 rounded-sm hover:underline lg:max-w-64 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            <span className="block truncate font-medium">
                              {sale.lines.map((l) => l.productName).join(", ") ||
                                "Sin renglones"}
                            </span>
                            <span className="mt-0.5 block text-xs font-semibold tracking-[0.04em] text-muted-foreground">
                              {ref}
                              {sale.lines.length > 1
                                ? ` · ${sale.lines.length} productos`
                                : null}
                            </span>
                          </Link>
                          <span className="shrink-0 text-right lg:hidden">
                            <span className="block font-semibold tabular-nums text-jade">
                              {formatUsd(sale.totalUsd)}
                            </span>
                            <span className="mt-0.5 block text-[0.6875rem] tabular-nums text-muted-foreground">
                              {formatBs(sale.totalUsd, sale.rate)}
                            </span>
                          </span>
                        </div>
                        <RowMeta>
                          <RowMetaItem label="Fecha">
                            {formatDateTime(fecha)}
                          </RowMetaItem>
                          <RowMetaItem label="Uds.">{unidades}</RowMetaItem>
                          <Chip tone={PAYMENT_TONES[sale.paymentMethod]}>
                            {PAYMENT_LABELS[sale.paymentMethod] ??
                              sale.paymentMethod}
                          </Chip>
                        </RowMeta>
                      </th>

                      <TableCell className={`${celdaSecundaria} whitespace-nowrap`}>
                        <span className="block">{formatDate(fecha)}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {formatTime(fecha)}
                        </span>
                      </TableCell>

                      <TableCell className={celdaSecundaria}>
                        <Chip tone={PAYMENT_TONES[sale.paymentMethod]}>
                          {PAYMENT_LABELS[sale.paymentMethod] ??
                            sale.paymentMethod}
                        </Chip>
                      </TableCell>

                      <TableCell
                        className={`${celdaSecundaria} text-right tabular-nums whitespace-nowrap`}
                      >
                        {unidades}
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {sale.lines.length}{" "}
                          {sale.lines.length === 1 ? "renglón" : "renglones"}
                        </span>
                      </TableCell>

                      {isAdmin ? (
                        <TableCell className={`${celdaSecundaria} whitespace-nowrap`}>
                          {sale.sellerRole ? ROLE_LABELS[sale.sellerRole] : "—"}
                        </TableCell>
                      ) : null}

                      <TableCell
                        className={`${celdaSecundaria} text-right whitespace-nowrap`}
                      >
                        {/* Verde: en este panel el verde es siempre dinero que
                            entra, aquí y en el Resumen. */}
                        <span className="block font-semibold tabular-nums text-jade">
                          {formatUsd(sale.totalUsd)}
                        </span>
                        {/* A la tasa guardada con la venta, no a la de hoy: el
                            histórico no se mueve cuando cambia el dólar. */}
                        <span className="mt-0.5 block text-[0.6875rem] tabular-nums text-muted-foreground md:text-xs">
                          {formatBs(sale.totalUsd, sale.rate)}
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
                    colSpan={leading}
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
              aria-label="Paginación de ventas"
              className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-border p-3"
            >
              <p className="text-sm text-muted-foreground tabular-nums">
                Página {page} de {pages} · {total}{" "}
                {total === 1 ? "venta" : "ventas"}
                {capped ? " (se muestran las 2000 más recientes)" : ""}
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
