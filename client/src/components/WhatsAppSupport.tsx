import { MessageCircleMore } from "lucide-react";

const supportUrl = "https://wa.me/201146303129?text=%D9%85%D8%B1%D8%AD%D8%A8%D9%8B%D8%A7%D8%8C%20%D8%A3%D8%AD%D8%AA%D8%A7%D8%AC%20%D9%85%D8%B3%D8%A7%D8%B9%D8%AF%D8%A9%20%D9%81%D9%8A%20%D8%B3%D9%88%D9%82%D9%83%20%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A.";

export function WhatsAppSupport() {
  return <a href={supportUrl} target="_blank" rel="noreferrer" className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-black text-[#072d1b] shadow-[0_12px_30px_rgba(37,211,102,.35)] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#25D366]/35" aria-label="التواصل مع الدعم عبر واتساب على الرقم 01146303129"><MessageCircleMore className="h-5 w-5" /><span>تواجه مشكلة؟ كلم الدعم</span></a>;
}
