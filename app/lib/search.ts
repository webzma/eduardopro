/**
 * Deja el texto de una barra de búsqueda en letras, números y espacios.
 *
 * No es cosmético y no es opcional: `%` y `_` son comodines de `ilike` —un
 * `%` suelto convierte la búsqueda en "todo"— y las comas y los paréntesis
 * rompen el analizador de filtros de PostgREST, que los usa como sintaxis. Lo
 * que escribe alguien en un campo de texto no puede entrar tal cual en un
 * filtro de la base.
 *
 * El corte a 60 caracteres es por lo mismo: el filtro viaja en la URL de la
 * petición y no tiene sentido dejar que crezca sin límite.
 */
export function cleanSearch(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}
