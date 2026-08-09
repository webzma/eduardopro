import { supabaseConfig } from "./supabase/config";

/* Solo helpers PUROS: este módulo lo importan Client Components (el selector de
 * fotos, el formulario de venta), así que no puede tocar nada de servidor. Las
 * subidas y los borrados viven en ./storage.ts, que sí es server-only. */

export const BUCKET = "productos";
export const MAX_BYTES = 3 * 1024 * 1024;
export const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const PLACEHOLDER = "/products/placeholder.svg";

/**
 * `products.image` guarda la RUTA dentro del bucket (p. ej. `maquina-abc.webp`)
 * para las fotos subidas, pero los cuatro productos originales traen rutas
 * locales tipo `/products/x.png`. Esta función resuelve las dos, así que la
 * migración no obliga a resubir nada.
 */
export function imageSrc(image: string): string {
  if (!image) return PLACEHOLDER;
  // Absoluta (http) o local (/): ya es utilizable tal cual.
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return image;

  try {
    const { url } = supabaseConfig();
    return `${url}/storage/v1/object/public/${BUCKET}/${image}`;
  } catch {
    return PLACEHOLDER;
  }
}

/** true si la imagen vive en el bucket (y por tanto se puede borrar). */
export function isStored(image: string): boolean {
  return Boolean(image) && !image.startsWith("/") && !image.startsWith("http");
}

export function extensionFor(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/avif") return "avif";
  return "jpg";
}
