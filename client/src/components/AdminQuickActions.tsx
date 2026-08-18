import { Archive, BookOpen, ClipboardList, FilePenLine, PackagePlus, WalletCards } from "lucide-react";

const actions = [
  { href: "#local-products", label: "إضافة منتج", hint: "إضافة محلية مباشرة", icon: PackagePlus, tone: "bg-[#eaf3ee] text-[#2d7a51]" },
  { href: "#local-products", label: "كل المنتجات", hint: "كتب وملابس وأجهزة", icon: Archive, tone: "bg-[#f7ead6] text-[#9a5821]" },
  { href: "#store-content", label: "محتوى الواجهة", hint: "العناوين والوصف", icon: FilePenLine, tone: "bg-[#e3eee8] text-[#173c37]" },
  { href: "#payment-operations", label: "إعدادات الدفع", hint: "واتساب وفودافون وفوري", icon: WalletCards, tone: "bg-[#f7ead6] text-[#9a5821]" },
  { href: "#digital-books", label: "الكتب الرقمية", hint: "رفع أو استبدال أو حذف", icon: BookOpen, tone: "bg-[#ebe8f5] text-[#50427b]" },
  { href: "#incoming-orders", label: "الطلبات", hint: "متابعة وتنفيذ", icon: ClipboardList, tone: "bg-[#eaf3ee] text-[#2d7a51]" },
];

export function AdminQuickActions() {
  return <nav className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="إجراءات الإدارة السريعة">{actions.map(action => { const Icon = action.icon; return <a key={`${action.href}-${action.label}`} href={action.href} className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#d5a75c] hover:shadow-md"><span className={`grid h-10 w-10 place-items-center rounded-xl ${action.tone}`}><Icon className="h-5 w-5" /></span><span><strong className="block text-sm text-[#173c37]">{action.label}</strong><span className="mt-0.5 block text-xs text-stone-500">{action.hint}</span></span></a>})}</nav>;
}
