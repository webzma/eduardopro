import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "./config";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Usa la clave publicable, así que TODO lo que devuelve pasa por RLS con la
 * identidad de quien hizo la petición — no hay una llave maestra que saltarse.
 *
 * Hay que crearlo por petición: guarda la sesión del usuario, y un cliente
 * compartido entre peticiones filtraría la sesión de uno a otro.
 */
export async function createClient() {
  const { url, key } = supabaseConfig();
  const store = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {
          // Los Server Components no pueden escribir cookies. Aquí no pasa
          // nada: proxy.ts refresca la sesión antes de que se renderice.
        }
      },
    },
  });
}
