"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconShoppingCartPlus,
  IconReceipt,
  IconPackages,
  IconPackageImport,
  IconTruckDelivery,
  IconSettings,
  type Icon,
} from "@tabler/icons-react";
import type { Role } from "../../lib/auth";

type Item = { href: string; label: string; icon: Icon; adminOnly?: boolean };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Operación",
    items: [
      { href: "/admin", label: "Resumen", icon: IconLayoutDashboard },
      {
        href: "/admin/ventas/nueva",
        label: "Registrar venta",
        icon: IconShoppingCartPlus,
      },
      { href: "/admin/ventas", label: "Ventas", icon: IconReceipt },
    ],
  },
  {
    title: "Abastecimiento",
    items: [
      {
        href: "/admin/compras/nueva",
        label: "Registrar compra",
        icon: IconPackageImport,
        adminOnly: true,
      },
      {
        href: "/admin/compras",
        label: "Compras",
        icon: IconTruckDelivery,
        adminOnly: true,
      },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/admin/inventario", label: "Inventario", icon: IconPackages },
      {
        href: "/admin/ajustes",
        label: "Ajustes",
        icon: IconSettings,
        adminOnly: true,
      },
    ],
  },
];

export default function Nav({ role }: { role: Role }) {
  const pathname = usePathname();

  // Las rutas "padre" (/admin, /admin/ventas, /admin/compras) solo se marcan
  // en coincidencia exacta; si no, quedarían activas a la vez que su propia
  // subruta /nueva y habría dos elementos resaltados.
  const EXACT = ["/admin", "/admin/ventas", "/admin/compras"];
  const isActive = (href: string) =>
    EXACT.includes(href) ? pathname === href : pathname.startsWith(href);

  return (
    <nav aria-label="Panel" className="crm-nav">
      {GROUPS.map((group) => {
        const items = group.items.filter(
          (item) => !item.adminOnly || role === "admin",
        );
        if (items.length === 0) return null;
        return (
          <div key={group.title}>
            <p className="crm-navgroup">{group.title}</p>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="crm-navlink"
              >
                <item.icon size={18} stroke={1.75} aria-hidden />
                {item.label}
              </Link>
            ))}
          </div>
        );
      })}
    </nav>
  );
}
