"use client";

import { deleteProductAction } from "./actions";

export default function DeleteButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <form
      action={deleteProductAction}
      onSubmit={(event) => {
        if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="font-mono text-[11px] tracking-[0.16em] text-ink transition-colors hover:text-[#e08a8a]"
      >
        ELIMINAR
      </button>
    </form>
  );
}
