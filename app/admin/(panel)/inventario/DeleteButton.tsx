"use client";

import { IconTrash } from "@tabler/icons-react";
import { deleteProductAction } from "../../actions";

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
        // Borrar no se puede deshacer y el historial de ventas conserva el
        // nombre, así que confirmar aquí basta; no hace falta papelera.
        if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label={`Eliminar ${name}`}
        className="crm-btn crm-btn--quiet crm-btn--danger"
      >
        <IconTrash size={16} stroke={1.75} />
        Eliminar
      </button>
    </form>
  );
}
