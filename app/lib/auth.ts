import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient as createStatelessClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";
import { fail, supabaseConfig } from "./supabase/config";

/** admin manda; vendedor solo mueve existencias. */
export type Role = "admin" | "vendedor";

export type Staff = { user: User; role: Role };

/** La sesión de Supabase, o null. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  // getUser() valida el token contra Supabase. getSession() se limita a leer
  // la cookie, que el cliente puede falsificar — no sirve para autorizar.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * El rol de quien mira, o null si no es del equipo. Estar logueado no basta:
 * hay que figurar en public.staff. Es la misma condición que aplican las
 * políticas RLS, así que la UI y la base no pueden discrepar — si alguien se
 * salta esta comprobación, la base lo rechaza igual.
 */
export async function getRole(user: User | null): Promise<Role | null> {
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) fail(error);
  const role = (data as { role: string } | null)?.role;
  return role === "admin" || role === "vendedor" ? role : null;
}

/** Deja pasar a cualquiera del equipo. Corta el render si no lo es. */
export async function requireStaff(): Promise<Staff> {
  const user = await getUser();
  if (!user) redirect("/admin/login");
  const role = await getRole(user);
  if (!role) redirect("/admin/login?error=noacceso");
  return { user, role };
}

/**
 * Solo admin. Un vendedor que llegue aquí vuelve al panel — no es un error
 * suyo, simplemente esa pantalla no le corresponde.
 */
export async function requireAdmin(): Promise<Staff> {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/admin?error=soloadmin");
  return staff;
}

export async function signIn(
  email: string,
  password: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) return null;
  // El mensaje de Supabase viene en inglés y distingue si el correo existe;
  // se colapsa en uno solo para no filtrar qué cuentas hay.
  return "Correo o contraseña incorrectos.";
}

/**
 * Confirma que quien está sentado delante sabe la contraseña de la cuenta con
 * la que actúa. Se pide antes de repartir permisos: la sesión abierta dice
 * QUIÉN eres, esto dice que sigues siendo tú y no alguien que se sentó en tu
 * silla con el panel puesto.
 *
 * Va por un cliente aparte, sin cookies y sin persistir sesión, para no tocar
 * la del panel: si se usara el cliente normal, comprobar la contraseña
 * rotaría los tokens de la sesión en curso. La sesión que abre aquí se cierra
 * en el momento, para no dejar un refresh token suelto por ahí.
 */
export async function verifyPassword(
  email: string,
  password: string,
): Promise<boolean> {
  if (!email || !password) return false;
  const { url, key } = supabaseConfig();
  const check = createStatelessClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await check.auth.signInWithPassword({ email, password });
  if (error) return false;
  await check.auth.signOut();
  return true;
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
