import {
  IconPlus,
  IconMinus,
  IconAlertTriangle,
  IconCircleCheck,
  IconPackages,
} from "@tabler/icons-react";
import { requireStaff } from "../../../lib/auth";
import { getProducts, SupabaseSetupError, type Product } from "../../../lib/products";
import { getRate } from "../../../lib/rate";
import { formatBs, formatPct, formatUsd, marginPct } from "../../../lib/money";
import { adjustStockAction, createProductAction } from "../../actions";
import RowActions from "./RowActions";
import ImagePicker from "./ImagePicker";
import { imageSrc } from "../../../lib/images";
import { EmptyState, Notice, PageHeader } from "../ui";
import { Button, buttonVariants } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";

export const dynamic = "force-dynamic";

const OK_MESSAGES: Record<string, string> = {
  creado: "Producto creado.",
  actualizado: "Producto actualizado.",
  eliminado: "Producto eliminado.",
};

const ERROR_MESSAGES: Record<string, string> = {
  nombre: "El nombre es obligatorio.",
  noexiste: "Ese producto ya no existe.",
  soloadmin: "Esa pantalla es solo para administradores.",
  imagen: "No se pudo subir la imagen.",
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; detalle?: string }>;
}) {
  const { role } = await requireStaff();
  const isAdmin = role === "admin";

  let products: Product[];
  try {
    products = await getProducts();
  } catch (err) {
    if (err instanceof SupabaseSetupError) {
      return (
        <>
          <h1 className="text-xl font-semibold tracking-tight">Falta configurar la base</h1>
          <div className="mt-4">
            <Notice kind="bad" icon={IconAlertTriangle}>
              {err.message}
            </Notice>
          </div>
        </>
      );
    }
    throw err;
  }

  const [rate, params] = await Promise.all([getRate(), searchParams]);

  return (
    <>
      <PageHeader
        title="Inventario"
        description={
          <>
            {products.length}{" "}
            {products.length === 1 ? "producto" : "productos"}
            {isAdmin
              ? ""
              : " · como vendedor puedes corregir existencias, nada más"}
          </>
        }
      />

      {params.ok && OK_MESSAGES[params.ok] ? (
        <div className="mb-6">
          <Notice kind="ok" icon={IconCircleCheck}>
            {OK_MESSAGES[params.ok]}
          </Notice>
        </div>
      ) : null}
      {params.error && ERROR_MESSAGES[params.error] ? (
        <div className="mb-6">
          <Notice kind="bad" icon={IconAlertTriangle}>
            {params.detalle ?? ERROR_MESSAGES[params.error]}
          </Notice>
        </div>
      ) : null}

      <div className="rounded-lg border bg-card shadow-sm">
        {products.length === 0 ? (
          <EmptyState icon={IconPackages} title="No hay productos todavía">
            {isAdmin ? "Agrega el primero en el formulario de abajo." : null}
          </EmptyState>
        ) : (
          // Aquí SÍ es una tabla: el sentido de esta pantalla es comparar
          // costo, precio, margen y stock entre productos, fila a fila. Como se
          // desplaza en horizontal, la región es focusable — una zona con
          // scroll tiene que poder recorrerse con el teclado.
          <div
            className="overflow-x-auto"
            role="region"
            aria-labelledby="tabla-inventario"
            tabIndex={0}
          >
            <Table>
              <TableCaption id="tabla-inventario" className="sr-only">
                Productos del catálogo con su stock, precio y estado
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">
                    <span className="sr-only">Foto</span>
                  </TableHead>
                  <TableHead>Producto</TableHead>
                  {isAdmin ? (
                    <TableHead className="text-right">Costo</TableHead>
                  ) : null}
                  <TableHead className="text-right">Precio</TableHead>
                  {isAdmin ? (
                    <TableHead className="text-right">Margen</TableHead>
                  ) : null}
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  {isAdmin ? (
                    <TableHead className="text-right">Acciones</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>

              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="py-3">
                      <Avatar className="size-14 rounded-md border">
                        <AvatarImage
                          src={imageSrc(product.image)}
                          alt=""
                          className="object-cover"
                        />
                        {/* Si la foto no carga, las iniciales antes que un
                            hueco roto. */}
                        <AvatarFallback className="rounded-md text-xs">
                          {product.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>

                    {/* th, no td: el nombre es la cabecera de su fila, así un
                        lector de pantalla lo repite al leer cada celda. */}
                    <th
                      scope="row"
                      className="max-w-56 p-2 text-left align-middle font-normal"
                    >
                      <span className="block truncate font-medium">
                        {product.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {product.category || "Sin categoría"}
                      </span>
                    </th>

                    {isAdmin ? (
                      <TableCell className="text-right tabular-nums whitespace-nowrap">
                        {product.cost > 0 ? (
                          formatUsd(product.cost)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    ) : null}

                    <TableCell className="text-right whitespace-nowrap">
                      <span className="block font-medium tabular-nums">
                        {formatUsd(product.price)}
                      </span>
                      {rate ? (
                        <span className="block text-xs tabular-nums text-muted-foreground">
                          {formatBs(product.price, rate.value)}
                        </span>
                      ) : null}
                    </TableCell>

                    {isAdmin ? (
                      <TableCell className="text-right tabular-nums whitespace-nowrap">
                        {(() => {
                          const m = marginPct(product.price, product.cost);
                          if (m === null) {
                            return <span className="text-muted-foreground">—</span>;
                          }
                          // Por debajo del 15 % el producto casi no deja nada.
                          // Se marca con color Y con palabra: el color solo no
                          // se ve con daltonismo ni en una impresión.
                          return m < 15 ? (
                            <span className="text-destructive">
                              {formatPct(m)}
                              <span className="block text-xs">bajo</span>
                            </span>
                          ) : (
                            formatPct(m)
                          );
                        })()}
                      </TableCell>
                    ) : null}

                    <TableCell>
                      {/* Corregir existencias a mano: recepción de mercancía,
                          mermas, conteo. Las ventas descuentan solas. */}
                      <div className="flex items-center justify-center gap-1">
                        <form action={adjustStockAction}>
                          <input type="hidden" name="id" value={product.id} />
                          <input type="hidden" name="delta" value="-1" />
                          <Button
                            type="submit"
                            variant="outline"
                            size="icon-sm"
                            aria-label={`Restar una unidad de ${product.name}`}
                          >
                            <IconMinus size={15} stroke={2} aria-hidden />
                          </Button>
                        </form>
                        <span className="w-8 text-center font-medium tabular-nums">
                          {product.stock}
                        </span>
                        <form action={adjustStockAction}>
                          <input type="hidden" name="id" value={product.id} />
                          <input type="hidden" name="delta" value="1" />
                          <Button
                            type="submit"
                            variant="outline"
                            size="icon-sm"
                            aria-label={`Sumar una unidad de ${product.name}`}
                          >
                            <IconPlus size={15} stroke={2} aria-hidden />
                          </Button>
                        </form>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.stock === 0 ? (
                          <Badge>Agotado</Badge>
                        ) : product.stock <= 3 ? (
                          <Badge className="bg-primary/15 text-primary">
                            Quedan {product.stock}
                          </Badge>
                        ) : null}
                        {!product.active ? (
                          <Badge className="bg-navy text-paper">Oculto</Badge>
                        ) : null}
                        {product.stock > 3 && product.active ? (
                          <span className="text-xs text-muted-foreground">
                            En venta
                          </span>
                        ) : null}
                      </div>
                    </TableCell>

                    {isAdmin ? (
                      <TableCell className="text-right">
                        <RowActions
                          id={product.id}
                          name={product.name}
                          active={product.active}
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {isAdmin ? (
        <div className="rounded-lg border bg-card shadow-sm mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
            <h2 className="text-base font-semibold">Nuevo producto</h2>
          </div>
          <div className="p-4">
            <form
              action={createProductAction}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <Label htmlFor="new-name" className="mb-1 block">
                  Nombre
                </Label>
                <Input
                  id="new-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Ej. Tijera de corte"
                  
                />
              </div>
              <div>
                <Label htmlFor="new-category" className="mb-1 block">
                  Categoría
                </Label>
                <Input
                  id="new-category"
                  name="category"
                  type="text"
                  placeholder="Ej. Tijera profesional"
                  
                />
              </div>
              <fieldset className="sm:col-span-2">
                <legend className="mb-1 block">Foto</legend>
                <ImagePicker />
              </fieldset>
              <div>
                <Label htmlFor="new-cost" className="mb-1 block">
                  Costo en USD
                </Label>
                <Input
                  id="new-cost"
                  name="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={0}
                  
                />
                <p className="text-sm text-muted-foreground mt-1 text-xs">
                  Lo actualiza cada compra que registres.
                </p>
              </div>
              <div>
                <Label htmlFor="new-price" className="mb-1 block">
                  Precio de venta en USD
                </Label>
                <Input
                  id="new-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={0}
                  
                />
              </div>
              <div>
                <Label htmlFor="new-stock" className="mb-1 block">
                  Stock inicial
                </Label>
                <Input
                  id="new-stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={0}
                  
                />
              </div>
              <Label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked
                  className="size-4 accent-signal"
                />
                Mostrar en el sitio público
              </Label>
              <div className="sm:col-span-2">
                <button type="submit" className={buttonVariants()}>
                  <IconPlus size={16} stroke={1.75} />
                  Agregar producto
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
