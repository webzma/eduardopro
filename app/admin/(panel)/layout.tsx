import Link from "next/link";
import { requireStaff } from "../../lib/auth";
import { getRate } from "../../lib/rate";
import { formatRate } from "../../lib/money";
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

  return (
    <div className="crm-shell">
      {/* El sidebar mete siete enlaces antes del contenido en CADA página.
          Sin esto, quien navega con teclado los recorre una y otra vez. */}
      <a href="#contenido" className="crm-skip">
        Saltar al contenido
      </a>

      <aside className="crm-side" aria-label="Barra lateral">
        <div>
          <Link href="/admin" className="font-display text-lg uppercase">
            EduardoPro
          </Link>
          <p className="crm-navgroup mt-1 px-0">Panel de gestión</p>
        </div>

        <Nav role={role} />

        <div className="mt-auto border-t border-paper/15 pt-(--space-sm)">
          {/* La tasa vive en el shell, no en una pantalla: se consulta de
              reojo mientras se cobra, sin cambiar de página. */}
          <h2 className="crm-navgroup px-0">Tasa del día</h2>
          {rate ? (
            <>
              <p className="text-sm font-semibold tabular-nums text-paper">
                Bs {formatRate(rate.value)}
                <span className="font-normal text-paper/50"> / $1</span>
              </p>
              <p className="mt-0.5 text-[11px] text-paper/50">
                {rate.source === "bcv" ? "BCV, en vivo" : "Respaldo manual"}
              </p>
            </>
          ) : (
            <p className="text-sm text-paper/70">
              Sin tasa.{" "}
              {role === "admin" ? (
                <Link href="/admin/ajustes" className="underline">
                  Fíjala
                </Link>
              ) : (
                "Avisa al administrador."
              )}
            </p>
          )}

          <div className="mt-(--space-sm) border-t border-paper/15 pt-(--space-sm)">
            <p className="truncate text-[11px] text-paper/60">{user.email}</p>
            <p className="mt-0.5 text-[11px] text-paper/45">
              {role === "admin" ? "Administrador" : "Vendedor"}
            </p>
            <div className="mt-(--space-2xs) flex flex-wrap items-center gap-(--space-2xs)">
              <Link
                href="/"
                className="text-[11px] text-paper/70 underline hover:text-paper"
              >
                Ver sitio
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-[11px] text-paper/70 underline hover:text-paper"
                >
                  Salir
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <main id="contenido" tabIndex={-1} className="crm-main">
        {children}
      </main>
    </div>
  );
}
