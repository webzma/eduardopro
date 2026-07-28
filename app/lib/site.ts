export const WHATSAPP_NUMBER = "584120000000";

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
