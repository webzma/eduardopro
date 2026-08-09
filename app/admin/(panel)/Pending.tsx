import Link from "next/link";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCoinOff,
  IconPackageImport,
  IconRefreshDot,
  type Icon,
} from "@tabler/icons-react";
import { buttonVariants } from "@/app/components/ui/button";
import type { Product } from "@/app/lib/products";
import type { Rate } from "@/app/lib/rate";

type Task = {
  icon: Icon;
  title: string;
  detail: string;
  href: string;
  cta: string;
  /** Pinta en rojo. Solo lo que cuesta dinero si se ignora. */
  urgent?: boolean;
};

const LOW_STOCK = 3;
const RATE_STALE_DAYS = 7;

/**
 * «Stock bajo: 3» es un dato; no dice qué hacer con él. Esto convierte cada
 * aviso en una acción con su botón, y desaparece cuando no queda nada
 * pendiente — una lista que siempre tiene algo se deja de mirar.
 */
export default function Pending({
  products,
  rate,
  fallbackAgeDays,
  isAdmin,
}: {
  products: Product[];
  rate: Rate | null;
  /** Días desde que se fijó la tasa de respaldo; null si nunca. Llega
   *  calculado desde la capa de datos: leer el reloj durante el render hace
   *  que el componente devuelva algo distinto con las mismas props. */
  fallbackAgeDays: number | null;
  isAdmin: boolean;
}) {
  const tasks: Task[] = [];

  const agotados = products.filter((p) => p.stock === 0);
  const bajos = products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK);

  if (agotados.length > 0) {
    tasks.push({
      icon: IconAlertTriangle,
      urgent: true,
      title: `${agotados.length} ${agotados.length === 1 ? "producto agotado" : "productos agotados"}`,
      detail: agotados
        .slice(0, 3)
        .map((p) => p.name)
        .join(", "),
      href: isAdmin ? "/admin/compras/nueva" : "/admin/inventario",
      cta: isAdmin ? "Registrar compra" : "Ver inventario",
    });
  }

  if (bajos.length > 0) {
    tasks.push({
      icon: IconPackageImport,
      title: `${bajos.length} por reponer pronto`,
      detail: bajos
        .slice(0, 3)
        .map((p) => `${p.name} (${p.stock})`)
        .join(", "),
      href: isAdmin ? "/admin/compras/nueva" : "/admin/inventario",
      cta: isAdmin ? "Registrar compra" : "Ver inventario",
    });
  }

  // Sin costo la ganancia sale inflada: esa venta cuenta como 100 % beneficio.
  if (isAdmin) {
    const sinCosto = products.filter((p) => p.active && p.cost <= 0);
    if (sinCosto.length > 0) {
      tasks.push({
        icon: IconCoinOff,
        title: `${sinCosto.length} sin costo registrado`,
        detail:
          "Mientras falte, la ganancia que ves sale más alta de lo real.",
        href: "/admin/inventario",
        cta: "Completar costos",
      });
    }

    const dias = fallbackAgeDays;
    if (dias === null || dias >= RATE_STALE_DAYS) {
      tasks.push({
        icon: IconRefreshDot,
        // Urgente solo si además el BCV está caído: ahí sí bloquea facturar.
        urgent: rate === null,
        title:
          rate === null
            ? "Sin tasa disponible"
            : "Tasa de respaldo desactualizada",
        detail:
          rate === null
            ? "El BCV no responde y no hay respaldo: no se puede facturar."
            : dias === null
              ? "Nunca se ha fijado. Si el BCV se cae, el panel se queda sin tasa."
              : `Lleva ${dias} días sin tocarse.`,
        href: "/admin/ajustes",
        cta: "Fijar tasa",
      });
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-card p-4 text-sm shadow-sm">
        <IconCircleCheck
          size={20}
          stroke={1.75}
          aria-hidden
          className="shrink-0 text-muted-foreground"
        />
        <span>Nada pendiente. Todo con existencias y los datos al día.</span>
      </div>
    );
  }

  return (
    <section aria-labelledby="pendientes" className="rounded-lg border bg-card shadow-sm">
      <div className="border-b p-4">
        <h2 id="pendientes" className="text-base font-semibold">
          Pendientes
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {tasks.length} {tasks.length === 1 ? "cosa" : "cosas"} que atender.
        </p>
      </div>
      <ul>
        {tasks.map((task) => (
          <li
            key={task.title}
            className="flex flex-wrap items-center gap-3 p-4 not-first:border-t"
          >
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
                task.urgent
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-secondary-foreground"
              }`}
            >
              <task.icon size={20} stroke={1.75} aria-hidden />
            </span>
            <span className="min-w-0 flex-1 basis-56">
              <span
                className={`block text-sm font-medium ${task.urgent ? "text-primary" : ""}`}
              >
                {task.title}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {task.detail}
              </span>
            </span>
            <Link
              href={task.href}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {task.cta}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
