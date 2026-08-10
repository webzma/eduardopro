"use client";

import { useState } from "react";
import { IconUserOff } from "@tabler/icons-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { revokeStaffAction } from "../../actions";

/**
 * Retirar el acceso a alguien. Dos frenos, y ninguno es de adorno: el diálogo
 * evita el clic de más en una fila de una lista, y la contraseña evita que
 * alguien que se sentó en tu silla eche al equipo.
 */
export default function RevokeStaff({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive"
        onClick={() => setOpen(true)}
      >
        <IconUserOff size={16} stroke={1.75} aria-hidden />
        Retirar acceso
        <span className="sr-only"> a {email}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form action={revokeStaffAction}>
            <DialogHeader>
              <DialogTitle>¿Retirar el acceso de {email}?</DialogTitle>
              <DialogDescription>
                Deja de entrar al panel al instante. Su cuenta de correo sigue
                existiendo y sus ventas se quedan donde están, con su nombre:
                el histórico no se toca. Para devolverle el acceso basta con
                darle el rol otra vez.
              </DialogDescription>
            </DialogHeader>

            <input type="hidden" name="userId" value={userId} />

            <div className="my-4">
              <Label htmlFor={`baja-${userId}`} className="mb-1 block">
                Tu contraseña
              </Label>
              <Input
                id={`baja-${userId}`}
                name="confirmacion"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" variant="destructive">
                <IconUserOff size={16} stroke={1.75} aria-hidden />
                Sí, retirar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
