/* El WhatsApp de la tienda: +58 412 150 63 83.
 *
 * Aquí va en el formato que exige wa.me — solo dígitos, con el código de país
 * (58) y SIN el +, ni espacios, ni guiones, ni el 0 inicial del número
 * nacional. Con cualquiera de esas cosas, el enlace abre WhatsApp con un
 * "número inválido" y el pedido se pierde sin que nadie se entere.
 *
 * De esta constante salen TODOS los botones de WhatsApp del sitio: el de la
 * portada, el del menú, el del pie, el de ubicación, el del formulario de
 * contacto y el "Pedir" de cada producto y de cada ficha. Cambiar de número es
 * cambiar esta línea. */
export const WHATSAPP_NUMBER = "584121506383";

/** Bonito, para enseñárselo a alguien. Nunca para construir un enlace. */
export const WHATSAPP_DISPLAY = "+58 412 150 63 83";

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export function whatsappOrderUrl(message: string) {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}

/* ── Dónde está el negocio ──────────────────────────────────────────────
   OJO: `lat`/`lon` apuntan al CENTRO DEL PUEBLO de Aroa, no a la puerta de
   la tienda — no me diste la dirección exacta. Cuando la tengas, saca las
   coordenadas del punto real (en openstreetmap.org o Google Maps, clic
   derecho sobre el sitio → copiar coordenadas) y cámbialas aquí: el mapa,
   el marcador y el enlace de "cómo llegar" se actualizan solos.
   Si añades calle y referencia, ponlas en `address`.
   ──────────────────────────────────────────────────────────────────────── */
export const LOCATION = {
  town: "Aroa",
  region: "Yaracuy",
  country: "Venezuela",
  /** Calle / punto de referencia. Vacío = la UI omite la línea. */
  address: "",
  lat: 10.4375,
  lon: -68.8993,
} as const;

export const LOCATION_LABEL = `${LOCATION.town}, ${LOCATION.region}`;

/** Recuadro del mapa: ~±0.012° alrededor del punto, encuadra el pueblo. */
const SPAN = 0.012;

/** OpenStreetMap embebido — sin API key y sin rastreo de terceros. */
export const MAP_EMBED_URL =
  "https://www.openstreetmap.org/export/embed.html?" +
  new URLSearchParams({
    bbox: [
      LOCATION.lon - SPAN,
      LOCATION.lat - SPAN,
      LOCATION.lon + SPAN,
      LOCATION.lat + SPAN,
    ].join(","),
    layer: "mapnik",
    marker: `${LOCATION.lat},${LOCATION.lon}`,
  }).toString();

/** Abre el punto en la app de mapas del visitante. */
export const MAP_LINK_URL = `https://www.openstreetmap.org/?mlat=${LOCATION.lat}&mlon=${LOCATION.lon}#map=15/${LOCATION.lat}/${LOCATION.lon}`;
