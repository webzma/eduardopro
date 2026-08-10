import "server-only";

import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import { fail } from "./supabase/config";
import type { Role } from "./auth";

export type StaffMember = {
  userId: string;
  email: string | null;
  role: Role;
  createdAt: string;
  /** Quién lo dio de alta. null en los que se dieron de alta a mano por SQL. */
  createdBy: string | null;
};

type Row = {
  user_id: string;
  email: string | null;
  role: string;
  created_at: string;
  created_by: string | null;
};

/**
 * La plantilla. RLS decide qué se ve: el admin recibe a todos y cualquier otro
 * solo su propia ficha, así que esto no filtra por rol — no haría falta y no
 * sería fiable.
 */
export async function getStaff(): Promise<StaffMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .select("user_id, email, role, created_at, created_by")
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) fail(error);
  return (data ?? [])
    .map((row) => row as Row)
    .filter((row) => row.role === "admin" || row.role === "vendedor")
    .map((row) => ({
      userId: row.user_id,
      email: row.email,
      role: row.role as Role,
      createdAt: row.created_at,
      createdBy: row.created_by,
    }));
}

/**
 * Crea la cuenta en auth.users y devuelve su id. Es lo ÚNICO que necesita la
 * clave secreta.
 *
 * `email_confirm: true` porque quien crea la cuenta es el dueño del negocio,
 * en persona y con la contraseña en la mano: obligar a confirmar por correo
 * solo conseguiría que el vendedor no pudiera entrar hasta encontrar un email
 * que a lo mejor ni recibe.
 */
export async function createAuthUser(
  email: string,
  password: string,
): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    // Supabase responde en inglés; los dos casos que de verdad pasan se
    // traducen y el resto se pasa tal cual antes que inventarse un motivo.
    const message = error.message.toLowerCase();
    if (message.includes("already") || message.includes("registered")) {
      throw new Error(
        "Ya hay una cuenta con ese correo. Si es quien crees, dale el rol desde la lista de abajo en vez de crearla otra vez.",
      );
    }
    if (message.includes("password")) {
      throw new Error("Supabase rechazó la contraseña: es demasiado débil.");
    }
    throw new Error(`No se pudo crear la cuenta: ${error.message}`);
  }
  const id = data.user?.id;
  if (!id) throw new Error("Supabase creó la cuenta pero no devolvió su id.");
  return id;
}

/**
 * Reparte el rol. Va por la función de la base, NO por la clave secreta: la
 * tabla staff no tiene políticas de escritura y grant_staff comprueba
 * is_admin() antes de tocar nada. La autoridad sigue siendo RLS.
 */
export async function grantStaff(
  userId: string,
  role: Role,
  email?: string | null,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("grant_staff", {
    p_user_id: userId,
    p_role: role,
    p_email: email ?? null,
  });
  if (error) fail(error);
}

/** Da de baja: borra la fila y el acceso se corta al instante, porque todas
 *  las políticas cuelgan de ella. La cuenta de correo sigue existiendo. */
export async function revokeStaff(userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_staff", { p_user_id: userId });
  if (error) fail(error);
}
