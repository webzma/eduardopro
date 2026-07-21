export const WHATSAPP_NUMBER = "584120000000";

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export function whatsappOrderUrl(message: string) {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}
