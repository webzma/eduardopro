import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Une clases y resuelve conflictos de Tailwind quedándose con la última.
 * Sin twMerge, `cn("p-2", "p-4")` deja las dos y gana la que el CSS ponga
 * después — no la que escribiste al final, que es lo que uno espera.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
