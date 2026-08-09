"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconDotsVertical,
  IconPencil,
  IconEye,
  IconEyeOff,
  IconTrash,
} from "@tabler/icons-react";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { deleteProductAction, toggleActiveAction } from "../../actions";

/**
 * Tres botones por fila ocupaban media tabla y empujaban las columnas de
 * datos. Un menú deja una sola diana de 32px y las acciones a un clic.
 *
 * El diálogo vive fuera del menú a propósito: si estuviera dentro, al cerrarse
 * el menú se desmontaría el diálogo con él.
 */
export default function RowActions({
  id,
  name,
  active,
}: {
  id: string;
  name: string;
  active: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${name}`}>
            <IconDotsVertical size={16} stroke={1.75} aria-hidden />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/admin/inventario/${id}`}>
              <IconPencil size={16} stroke={1.75} aria-hidden />
              Editar
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            {/* Un form dentro del item: así sigue funcionando sin JavaScript
                y la Server Action se encarga igual. */}
            <form action={toggleActiveAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="active" value={(!active).toString()} />
              <button type="submit" className="flex w-full items-center gap-2">
                {active ? (
                  <IconEyeOff size={16} stroke={1.75} aria-hidden />
                ) : (
                  <IconEye size={16} stroke={1.75} aria-hidden />
                )}
                {active ? "Ocultar del sitio" : "Mostrar en el sitio"}
              </button>
            </form>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault();
              setConfirming(true);
            }}
          >
            <IconTrash size={16} stroke={1.75} aria-hidden />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar «{name}»?</DialogTitle>
            <DialogDescription>
              Desaparece del catálogo y del sitio público. El historial de
              ventas y compras no se toca: cada renglón guarda copiado el
              nombre y el precio de su momento, así que las cifras siguen
              cuadrando.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <form action={deleteProductAction}>
              <input type="hidden" name="id" value={id} />
              <Button type="submit" variant="destructive">
                <IconTrash size={16} stroke={1.75} aria-hidden />
                Sí, eliminar
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
