import "server-only";

import { createClient } from "./supabase/server";
import { ACCEPTED, BUCKET, MAX_BYTES, extensionFor, isStored } from "./images";

/* `import "server-only"` no es decorativo: si algún día un Client Component
 * importa esto por error, el build falla con un mensaje claro en vez de
 * arrastrar next/headers al navegador — que es justo el fallo que provocó
 * separar este módulo de ./images.ts. */

/**
 * Sube la foto y devuelve su ruta dentro del bucket. El nombre lleva un sufijo
 * aleatorio a propósito: si se reusara el nombre original, reemplazar una foto
 * dejaría la vieja cacheada en los CDN y el catálogo mostraría la anterior
 * durante horas.
 */
export async function uploadProductImage(
  file: File,
  slug: string,
): Promise<string> {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error("Formato no admitido. Usa JPG, PNG, WebP o AVIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error(
      "La imagen pesa más de 3 MB. Comprímela y vuelve a subirla.",
    );
  }

  const path = `${slug || "producto"}-${crypto.randomUUID().slice(0, 8)}.${extensionFor(file.type)}`;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    // El nombre es único por diseño, así que la foto es inmutable y puede
    // cachearse un año.
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
  return path;
}

/** Borra la foto anterior. Nunca debe tumbar la operación que la provocó. */
export async function removeProductImage(image: string): Promise<void> {
  if (!isStored(image)) return;
  try {
    const supabase = await createClient();
    await supabase.storage.from(BUCKET).remove([image]);
  } catch (err) {
    // Que quede huérfana es mucho menos grave que perder el guardado.
    console.warn(
      "[storage] no se pudo borrar la anterior:",
      (err as Error).message,
    );
  }
}
