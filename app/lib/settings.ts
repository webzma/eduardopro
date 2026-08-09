import { createClient } from "./supabase/server";
import { fail } from "./supabase/config";

export type Settings = {
  fallbackRate: number;
  updatedAt: string | null;
};

export async function getSettings(): Promise<Settings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("usd_to_bs_fallback, updated_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) fail(error);
  const row = data as {
    usd_to_bs_fallback: number | string;
    updated_at: string | null;
  } | null;
  return {
    fallbackRate: Number(row?.usd_to_bs_fallback ?? 0),
    updatedAt: row?.updated_at ?? null,
  };
}

/** Solo el admin: la política RLS de settings rechaza al resto. */
export async function setFallbackRate(rate: number): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("settings")
    .update({
      usd_to_bs_fallback: rate,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("id", 1);
  if (error) fail(error);
}
