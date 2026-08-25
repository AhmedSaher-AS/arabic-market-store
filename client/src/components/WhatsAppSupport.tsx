import { MessageCircleMore } from "lucide-react";
import { buildTeamWhatsAppUrl } from "@/lib/whatsappSupport";

const supportUrl = buildTeamWhatsAppUrl("مرحبًا، أود مراسلة فريق متجر سوقك العربي.");

export function WhatsAppSupport() {
  return <a href={supportUrl} target="_blank" rel="noreferrer" className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-black text-[#072d1b] shadow-[0_12px_30px_rgba(37,211,102,.35)] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#25D366]/35" aria-label="مراسلة فريق متجر سوقك العربي عبر واتساب"><MessageCircleMore className="h-5 w-5" /><span>راسل فريق المتجر</span></a>;
}
