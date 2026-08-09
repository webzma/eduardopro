import Link from "next/link";
import { IconLogout, IconExternalLink, IconCoin } from "@tabler/icons-react";
import { requireStaff } from "@/app/lib/auth";
import { getRate } from "@/app/lib/rate";
import { formatRate } from "@/app/lib/money";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { Toaster } from "@/app/components/ui/sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/app/components/ui/sidebar";
import { logoutAction } from "../actions";
import Nav from "./Nav";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Una sola comprobación para todo el panel. Cada página vuelve a pedir lo
  // suyo (requireAdmin donde toque): el layout no es una garantía de permiso,
  // solo evita pintar el shell a quien no debe verlo.
  const { user, role } = await requireStaff();
  const rate = await getRate();
  const isAdmin = role === "admin";

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <Link href="/admin">
                  <span className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                    <IconCoin size={18} stroke={1.75} aria-hidden />
                  </span>
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-display text-base uppercase">
                      EduardoPro
                    </span>
                    <span className="truncate text-xs opacity-60">
                      Panel de gestión
                    </span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <Nav role={role} />
        </SidebarContent>

        <SidebarFooter>
          <Separator className="bg-sidebar-border" />
          {/* La tasa vive en el shell, no en una pantalla: se consulta de reojo
              mientras se cobra, sin cambiar de página. Se oculta al plegar el
              sidebar, donde no cabría. */}
          <div className="px-2 group-data-[collapsible=icon]:hidden">
            <p className="text-xs opacity-60">Tasa del día</p>
            {rate ? (
              <>
                <p className="text-sm font-semibold tabular-nums">
                  Bs {formatRate(rate.value)}
                  <span className="font-normal opacity-60"> / $1</span>
                </p>
                <p className="mt-0.5 text-xs opacity-50">
                  {rate.source === "bcv" ? "BCV, en vivo" : "Respaldo manual"}
                </p>
              </>
            ) : (
              <p className="text-sm opacity-80">
                Sin tasa.{" "}
                {isAdmin ? (
                  <Link href="/admin/ajustes" className="underline">
                    Fíjala
                  </Link>
                ) : (
                  "Avisa al administrador."
                )}
              </p>
            )}
          </div>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Ver el sitio público">
                <Link href="/" target="_blank" rel="noopener noreferrer">
                  <IconExternalLink size={18} stroke={1.75} aria-hidden />
                  <span>Ver sitio</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <form action={logoutAction}>
                <SidebarMenuButton asChild tooltip="Cerrar sesión">
                  <button type="submit" className="w-full">
                    <IconLogout size={18} stroke={1.75} aria-hidden />
                    <span>Salir</span>
                  </button>
                </SidebarMenuButton>
              </form>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        {/* Barra superior: el disparador del sidebar (que en móvil abre el
            Sheet), quién eres y con qué rol. */}
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden truncate text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? "Administrador" : "Vendedor"}
            </Badge>
          </div>
        </header>

        <main id="contenido" tabIndex={-1} className="min-w-0 p-4 pb-16">
          {children}
        </main>
      </SidebarInset>

      {/* Avisos de acción completada. Los errores siguen en línea: un toast se
          va solo y un fallo tiene que poder releerse. */}
      <Toaster position="bottom-right" />
    </SidebarProvider>
  );
}
