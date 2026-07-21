"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, signIn, signOut } from "../lib/auth";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getProduct,
  type ProductInput,
} from "../lib/products";

function readForm(formData: FormData): ProductInput {
  return {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    price: Math.max(0, Number(formData.get("price") ?? 0)),
    stock: Math.max(0, Math.trunc(Number(formData.get("stock") ?? 0))),
    image: String(formData.get("image") ?? "").trim(),
    active: formData.get("active") === "on",
  };
}

function refresh(): void {
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function loginAction(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");
  const ok = await signIn(password);
  if (!ok) redirect("/admin/login?error=1");
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await signOut();
  redirect("/admin/login");
}

export async function createProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const input = readForm(formData);
  if (!input.name) redirect("/admin?error=nombre");
  if (!input.image) input.image = "/products/placeholder.svg";
  await createProduct(input);
  refresh();
  redirect("/admin?ok=creado");
}

export async function updateProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const existing = await getProduct(id);
  if (!existing) redirect("/admin?error=noexiste");
  const input = readForm(formData);
  if (!input.name) redirect(`/admin/${id}?error=nombre`);
  if (!input.image) input.image = existing!.image;
  await updateProduct(id, input);
  refresh();
  redirect("/admin?ok=actualizado");
}

export async function adjustStockAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const delta = Math.trunc(Number(formData.get("delta") ?? 0));
  await adjustStock(id, delta);
  refresh();
}

export async function toggleActiveAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  await updateProduct(id, { active });
  refresh();
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await deleteProduct(id);
  refresh();
  redirect("/admin?ok=eliminado");
}
