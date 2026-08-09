import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * useSyncExternalStore en vez de useState + useEffect.
 *
 * La versión que trae shadcn llama a setState dentro del efecto, lo que
 * provoca un render en cascada: el primer pintado sale con el valor de
 * arranque y el siguiente lo corrige. Aquí React lee el valor real antes de
 * pintar, así que no hay parpadeo.
 *
 * El tercer argumento es la instantánea del servidor: allí no hay viewport, y
 * suponer escritorio evita que el sidebar se renderice plegado y salte al
 * hidratar.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
