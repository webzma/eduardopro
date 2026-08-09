"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconShoppingCartPlus,
  IconReceipt,
  IconCashRegister,
  IconPackages,
  IconPackageImport,
  IconTruckDelivery,
  IconSettings,
  type Icon,
} from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/components/ui/sidebar";
import type { Role } from "@/app/lib/auth";

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
      { href: "/admin/caja", label: "Cierre de caja", icon: IconCashRegister },
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

// Las rutas "padre" solo se marcan en coincidencia exacta; si no, quedarían
// activas a la vez que su propia subruta /nueva y habría dos resaltadas.
const EXACT = ["/admin", "/admin/ventas", "/admin/compras"];

export default function Nav({ role }: { role: Role }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    EXACT.includes(href) ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {GROUPS.map((group) => {
        const items = group.items.filter(
          (item) => !item.adminOnly || role === "admin",
        );
        if (items.length === 0) return null;
        return (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      // Lo deriva la ruta, no un estado de cliente que pueda
                      // desincronizarse. isActive pinta; aria-current anuncia.
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                    >
                      <Link
                        href={item.href}
                        aria-current={isActive(item.href) ? "page" : undefined}
                      >
                        <item.icon size={18} stroke={1.75} aria-hidden />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
}
