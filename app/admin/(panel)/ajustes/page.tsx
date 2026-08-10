import {
  IconCircleCheck,
  IconAlertTriangle,
  IconDeviceFloppy,
  IconSettings,
  IconUsers,
  IconUserPlus,
  IconShieldLock,
} from "@tabler/icons-react";
import { requireAdmin } from "../../../lib/auth";
import { getSettings } from "../../../lib/settings";
import { getRate } from "../../../lib/rate";
import { formatRate } from "../../../lib/money";
import { formatDateTime } from "../../../lib/dates";
import { getStaff } from "../../../lib/staff";
import { hasAdminKey } from "../../../lib/supabase/admin";
import { createStaffAction, setRateAction } from "../../actions";
import { PageHeader } from "../ui";
import PasswordField from "./PasswordField";
import RevokeStaff from "./RevokeStaff";
import { cn } from "@/app/lib/utils";
import { buttonVariants } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";

export const dynamic = "force-dynamic";

const OK_MESSAGES: Record<string, string> = {
  tasa: "Tasa de respaldo guardada.",
  equipo: "Cuenta creada y acceso concedido.",
  baja: "Acceso retirado.",
};

const ERROR_MESSAGES: Record<string, string> = {
  tasa: "Escribe un número mayor que cero.",
  correo: "Escribe un correo válido.",
  clave: "La contraseña de la cuenta nueva necesita al menos 8 caracteres.",
  confirmacion: "Tu contraseña no es correcta. No se hizo ningún cambio.",
  cuenta: "No se pudo crear la cuenta.",
  rol: "La cuenta se creó, pero no se le pudo dar el rol.",
  baja: "No se pudo retirar el acceso.",
  nadie: "No se indicó a quién dar de baja.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; detalle?: string }>;
}) {
  const { user } = await requireAdmin();
  const [settings, rate, staff, params] = await Promise.all([
    getSettings(),
    getRate(),
    getStaff(),
    searchParams,
  ]);
  const puedeCrearCuentas = hasAdminKey();

  return (
    <>
      <PageHeader
        title="Ajustes"
        icon={IconSettings}
        description="Tasa de cambio y quién entra al panel."
      />

      {params.ok && OK_MESSAGES[params.ok] ? (
        <p role="status" className="mb-6 rounded-md border border-l-4 border-l-jade bg-tintjade px-4 py-2 text-sm">
          <IconCircleCheck size={16} stroke={1.75} className="inline align-text-bottom" />{" "}
          {OK_MESSAGES[params.ok]}
        </p>
      ) : null}
      {params.error && ERROR_MESSAGES[params.error] ? (
        <p role="alert" className="mb-6 rounded-md border border-l-4 border-l-destructive bg-tintsignal px-4 py-2 text-sm text-destructive">
          <IconAlertTriangle size={16} stroke={1.75} className="inline align-text-bottom" />{" "}
          {params.detalle ?? ERROR_MESSAGES[params.error]}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border bg-band p-4">
            <h2 className="text-base font-semibold">Tasa en uso</h2>
            {rate ? (
              <Badge variant={rate.source === "bcv" ? "secondary" : "outline"}>
                {rate.source === "bcv" ? "BCV, en vivo" : "Respaldo manual"}
              </Badge>
            ) : (
              <Badge variant="destructive">Sin tasa</Badge>
            )}
          </div>
          <div className="p-4">
            {rate ? (
              <>
                <p className="text-xl leading-tight font-semibold tracking-tight tabular-nums">
                  Bs {formatRate(rate.value)}
                  <span className="text-base font-normal text-muted-foreground"> / $1</span>
                </p>
                {rate.updatedAt ? (
                  <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">
                    Dato del {formatDateTime(rate.updatedAt)}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                El BCV no responde y no hay respaldo. Sin tasa no se pueden
                registrar ventas.
              </p>
            )}
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              La tasa se toma del BCV automáticamente y se refresca cada hora.
              Cada venta guarda la que se usó, así que cambiarla no altera el
              histórico.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border bg-band p-4">
            <h2 className="text-base font-semibold">Respaldo manual</h2>
          </div>
          <div className="p-4">
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              Se usa solo si la API del BCV no responde. Conviene mantenerlo al
              día: es lo único que evita que el panel se quede sin poder
              facturar cuando el servicio se cae.
            </p>
            <form action={setRateAction}>
              <Label htmlFor="rate" className="mb-1 block">
                Bolívares por dólar
              </Label>
              <Input
                id="rate"
                name="rate"
                type="text"
                inputMode="decimal"
                required
                defaultValue={
                  settings.fallbackRate > 0
                    ? String(settings.fallbackRate)
                    : rate
                      ? String(rate.value)
                      : ""
                }
                placeholder="756,7083"
                aria-invalid={params.error === "tasa" ? true : undefined}
                className="max-w-48"
              />
              {settings.updatedAt ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Última vez: {formatDateTime(settings.updatedAt)}
                </p>
              ) : null}
              <button type="submit" className={cn(buttonVariants(), "mt-3")}>
                <IconDeviceFloppy size={16} stroke={1.75} />
                Guardar respaldo
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Equipo ──────────────────────────────────────────────────────── */}
      <div
        id="equipo"
        className="mt-6 overflow-hidden rounded-lg border bg-card shadow-sm scroll-mt-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border bg-band p-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <IconUsers size={18} stroke={1.75} aria-hidden />
            Equipo
          </h2>
          <span className="text-xs text-muted-foreground">
            {staff.length} {staff.length === 1 ? "persona" : "personas"}
          </span>
        </div>

        <ul className="divide-y divide-border">
          {staff.map((persona) => {
            const eresTu = persona.userId === user.id;
            return (
              <li
                key={persona.userId}
                className="flex flex-wrap items-center justify-between gap-2 p-4"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">
                      {persona.email ?? "Sin correo"}
                    </span>
                    <Badge
                      variant={
                        persona.role === "admin" ? "default" : "secondary"
                      }
                    >
                      {persona.role === "admin" ? "Administrador" : "Vendedor"}
                    </Badge>
                    {eresTu ? <Badge variant="outline">Tú</Badge> : null}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Desde el {formatDateTime(persona.createdAt)}
                  </p>
                </div>
                {/* A uno mismo no: la base lo rechaza igual (revoke_staff lo
                    comprueba), pero enseñar un botón que siempre falla es
                    tenderle una trampa a quien lo pulsa. */}
                {eresTu ? (
                  <span className="text-xs text-muted-foreground">
                    No puedes retirarte el acceso a ti mismo
                  </span>
                ) : (
                  <RevokeStaff
                    userId={persona.userId}
                    email={persona.email ?? "esa persona"}
                  />
                )}
              </li>
            );
          })}
        </ul>

        <div className="border-t-2 border-border p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <IconUserPlus size={16} stroke={1.75} aria-hidden />
            Dar de alta a alguien
          </h3>

          {puedeCrearCuentas ? (
            <form action={createStaffAction} className="mt-3 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="email" className="mb-1 block">
                    Correo
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="off"
                    placeholder="vendedor@ejemplo.com"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Con este correo entrará al panel.
                  </p>
                </div>

                <PasswordField />
              </div>

              {/* Radios, no un desplegable: son dos opciones y una de ellas da
                  las llaves de todo. Mejor verlas las dos a la vez. */}
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-secondary-foreground">
                  Qué podrá hacer
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block cursor-pointer">
                    <input
                      type="radio"
                      name="rol"
                      value="vendedor"
                      defaultChecked
                      className="peer sr-only"
                    />
                    <span className="block h-full rounded-md border-2 border-border p-2.5 transition-colors peer-checked:border-primary peer-checked:bg-tintsignal peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
                      <span className="block text-sm font-semibold">
                        Vendedor
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Registra ventas y corrige existencias. No ve costos,
                        márgenes ni las ventas de los demás.
                      </span>
                    </span>
                  </label>
                  <label className="block cursor-pointer">
                    <input
                      type="radio"
                      name="rol"
                      value="admin"
                      className="peer sr-only"
                    />
                    <span className="block h-full rounded-md border-2 border-border p-2.5 transition-colors peer-checked:border-primary peer-checked:bg-tintsignal peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
                      <span className="block text-sm font-semibold">
                        Administrador
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Todo: precios, compras, cifras del negocio y dar de
                        alta a otras personas.
                      </span>
                    </span>
                  </label>
                </div>
              </fieldset>

              {/* La sesión dice quién eres; esto dice que sigues siendo tú. */}
              <div className="rounded-md border-2 border-border bg-band p-3">
                <Label
                  htmlFor="confirmacion"
                  className="mb-1 flex items-center gap-2"
                >
                  <IconShieldLock size={16} stroke={1.75} aria-hidden />
                  Confirma con TU contraseña
                </Label>
                <Input
                  id="confirmacion"
                  name="confirmacion"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="max-w-72"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Dar de alta reparte permisos, así que se pide otra vez la
                  contraseña de {user.email}. Si alguien se sienta en tu silla
                  con el panel abierto, no le basta.
                </p>
              </div>

              <div>
                <button type="submit" className={buttonVariants()}>
                  <IconUserPlus size={16} stroke={1.75} />
                  Crear cuenta y dar acceso
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-3 rounded-md border border-l-4 border-l-amber bg-tintamber px-4 py-3 text-sm">
              <p className="font-medium">
                Falta la clave secreta para poder crear cuentas.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-secondary-foreground">
                Define <code>SUPABASE_SECRET_KEY</code> en el entorno (Supabase
                → Project Settings → API Keys → secret) y reinicia. Mientras
                tanto, crea la cuenta en Supabase → Authentication → Add user
                (marcando «Auto Confirm User») y vuelve aquí: retirar accesos sí
                funciona sin esa clave.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
