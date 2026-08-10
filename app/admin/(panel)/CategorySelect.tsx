import type { ComponentProps } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { categoryOptions, SIN_CATEGORIA } from "@/app/lib/categories";
import { cn } from "@/app/lib/utils";

/* El selector de categoría de los tres formularios que la piden.
 *
 * Es un <select> nativo, no el de Radix, por lo mismo que los roles del login
 * son radios: viaja en el envío como un campo más y funciona sin JavaScript,
 * que es lo que sostiene a estos formularios cuando la conexión de la tienda
 * se cae a la mitad. Encima, en un teléfono el desplegable del sistema se
 * maneja mejor que cualquier lista que dibujemos nosotros.
 *
 * Sirve igual controlado (value + onChange, como en Compras) que sin controlar
 * (defaultValue, como en Inventario): no tiene estado propio. */
export default function CategorySelect({
  className,
  ...props
}: ComponentProps<"select">) {
  const selected = String(props.value ?? props.defaultValue ?? "");

  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          "h-9 w-full min-w-0 appearance-none rounded-md border border-input bg-transparent py-1 pr-8 pl-3 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          // El desplegable lo pinta el sistema: sin esto, en modo oscuro
          // salen letras oscuras sobre fondo oscuro en algunos navegadores.
          "[&_option]:bg-popover [&_option]:text-popover-foreground",
          selected ? "" : "text-muted-foreground",
          className,
        )}
      >
        {/* La categoría es opcional, así que "sin categoría" es una opción de
            verdad y no el hueco que queda cuando no se elige nada. */}
        <option value="">{SIN_CATEGORIA}</option>
        {categoryOptions(selected).map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <IconChevronDown
        size={16}
        stroke={1.75}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
