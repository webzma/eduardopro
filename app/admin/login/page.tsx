import Link from "next/link";
import { IconShieldLock, IconUserCheck } from "@tabler/icons-react";
import { loginAction } from "../actions";
import { buttonVariants } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { ROLE_LABELS } from "@/app/lib/money";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  campos: "Escribe tu correo y tu contraseña.",
  credenciales: "Correo o contraseña incorrectos.",
  noacceso:
    "Esa cuenta existe pero no tiene acceso al panel. Pide que te den de alta como administrador o vendedor.",
};

const ROLES = [
  {
    value: "admin",
    label: "Administrador",
    hint: "Compras, inventario y cifras del negocio",
    icon: IconShieldLock,
  },
  {
    value: "vendedor",
    label: "Vendedor",
    hint: "Registrar ventas y cerrar caja",
    icon: IconUserCheck,
  },
] as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; rol?: string; suyo?: string }>;
}) {
  const { error, rol, suyo } = await searchParams;

  // El rol es una elección de la persona, no un permiso: quien manda es
  // public.staff. Aquí solo se recuerda lo que marcó para no reiniciar el
  // formulario en cada intento fallido.
  const elegido = rol === "vendedor" ? "vendedor" : "admin";

  const message =
    error === "rol"
      ? `Esa cuenta es de ${ROLE_LABELS[suyo ?? ""] ?? "otro rol"}, no de ${
          elegido === "admin" ? "administrador" : "vendedor"
        }. Cambia la opción de arriba y vuelve a entrar.`
      : error
        ? ERRORS[error]
        : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center p-(--page-gutter)">
      <div className="w-full max-w-sm rounded-lg border bg-card shadow-sm">
        <div className="p-4">
          <p className="font-display text-lg uppercase">EduardoPro</p>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">
            Entrar al panel
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Inventario y ventas.
          </p>

          <form action={loginAction} className="mt-6">
            {/* Radios, no botones con estado: el selector funciona sin
                JavaScript y viaja en el envío como un campo más. */}
            <fieldset className="mb-4">
              <legend className="mb-1.5 text-sm font-medium text-secondary-foreground">
                Entrar como
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((role) => (
                  <label key={role.value} className="block cursor-pointer">
                    <input
                      type="radio"
                      name="rol"
                      value={role.value}
                      defaultChecked={elegido === role.value}
                      className="peer sr-only"
                    />
                    <span className="block h-full rounded-md border-2 border-border p-2.5 transition-colors peer-checked:border-primary peer-checked:bg-tintsignal peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        <role.icon size={16} stroke={1.75} aria-hidden />
                        {role.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {role.hint}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <Label htmlFor="email" className="mb-1 block">
              Correo
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              placeholder="tu@correo.com"
            />

            <Label
              htmlFor="password"
              className="mt-4 mb-1 block text-sm font-medium text-secondary-foreground"
            >
              Contraseña
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              aria-invalid={error === "credenciales" || undefined}
              aria-describedby={message ? "login-error" : undefined}
            />

            {message ? (
              <p
                id="login-error"
                role="status"
                className="mt-3 rounded-md border border-l-4 border-l-destructive bg-tintsignal px-4 py-2 text-sm text-destructive"
              >
                {message}
              </p>
            ) : null}

            <button type="submit" className={cn(buttonVariants(), "mt-6 w-full")}>
              Entrar
            </button>
          </form>

          <Link
            href="/"
            className="mt-6 inline-block text-sm text-muted-foreground underline"
          >
            ← Volver al sitio
          </Link>
        </div>
      </div>
    </div>
  );
}
