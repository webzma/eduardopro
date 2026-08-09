import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// En Next 16 esto se llama `proxy.ts`; el convenio `middleware.ts` quedó
// obsoleto. Su único trabajo es refrescar el token de Supabase antes de que
// se rendericen las páginas de /admin: los Server Components no pueden
// escribir cookies, así que sin esto una sesión caducada no se renovaría
// nunca y el admin echaría al usuario cada hora.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Sin configurar, /admin ya muestra su propio aviso — aquí solo se deja pasar.
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // No metas nada entre esto y el return: getUser() es lo que dispara el
  // refresco, y cualquier return por otro camino se llevaría las cookies
  // nuevas por delante.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Solo /admin necesita sesión. Limitar el matcher evita que el proxy corra
  // sobre _next/static, imágenes y el resto de la landing, que es anónima.
  matcher: ["/admin/:path*"],
};
