import Link from "next/link";
import Image from "next/image";
import {
  IconPlus,
  IconPencil,
  IconEye,
  IconEyeOff,
  IconAlertTriangle,
  IconCircleCheck,
  IconPackages,
} from "@tabler/icons-react";
import { requireStaff } from "../../../lib/auth";
import { getProducts, SupabaseSetupError, type Product } from "../../../lib/products";
import { getRate } from "../../../lib/rate";
import { formatBs, formatPct, formatUsd, marginPct } from "../../../lib/money";
import { adjustStockAction, toggleActiveAction, createProductAction } from "../../actions";
import DeleteButton from "./DeleteButton";
import ImagePicker from "./ImagePicker";
import { imageSrc } from "../../../lib/images";
import { EmptyState, Notice, PageHeader } from "../ui";

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
          <h1 className="crm-h1">Falta configurar la base</h1>
          <div className="mt-(--space-sm)">
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
        <div className="mb-(--space-md)">
          <Notice kind="ok" icon={IconCircleCheck}>
            {OK_MESSAGES[params.ok]}
          </Notice>
        </div>
      ) : null}
      {params.error && ERROR_MESSAGES[params.error] ? (
        <div className="mb-(--space-md)">
          <Notice kind="bad" icon={IconAlertTriangle}>
            {params.detalle ?? ERROR_MESSAGES[params.error]}
          </Notice>
        </div>
      ) : null}

      <div className="crm-card">
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
            className="crm-scroll"
            role="region"
            aria-labelledby="tabla-inventario"
            tabIndex={0}
          >
            <table className="crm-table">
              <caption id="tabla-inventario" className="sr-only">
                Productos del catálogo con su stock, precio y estado
              </caption>
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  {isAdmin ? <th scope="col" className="crm-num">Costo</th> : null}
                  <th scope="col" className="crm-num">Precio</th>
                  {isAdmin ? <th scope="col" className="crm-num">Margen</th> : null}
                  <th scope="col" className="crm-num">Stock</th>
                  <th scope="col">Estado</th>
                  {isAdmin ? <th scope="col"><span className="sr-only">Acciones</span></th> : null}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <th scope="row" className="text-left font-normal">
                      <div className="flex items-center gap-(--space-2xs)">
                        <Image
                          src={imageSrc(product.image)}
                          alt=""
                          width={36}
                          height={36}
                          className="size-9 shrink-0 rounded border border-(--crm-line) object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{product.name}</p>
                          <p className="crm-muted truncate text-xs">
                            {product.category || "Sin categoría"}
                          </p>
                        </div>
                      </div>
                    </th>
                    {isAdmin ? (
                      <td className="crm-num">
                        {product.cost > 0 ? (
                          formatUsd(product.cost)
                        ) : (
                          <span className="crm-muted">—</span>
                        )}
                      </td>
                    ) : null}
                    <td className="crm-num">
                      {formatUsd(product.price)}
                      {rate ? (
                        <span className="crm-muted block text-xs">
                          {formatBs(product.price, rate.value)}
                        </span>
                      ) : null}
                    </td>
                    {isAdmin ? (
                      <td className="crm-num">
                        {(() => {
                          const m = marginPct(product.price, product.cost);
                          if (m === null) {
                            return <span className="crm-muted">—</span>;
                          }
                          // Por debajo del 15 % el producto casi no deja nada.
                          // Se marca con color Y con palabra: el color solo no
                          // se ve con daltonismo ni en una impresión.
                          return m < 15 ? (
                            <span className="text-signal">
                              {formatPct(m)}
                              <span className="block text-xs">bajo</span>
                            </span>
                          ) : (
                            <span>{formatPct(m)}</span>
                          );
                        })()}
                      </td>
                    ) : null}
                    <td>
                      {/* Corregir existencias a mano: recepción de mercancía,
                          mermas, conteo. Las ventas descuentan solas. */}
                      <div className="flex items-center justify-end gap-(--space-3xs)">
                        <form action={adjustStockAction}>
                          <input type="hidden" name="id" value={product.id} />
                          <input type="hidden" name="delta" value="-1" />
                          <button
                            type="submit"
                            aria-label={`Restar una unidad de ${product.name}`}
                            className="crm-step"
                          >
                            −
                          </button>
                        </form>
                        <span className="w-8 text-center tabular-nums">
                          {product.stock}
                        </span>
                        <form action={adjustStockAction}>
                          <input type="hidden" name="id" value={product.id} />
                          <input type="hidden" name="delta" value="1" />
                          <button
                            type="submit"
                            aria-label={`Sumar una unidad de ${product.name}`}
                            className="crm-step"
                          >
                            +
                          </button>
                        </form>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-(--space-3xs)">
                        {product.stock === 0 ? (
                          <span className="crm-badge crm-badge--signal">
                            Agotado
                          </span>
                        ) : product.stock <= 3 ? (
                          <span className="crm-badge crm-badge--warn">
                            Quedan {product.stock}
                          </span>
                        ) : null}
                        {!product.active ? (
                          <span className="crm-badge crm-badge--navy">
                            Oculto
                          </span>
                        ) : null}
                      </div>
                    </td>
                    {isAdmin ? (
                      <td className="crm-num">
                        <div className="flex items-center justify-end gap-(--space-3xs)">
                          <form action={toggleActiveAction}>
                            <input type="hidden" name="id" value={product.id} />
                            <input
                              type="hidden"
                              name="active"
                              value={(!product.active).toString()}
                            />
                            <button
                              type="submit"
                              className="crm-btn crm-btn--quiet"
                              title={product.active ? "Ocultar del sitio" : "Mostrar en el sitio"}
                            >
                              {product.active ? (
                                <IconEyeOff size={16} stroke={1.75} />
                              ) : (
                                <IconEye size={16} stroke={1.75} />
                              )}
                              {product.active ? "Ocultar" : "Mostrar"}
                            </button>
                          </form>
                          <Link
                            href={`/admin/inventario/${product.id}`}
                            className="crm-btn crm-btn--quiet"
                          >
                            <IconPencil size={16} stroke={1.75} />
                            Editar
                          </Link>
                          <DeleteButton id={product.id} name={product.name} />
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAdmin ? (
        <div className="crm-card mt-(--space-md)">
          <div className="crm-card__head">
            <h2 className="crm-h2">Nuevo producto</h2>
          </div>
          <div className="crm-card__body">
            <form
              action={createProductAction}
              className="grid gap-(--space-sm) sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <label htmlFor="new-name" className="crm-label">
                  Nombre
                </label>
                <input
                  id="new-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Ej. Tijera de corte"
                  className="crm-field"
                />
              </div>
              <div>
                <label htmlFor="new-category" className="crm-label">
                  Categoría
                </label>
                <input
                  id="new-category"
                  name="category"
                  type="text"
                  placeholder="Ej. Tijera profesional"
                  className="crm-field"
                />
              </div>
              <fieldset className="sm:col-span-2">
                <legend className="crm-label">Foto</legend>
                <ImagePicker />
              </fieldset>
              <div>
                <label htmlFor="new-cost" className="crm-label">
                  Costo en USD
                </label>
                <input
                  id="new-cost"
                  name="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={0}
                  className="crm-field"
                />
                <p className="crm-muted mt-1 text-xs">
                  Lo actualiza cada compra que registres.
                </p>
              </div>
              <div>
                <label htmlFor="new-price" className="crm-label">
                  Precio de venta en USD
                </label>
                <input
                  id="new-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={0}
                  className="crm-field"
                />
              </div>
              <div>
                <label htmlFor="new-stock" className="crm-label">
                  Stock inicial
                </label>
                <input
                  id="new-stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={0}
                  className="crm-field"
                />
              </div>
              <label className="flex items-center gap-(--space-2xs) text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked
                  className="size-4 accent-signal"
                />
                Mostrar en el sitio público
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="crm-btn crm-btn--primary">
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
