export const TEAM_WHATSAPP_NUMBER = "201554586850";
export const TEAM_WHATSAPP_URL = `https://wa.me/${TEAM_WHATSAPP_NUMBER}`;

export function buildTeamWhatsAppUrl(message?: string) {
  return message ? `${TEAM_WHATSAPP_URL}?text=${encodeURIComponent(message)}` : TEAM_WHATSAPP_URL;
}

export function replaceLegacyWhatsAppUrl(href: string) {
  return href.replace(/wa\.me\/201146303129/g, `wa.me/${TEAM_WHATSAPP_NUMBER}`);
}
