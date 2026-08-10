"use client"

import * as React from "react"

import { cn } from "@/app/lib/utils"

/* `containerProps` va al div que envuelve la tabla, que es el que tiene el
 * scroll. Existe porque para que una tabla se desplace por dentro —con la
 * cabecera pegada arriba— el alto máximo tiene que estar en ESE div, no en un
 * padre: `position: sticky` se calcula contra el antepasado que se desplaza.
 * Y por lo mismo van ahí el `tabIndex` y el nombre accesible: quien navega con
 * teclado tiene que poder recorrer la zona que se mueve. */
function Table({
  className,
  containerProps,
  ...props
}: React.ComponentProps<"table"> & {
  containerProps?: React.ComponentProps<"div">
}) {
  const { className: containerClassName, ...container } = containerProps ?? {}
  return (
    <div
      data-slot="table-container"
      className={cn("relative w-full overflow-x-auto", containerClassName)}
      {...container}
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

/* La cabecera es una BANDA, no una fila más en crema. Un encabezado que se
 * distingue solo por ir en negrita desaparece en cuanto la tabla pasa de la
 * primera pantalla; con color de fondo sigue siendo el techo de la tabla
 * aunque llegues a ella desplazándote. */
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "bg-band [&_tr]:border-b-2 [&_tr]:border-border [&_tr]:hover:bg-band",
        className
      )}
      {...props}
    />
  )
}

/* Filas alternas: seguir una fila de seis columnas hasta el importe de la
 * derecha sin perder el renglón es justo lo que el color de fondo resuelve. */
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "[&_tr:last-child]:border-0 [&>tr:nth-child(even)]:bg-zebra",
        className
      )}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        // El total lleva el rojo de la marca: es la cifra que se busca.
        "border-t-2 border-border bg-tintsignal font-semibold [&>tr]:last:border-b-0 [&>tr]:hover:bg-tintsignal",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        // El hover pinta la fila entera y le abre un filo rojo a la izquierda:
        // señala DÓNDE estás, no solo que algo se puede pulsar.
        "border-b transition-colors hover:bg-tintamber hover:shadow-[inset_3px_0_0_var(--signal)] has-aria-expanded:bg-tintamber data-[state=selected]:bg-tintamber",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        // Versalitas espaciadas: el mismo tratamiento que las etiquetas de
        // <Field>, para que cabecera y ficha se lean como el mismo idioma.
        "h-10 px-2 text-left align-middle text-[0.6875rem] font-semibold tracking-[0.07em] whitespace-nowrap text-coal2 uppercase [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
