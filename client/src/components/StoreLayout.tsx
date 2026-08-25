import { CartDrawer } from "@/components/CartDrawer";
import { StoreHeader } from "@/components/StoreHeader";
import { WhatsAppSupport } from "@/components/WhatsAppSupport";
import { buildTeamWhatsAppUrl } from "@/lib/whatsappSupport";
import { ReactNode } from "react";
import { Link } from "wouter";

export function StoreLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen overflow-x-clip bg-[#fffdf8] text-stone-900" dir="rtl">
    <StoreHeader />
    <CartDrawer />
    <main>{children}</main>
    <WhatsAppSupport />
    <footer className="border-t border-stone-200 bg-[#173c37] text-stone-200">
      <div className="container grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5c96a] font-black text-[#173c37]">س</span><strong className="text-lg text-white">سوقك العربي</strong></div><p className="mt-4 max-w-sm text-sm leading-7 text-stone-300">مكتبة رقمية عربية لاكتشاف الكتب وقراءتها من حسابك، مع تجربة شراء واضحة ووصول محمي بعد اعتماد السداد.</p></div>
        <div><h3 className="font-bold text-white">المكتبة الرقمية</h3><div className="mt-4 grid gap-3 text-sm text-stone-300"><Link href="/كتب-رقمية">اكتشف الكتب الرقمية</Link><Link href="/مكتبتي">مكتبتي وقراءاتي</Link><Link href="/المفضلة">كتبي المفضلة</Link><Link href="/من-نحن">عن المكتبة</Link><Link href="/متجر-مستقل">المتجر المتنوع</Link></div></div>
        <div><h3 className="font-bold text-white">الدفع والطلبات</h3><p className="mt-4 text-sm leading-7 text-stone-300">تتوفر فودافون كاش، إنستا باي، فيزا/ماستركارد، وPayPal بعد تفعيل الوسائل من حساب التاجر.</p><div className="mt-3 grid gap-2 text-sm font-bold text-[#f5c96a]"><a href={buildTeamWhatsAppUrl("مرحبًا، أود مراسلة فريق متجر سوقك العربي.")} target="_blank" rel="noreferrer" className="hover:text-white">راسل فريق المتجر عبر واتساب</a><Link href="/المساعدة" className="hover:text-white">مركز المساعدة والأسئلة الشائعة</Link><Link href="/ضمان-المتجر" className="hover:text-white">ضمان وثقة المتجر</Link><Link href="/سياسة-المنتجات-الرقمية" className="hover:text-white">سياسة المنتجات الرقمية</Link><Link href="/شروط-الاستخدام" className="hover:text-white">شروط الاستخدام</Link><Link href="/الخصوصية" className="hover:text-white">الخصوصية</Link></div></div>
      </div>
      <div className="border-t border-white/10"><div className="container flex flex-col gap-2 py-4 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} سوقك العربي</span><Link href="/المدير" className="hover:text-white">بوابة المدير</Link></div></div>
    </footer>
  </div>;
}
