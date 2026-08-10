/* Las categorías del catálogo, en un solo sitio.
 *
 * Antes cada formulario tenía un campo de texto libre, así que el mismo
 * producto acababa en "cera", "Cera", "CERA DE PEINADO MATE" y "ceras" según
 * quién lo escribiera: cuatro categorías distintas para la base y para el
 * buscador, una sola para una persona. Con una lista cerrada eso no puede
 * pasar, y de paso el sitio público muestra siempre el mismo rótulo.
 *
 * Lo que se guarda en la base es el rótulo tal cual, no un código: la columna
 * `category` sigue siendo texto y las pantallas que ya la mostraban no tienen
 * que traducir nada. El precio de esto es que renombrar una categoría exige
 * actualizar las filas (hay un ejemplo en supabase/schema.sql).
 *
 * Para añadir una: escríbela aquí y ya aparece en los tres formularios. */
export const CATEGORIES = [
  "Máquinas y cortadoras",
  "Tijeras",
  "Navajas y afeitado",
  "Cuidado de barba",
  "Ceras y pomadas",
  "Shampoo y tratamientos",
  "Tintes y coloración",
  "Peines y cepillos",
  "Capas y accesorios",
  "Higiene y desinfección",
  "Repuestos y cuchillas",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Lo que se muestra cuando un producto no tiene categoría. */
export const SIN_CATEGORIA = "Sin categoría";

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

/**
 * Lo que llega del formulario, filtrado contra la lista. Todo lo que no esté
 * en ella se convierte en "" (sin categoría) en vez de guardarse: es la única
 * forma de que la lista sea de verdad cerrada, porque un `select` no impide
 * que alguien mande otra cosa a mano.
 *
 * `keep` es la excepción, y existe por los productos que ya estaban en la base
 * con una categoría escrita a mano: al editar uno, su valor de siempre se
 * respeta si no se toca el selector. Así guardar el precio no le borra la
 * categoría por la espalda; para cambiarla, se elige una de la lista.
 */
export function readCategory(value: string, keep?: string): string {
  const clean = value.trim();
  if (isCategory(clean)) return clean;
  if (keep && clean === keep.trim()) return clean;
  return "";
}

/**
 * Las opciones del selector. Si el producto trae una categoría que no está en
 * la lista (las de antes de que existiera), se añade al final: verla es lo que
 * permite decidir por cuál cambiarla, y esconderla la borraría en silencio.
 */
export function categoryOptions(current?: string): readonly string[] {
  const clean = current?.trim();
  return clean && !isCategory(clean) ? [...CATEGORIES, clean] : CATEGORIES;
}
