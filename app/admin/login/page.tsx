import { redirect } from "next/navigation";
import { isAuthed } from "../../lib/auth";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAuthed()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="mb-3 font-mono text-[11px] tracking-[0.3em] text-accent">
          PANEL DE INVENTARIO
        </p>
        <h1 className="mb-8 font-display text-[40px] font-bold leading-none tracking-tight">
          EduardoPro
        </h1>

        <form action={loginAction} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-mono text-[11px] tracking-[0.22em] text-ink"
            >
              CONTRASEÑA
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoFocus
              className="w-full border-b border-hair bg-transparent py-3 text-[16px] text-cream outline-none transition-colors placeholder:text-ink/50 focus:border-accent"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p className="font-mono text-[12px] tracking-[0.1em] text-[#e08a8a]">
              Contraseña incorrecta.
            </p>
          ) : null}

          <button
            type="submit"
            className="btn-accent w-full bg-accent px-9 py-4 font-mono text-[12px] font-medium tracking-[0.2em] text-[#171412] transition-colors"
          >
            ENTRAR
          </button>
        </form>

        <a
          href="/"
          className="mt-8 inline-block font-mono text-[11px] tracking-[0.22em] text-ink transition-colors hover:text-cream"
        >
          ← VOLVER AL SITIO
        </a>
      </div>
    </div>
  );
}
