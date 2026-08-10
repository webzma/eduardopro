"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react";
import { buttonVariants } from "@/app/components/ui/button";

const MAX_BYTES = 3 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

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

  // Las object URL se retienen hasta que se revocan: sin esto, cada foto
  // elegida deja un blob vivo en memoria hasta recargar la página.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function accept(file: File | undefined) {
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) {
      setError("Formato no admitido. Usa JPG, PNG, WebP o AVIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("La imagen pesa más de 3 MB. Comprímela y vuelve a subirla.");
      return;
    }
    setError(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file || !inputRef.current) return;
    // Se copia al input para que el archivo viaje en el envío del formulario.
    const transfer = new DataTransfer();
    transfer.items.add(file);
    inputRef.current.files = transfer.files;
    accept(file);
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
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
          <p className="mt-1 text-xs text-muted-foreground">
            {preview
              ? "Se subirá al guardar."
              : "Arrastra una imagen aquí o elígela. JPG, PNG, WebP o AVIF, hasta 3 MB."}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={ACCEPT}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          accept(e.target.files?.[0])
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
