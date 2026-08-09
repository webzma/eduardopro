import Link from "next/link";
import { loginAction } from "../actions";

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
      <div className="crm-card w-full max-w-sm">
        <div className="crm-card__body">
          <p className="font-display text-lg uppercase">EduardoPro</p>
          <h1 className="crm-h1 mt-(--space-sm)">Entrar al panel</h1>
          <p className="crm-muted mt-0.5">Inventario y ventas.</p>

          <form action={loginAction} className="mt-(--space-md)">
            <label htmlFor="email" className="crm-label">
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              placeholder="tu@correo.com"
              className="crm-field"
            />

            <label htmlFor="password" className="crm-label mt-(--space-sm)">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              aria-invalid={error === "credenciales" || undefined}
              aria-describedby={message ? "login-error" : undefined}
              className="crm-field"
            />

            {message ? (
              <p
                id="login-error"
                role="status"
                className="crm-note crm-note--bad mt-(--space-sm)"
              >
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              className="crm-btn crm-btn--primary mt-(--space-md) w-full"
            >
              Entrar
            </button>
          </form>

          <Link
            href="/"
            className="crm-muted mt-(--space-md) inline-block text-sm underline"
          >
            ← Volver al sitio
          </Link>
        </div>
      </div>
    </div>
  );
}
