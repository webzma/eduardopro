import Link from "next/link";
import { loginAction } from "../actions";
import { buttonVariants } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  campos: "Escribe tu correo y tu contraseña.",
  credenciales: "Correo o contraseña incorrectos.",
  noacceso:
    "Esa cuenta existe pero no tiene acceso al panel. Pide que te den de alta como administrador o vendedor.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? ERRORS[error] : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center p-(--page-gutter)">
      <div className="rounded-lg border bg-card shadow-sm w-full max-w-sm">
        <div className="p-4">
          <p className="font-display text-lg uppercase">EduardoPro</p>
          <h1 className="text-xl font-semibold tracking-tight mt-4">Entrar al panel</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Inventario y ventas.</p>

          <form action={loginAction} className="mt-6">
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

            <Label htmlFor="password" className="mb-1 block text-sm font-medium text-secondary-foreground mt-4">
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
                className="rounded-md border border-l-4 bg-card px-4 py-2 text-sm border-l-destructive text-destructive mt-3"
              >
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              className={cn(buttonVariants(), "mt-6 w-full")}
            >
              Entrar
            </button>
          </form>

          <Link
            href="/"
            className="text-sm text-muted-foreground mt-6 inline-block text-sm underline"
          >
            ← Volver al sitio
          </Link>
        </div>
      </div>
    </div>
  );
}
