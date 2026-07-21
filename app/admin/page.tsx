import { requireAdmin } from "../lib/auth";
import { getProducts } from "../lib/products";
import {
  adjustStockAction,
  toggleActiveAction,
  createProductAction,
  logoutAction,
} from "./actions";
import DeleteButton from "./DeleteButton";

export const dynamic = "force-dynamic";

const OK_MESSAGES: Record<string, string> = {
  creado: "Producto creado.",
  actualizado: "Producto actualizado.",
  eliminado: "Producto eliminado.",
};

const ERROR_MESSAGES: Record<string, string> = {
  nombre: "El nombre es obligatorio.",
  noexiste: "Ese producto ya no existe.",
};

const inputClass =
  "w-full border-b border-hair bg-transparent py-2.5 text-[15px] text-cream outline-none transition-colors placeholder:text-ink/50 focus:border-accent";

const labelClass =
  "mb-1.5 block font-mono text-[10px] tracking-[0.22em] text-ink";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const products = await getProducts();
  const { ok, error } = await searchParams;

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const activeCount = products.filter((p) => p.active).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  const stats = [
    { label: "PRODUCTOS", value: products.length },
    { label: "ACTIVOS", value: activeCount },
    { label: "UNIDADES EN STOCK", value: totalStock },
    { label: "AGOTADOS", value: outOfStock },
  ];

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10 md:px-10">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-hair pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-[11px] tracking-[0.3em] text-accent">
            PANEL DE INVENTARIO
          </p>
          <h1 className="font-display text-[38px] font-bold leading-none tracking-tight">
            EduardoPro
          </h1>
        </div>
        <div className="flex items-center gap-6 font-mono text-[11px] tracking-[0.2em]">
          <a
            href="/"
            className="text-ink transition-colors hover:text-cream"
          >
            VER SITIO ↗
          </a>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-ink transition-colors hover:text-cream"
            >
              SALIR
            </button>
          </form>
        </div>
      </header>

      {/* Flash messages */}
      {ok && OK_MESSAGES[ok] ? (
        <p className="mt-6 border border-accent/40 bg-accent/10 px-4 py-3 font-mono text-[12px] tracking-[0.12em] text-accent">
          {OK_MESSAGES[ok]}
        </p>
      ) : null}
      {error && ERROR_MESSAGES[error] ? (
        <p className="mt-6 border border-[#e08a8a]/40 bg-[#e08a8a]/10 px-4 py-3 font-mono text-[12px] tracking-[0.12em] text-[#e08a8a]">
          {ERROR_MESSAGES[error]}
        </p>
      ) : null}

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-px border border-hair bg-hair md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-bg p-5">
            <p className="font-display text-[34px] leading-none text-accent">
              {stat.value}
            </p>
            <p className="mt-2 font-mono text-[10px] tracking-[0.2em] text-ink">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Inventory list */}
      <section className="mt-12">
        <h2 className="mb-5 font-mono text-[11px] tracking-[0.26em] text-ink">
          INVENTARIO ({products.length})
        </h2>
        <div className="flex flex-col gap-px border border-hair bg-hair">
          {products.length === 0 ? (
            <p className="bg-bg p-8 text-center font-mono text-[12px] tracking-[0.12em] text-ink">
              No hay productos. Agrega el primero abajo.
            </p>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col gap-4 bg-bg p-4 sm:flex-row sm:items-center sm:gap-5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-16 w-16 shrink-0 rounded object-cover"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-[20px]">{product.name}</h3>
                    {!product.active ? (
                      <span className="font-mono text-[9px] tracking-[0.18em] text-ink">
                        OCULTO
                      </span>
                    ) : null}
                  </div>
                  <p className="font-mono text-[10px] tracking-[0.18em] text-ink">
                    {product.category || "—"} · ${product.price}
                  </p>
                </div>

                {/* Stock control */}
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[9px] tracking-[0.18em] text-ink">
                    STOCK
                  </span>
                  <form action={adjustStockAction}>
                    <input type="hidden" name="id" value={product.id} />
                    <input type="hidden" name="delta" value="-1" />
                    <button
                      type="submit"
                      aria-label="Restar una unidad"
                      className="flex size-8 items-center justify-center border border-hair text-cream transition-colors hover:border-accent hover:text-accent"
                    >
                      −
                    </button>
                  </form>
                  <span
                    className={`w-8 text-center font-display text-[22px] ${
                      product.stock === 0
                        ? "text-[#e08a8a]"
                        : product.stock <= 3
                          ? "text-accent"
                          : "text-cream"
                    }`}
                  >
                    {product.stock}
                  </span>
                  <form action={adjustStockAction}>
                    <input type="hidden" name="id" value={product.id} />
                    <input type="hidden" name="delta" value="1" />
                    <button
                      type="submit"
                      aria-label="Sumar una unidad"
                      className="flex size-8 items-center justify-center border border-hair text-cream transition-colors hover:border-accent hover:text-accent"
                    >
                      +
                    </button>
                  </form>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-5 sm:justify-end">
                  <form action={toggleActiveAction}>
                    <input type="hidden" name="id" value={product.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={(!product.active).toString()}
                    />
                    <button
                      type="submit"
                      className="font-mono text-[11px] tracking-[0.16em] text-ink transition-colors hover:text-cream"
                    >
                      {product.active ? "OCULTAR" : "MOSTRAR"}
                    </button>
                  </form>
                  <a
                    href={`/admin/${product.id}`}
                    className="font-mono text-[11px] tracking-[0.16em] text-ink transition-colors hover:text-cream"
                  >
                    EDITAR
                  </a>
                  <DeleteButton id={product.id} name={product.name} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* New product */}
      <section className="mt-12 border border-hair p-6 md:p-8">
        <h2 className="mb-6 font-display text-[26px] font-bold tracking-tight">
          Nuevo producto
        </h2>
        <form
          action={createProductAction}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label htmlFor="new-name" className={labelClass}>
              NOMBRE
            </label>
            <input
              id="new-name"
              name="name"
              type="text"
              required
              placeholder="Ej. Tijera de corte"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="new-category" className={labelClass}>
              CATEGORÍA
            </label>
            <input
              id="new-category"
              name="category"
              type="text"
              placeholder="Ej. TIJERA PROFESIONAL"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="new-image" className={labelClass}>
              IMAGEN (URL O RUTA)
            </label>
            <input
              id="new-image"
              name="image"
              type="text"
              placeholder="/products/... o https://..."
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="new-price" className={labelClass}>
              PRECIO (USD)
            </label>
            <input
              id="new-price"
              name="price"
              type="number"
              min="0"
              step="1"
              defaultValue={0}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="new-stock" className={labelClass}>
              STOCK INICIAL
            </label>
            <input
              id="new-stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              defaultValue={0}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-3 font-mono text-[11px] tracking-[0.16em] text-ink sm:col-span-2">
            <input
              type="checkbox"
              name="active"
              defaultChecked
              className="size-4 accent-[#d4916e]"
            />
            MOSTRAR EN EL SITIO
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="btn-accent bg-accent px-9 py-3.5 font-mono text-[12px] font-medium tracking-[0.2em] text-[#171412] transition-colors"
            >
              AGREGAR PRODUCTO
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
