import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SupabaseSetupError, supabaseConfig } from "./config";

/* LA CLAVE SECRETA VIVE AQUÍ Y EN NINGÚN OTRO SITIO.
 *
 * Se salta RLS por completo: con ella se lee y se escribe cualquier fila de
 * cualquier tabla, sin políticas de por medio. Por eso este archivo hace una
 * sola cosa —crear la cuenta en auth.users, que es lo único que la Admin API
 * de Supabase no deja hacer de otra forma— y por eso el rol NO se reparte
 * desde aquí: eso va por grant_staff(), con la sesión de quien pulsa el botón
 * y con is_admin() decidiendo en la base.
 *
 * `import "server-only"` no es decorativo: si algún día un Client Component
 * importa esto por error, el build falla con un mensaje claro en vez de mandar
 * la llave al navegador. */

const KEY_VARS = ["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

// Igual que en config.ts: process.env no se indexa dinámicamente en el bundle,
// así que la tabla va explícita. Ninguna lleva NEXT_PUBLIC_ — si lo llevara,
// Next la enviaría al navegador y la base entera quedaría abierta.
const LITERAL: Record<string, string | undefined> = {
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

function secretKey(): string {
  for (const name of KEY_VARS) {
    const value = LITERAL[name]?.trim();
    if (value) {
      if (value.startsWith("sb_publishable_")) {
        throw new SupabaseSetupError(
          `${name} contiene la clave PUBLICABLE. Con esa clave no se pueden crear cuentas: usa la secreta (sb_secret_…) de Project Settings → API Keys.`,
        );
      }
      return value;
    }
  }
  throw new SupabaseSetupError(
    "Falta la clave secreta: define SUPABASE_SECRET_KEY en .env.local y en el despliegue (Supabase → Project Settings → API Keys → secret). Sin ella se pueden repartir roles, pero no crear cuentas nuevas.",
  );
}

/** Cliente con permisos de administración. Solo para crear cuentas. */
export function createAdminClient() {
  const { url } = supabaseConfig();
  return createSupabaseClient(url, secretKey(), {
    // Este cliente no es de nadie: no guarda sesión ni refresca tokens. Si los
    // guardara, se mezclaría con la sesión real de quien está usando el panel.
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** true si el despliegue tiene clave secreta. La pantalla lo usa para avisar
 *  antes de enseñar un formulario que no podría funcionar. */
export function hasAdminKey(): boolean {
  return KEY_VARS.some((name) => Boolean(LITERAL[name]?.trim()));
}
