"use client";

import { useState } from "react";
import { IconDice5, IconCopy, IconEye, IconEyeOff } from "@tabler/icons-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

/* Sin las parejas que se confunden al dictarla en voz alta —l/1/I, O/0— que es
 * justo como va a viajar esta contraseña: el dueño se la lee al vendedor. */
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LENGTH = 14;

function generate(): string {
  const values = crypto.getRandomValues(new Uint32Array(LENGTH));
  return Array.from(values, (n) => ALPHABET[n % ALPHABET.length]).join("");
}

/**
 * El campo de contraseña de la cuenta nueva.
 *
 * Se ve en claro a propósito: no es la contraseña de quien escribe, es una que
 * hay que leerle a otra persona, y ocultarla solo lleva a escribirla mal dos
 * veces. El botón de generar es un extra — sin JavaScript el campo sigue
 * siendo un input normal en el que se puede teclear.
 */
export default function PasswordField() {
  const [value, setValue] = useState("");
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles no pasa nada: está escrita ahí al lado.
    }
  }

  return (
    <div>
      <Label htmlFor="password" className="mb-1 block">
        Contraseña para esa persona
      </Label>
      <div className="flex flex-wrap gap-2">
        <Input
          id="password"
          name="password"
          type={hidden ? "password" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          className="min-w-40 flex-1 font-mono"
        />
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => setValue(generate())}
          >
            <IconDice5 size={16} stroke={1.75} aria-hidden />
            Generar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={copy}
            disabled={!value}
            aria-label="Copiar la contraseña"
          >
            <IconCopy size={16} stroke={1.75} aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setHidden((on) => !on)}
            aria-label={hidden ? "Ver la contraseña" : "Ocultar la contraseña"}
          >
            {hidden ? (
              <IconEye size={16} stroke={1.75} aria-hidden />
            ) : (
              <IconEyeOff size={16} stroke={1.75} aria-hidden />
            )}
          </Button>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
        {copied
          ? "Copiada al portapapeles."
          : "Apúntala antes de guardar: no se vuelve a mostrar. Esa persona puede cambiarla luego."}
      </p>
    </div>
  );
}
