/** Falta un paso de configuración (env o esquema), no un fallo de la base. */
export class SupabaseSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseSetupError";
  }
}

// Se aceptan los nombres nuevos de Supabase y los antiguos por compatibilidad.
const URL_VARS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"];
const KEY_VARS = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

// process.env no se puede indexar dinámicamente en el bundle del cliente: Next
// sustituye NEXT_PUBLIC_* por su valor en tiempo de compilación solo cuando lo
// ve escrito literalmente. De ahí la tabla explícita.
const LITERAL: Record<string, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

function read(names: string[]): string | undefined {
  for (const name of names) {
    const value = LITERAL[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

/** URL y clave publicable del proyecto. Lanza si falta alguna. */
export function supabaseConfig(): { url: string; key: string } {
  const url = read(URL_VARS);
  const key = read(KEY_VARS);

  if (!url) {
    throw new SupabaseSetupError(
      "Falta la URL del proyecto: define NEXT_PUBLIC_SUPABASE_URL en .env.local.",
    );
  }
  if (!key) {
    throw new SupabaseSetupError(
      "Falta la clave publicable: define NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local (Supabase → Project Settings → API Keys).",
    );
  }
  // La clave secreta ignora RLS. Si acaba en el navegador, cualquiera puede
  // vaciar el inventario, así que se rechaza de plano.
  if (key.startsWith("sb_secret_") || key.startsWith("service_role")) {
    throw new SupabaseSetupError(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY contiene una clave SECRETA. Esa clave ignora RLS y las variables NEXT_PUBLIC_ se envían al navegador. Usa la publishable key (sb_publishable_…).",
    );
  }

  return { url, key };
}

const RUN_SCHEMA =
  "Vuelve a ejecutar supabase/schema.sql en Supabase → SQL Editor (es idempotente).";

/**
 * Traduce los errores de PostgREST que en realidad significan "te falta correr
 * el esquema", para no enseñarle al usuario un código y un mensaje en inglés.
 *   PGRST205 → la tabla no está en el schema cache: no se ha creado.
 *   PGRST202 → la función no existe: falta la parte nueva del esquema.
 */
export function fail(error: { code?: string; message: string }): never {
  if (error.code === "PGRST205") {
    const table = /'([^']+)'/.exec(error.message)?.[1];
    throw new SupabaseSetupError(
      `${table ? `La tabla ${table}` : "Una de las tablas"} no existe. ${RUN_SCHEMA}`,
    );
  }
  if (error.code === "PGRST202") {
    throw new SupabaseSetupError(
      `Falta una función en la base (${error.message.match(/[a-z_]+\(/)?.[0] ?? "…"}). ${RUN_SCHEMA}`,
    );
  }
  throw new Error(error.message);
}
