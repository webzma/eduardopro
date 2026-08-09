import { createClient } from "./supabase/server";

export type Rate = {
  /** Bolívares por 1 USD. */
  value: number;
  source: "bcv" | "manual";
  /** Cuándo se actualizó el dato en su origen. */
  updatedAt: string | null;
};

// De los tres servicios públicos que se probaron, este es el único que
// respondía; los de pydolarve daban timeout. De ahí que exista el respaldo:
// estas APIs no son oficiales y se caen.
const BCV_URL = "https://ve.dolarapi.com/v1/dolares/oficial";

/**
 * Tasa del día. Primero el BCV en vivo (cacheado una hora, así una ráfaga de
 * cargas del panel no dispara una petición por visita); si la API falla o
 * devuelve basura, el valor de respaldo que fijó el admin en Ajustes.
 *
 * Devuelve null solo si no hay ninguna de las dos, y en ese caso la UI lo dice
 * en vez de inventarse un número: una tasa incorrecta cobra de menos o de más.
 */
export async function getRate(): Promise<Rate | null> {
  try {
    const res = await fetch(BCV_URL, {
      next: { revalidate: 3600, tags: ["rate"] },
    });
    if (res.ok) {
      const json = await res.json();
      const value = Number(json?.promedio);
      if (Number.isFinite(value) && value > 0) {
        return {
          value,
          source: "bcv",
          updatedAt:
            typeof json?.fechaActualizacion === "string"
              ? json.fechaActualizacion
              : null,
        };
      }
    }
  } catch {
    // Red caída o DNS: se cae al respaldo, no se rompe el panel.
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("settings")
      .select("usd_to_bs_fallback, updated_at")
      .eq("id", 1)
      .maybeSingle();
    const row = data as {
      usd_to_bs_fallback: number | string;
      updated_at: string | null;
    } | null;
    const value = Number(row?.usd_to_bs_fallback);
    if (Number.isFinite(value) && value > 0) {
      return { value, source: "manual", updatedAt: row?.updated_at ?? null };
    }
  } catch {
    // Sin sesión o sin tabla: se devuelve null y la UI lo advierte.
  }

  return null;
}
