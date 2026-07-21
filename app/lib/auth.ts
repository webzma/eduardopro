import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "ep_admin";
const SECRET = process.env.ADMIN_SECRET ?? "dev-insecure-secret-change-me";

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "eduardo2020";

function sessionToken(): string {
  return createHmac("sha256", SECRET).update("admin-session-v1").digest("hex");
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return false;
  const expected = sessionToken();
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAuthed())) redirect("/admin/login");
}

export async function signIn(password: string): Promise<boolean> {
  if (password !== ADMIN_PASSWORD) return false;
  const store = await cookies();
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return true;
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
