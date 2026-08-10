"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react";
import { buttonVariants } from "@/app/components/ui/button";
import { ACCEPTED, MAX_BYTES } from "@/app/lib/images";

const ACCEPT = ACCEPTED.join(",");

/* Una foto de teléfono son 3-8 MB y 4000 px de ancho. El catálogo la muestra a
 * 400 px, así que subirla entera es pagar por píxeles que nadie va a ver —y,
 * sobre todo, es lo que reventaba el límite del cuerpo de la Server Action:
 * la foto viaja dentro del envío del formulario, y una compra con tres
 * productos nuevos manda tres de golpe.
 *
 * Reducirla aquí, antes de enviarla, es lo único que arregla eso de verdad:
 * subir el límite del servidor no sirve cuando el proxy de la plataforma corta
 * la petición antes de que Next la vea. */
const MAX_SIDE = 1600;
const QUALITY = 0.82;
/** Por debajo de esto ya está bien: recomprimir solo empeoraría la imagen. */
const SKIP_UNDER = 600 * 1024;
/** Tope del original. Alto a propósito: lo que se sube es el resultado. */
const MAX_ORIGINAL = 20 * 1024 * 1024;

/**
 * Devuelve la versión reducida, o la original si el navegador no puede con
 * ella. Nunca lanza: quedarse sin foto por un fallo al optimizar sería peor
 * que subirla tal cual.
 */
async function shrink(file: File): Promise<File> {
  if (file.size <= SKIP_UNDER) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY),
    );
    // Si el navegador no sabe hacer WebP devuelve PNG, que puede pesar más que
    // el JPG de partida. Se queda el más pequeño de los dos.
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
      type: "image/webp",
    });
  } catch {
    return file;
  }
}

export default function ImagePicker({
  current,
  name = "image",
  label = "Foto del producto",
}: {
  /** Foto ya guardada, si la hay. */
  current?: string;
  name?: string;
  /** Nombre accesible del campo. En el formulario de compra hay un selector
   *  por renglón nuevo: si todos se llamaran igual, un lector de pantalla
   *  anunciaría tres "Foto del producto" sin decir de cuál. */
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  // Las object URL se retienen hasta que se revocan: sin esto, cada foto
  // elegida deja un blob vivo en memoria hasta recargar la página.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function accept(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      reset();
      setError("Formato no admitido. Usa JPG, PNG, WebP o AVIF.");
      return;
    }
    if (file.size > MAX_ORIGINAL) {
      reset();
      setError("La imagen pesa demasiado. Comprímela y vuelve a subirla.");
      return;
    }

    setError(null);
    setBusy(true);
    const small = await shrink(file);
    setBusy(false);

    // Si ni reducida baja del tope del servidor, se dice aquí: mucho mejor que
    // enterarse al guardar, con la compra entera ya escrita.
    if (small.size > MAX_BYTES) {
      reset();
      setError("La imagen pesa más de 3 MB y no se pudo reducir. Comprímela y vuelve a subirla.");
      return;
    }

    // Lo que viaja en el envío es la versión reducida, no la que se eligió: el
    // input es el único sitio del que el formulario lee el archivo.
    if (inputRef.current) {
      const transfer = new DataTransfer();
      transfer.items.add(small);
      inputRef.current.files = transfer.files;
    }
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(small);
    });
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    void accept(event.dataTransfer.files?.[0]);
  }

  /** Deja el campo vacío sin tocar el error: unas veces hay que decir por qué. */
  function reset() {
    if (inputRef.current) inputRef.current.value = "";
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }

  function clear() {
    reset();
    setError(null);
  }

  const shown = preview ?? current;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-wrap items-center gap-4 rounded-md border border-dashed p-3 transition-colors sm:p-4 ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border bg-card"
        }`}
      >
        <div className="relative size-16 shrink-0 overflow-hidden rounded-sm border border-border bg-muted">
          {shown ? (
            <Image
              src={shown}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
              // Un blob: local no pasa por el optimizador de Next.
              unoptimized={shown.startsWith("blob:")}
            />
          ) : (
            <span className="flex size-full items-center justify-center text-ash">
              <IconPhoto size={22} stroke={1.5} />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 basis-40">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className={buttonVariants({ variant: "outline" })}
            >
              <IconUpload size={16} stroke={1.75} />
              {shown ? "Cambiar foto" : "Elegir foto"}
            </button>
            {preview ? (
              <button
                type="button"
                onClick={clear}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <IconX size={16} stroke={1.75} />
                Quitar
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
            {busy
              ? "Optimizando la foto…"
              : preview
                ? "Se subirá al guardar, ya optimizada."
                : "Arrastra una imagen aquí o elígela. JPG, PNG, WebP o AVIF; se reduce sola antes de subirla."}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={ACCEPT}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          void accept(e.target.files?.[0])
        }
        className="sr-only"
        aria-label={label}
      />

      {error ? (
        <p role="alert" className="mt-2 rounded-md border border-l-4 border-l-destructive bg-tintsignal px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
