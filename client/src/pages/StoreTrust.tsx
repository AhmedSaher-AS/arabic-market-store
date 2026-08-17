import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { BookLock, FileCheck2, ShieldCheck, Truck, WalletCards } from "lucide-react";
import { Link } from "wouter";

const pillars = [
  { icon: WalletCards, title: "سعر واضح قبل التسجيل", text: "يعرض طلب المنتج المحلي ملخص المنتجات والخصم والشحن والإجمالي قبل تسجيل الطلب. السعر النهائي يُحسب من بيانات الخادم، وليس من مدخلات الواجهة." },
  { icon: FileCheck2, title: "مراجعة إثبات السداد", text: "ترتبط صورة إثبات الدفع بالطلب لتظهر للمدير في قائمة المراجعة. يبقى العميل قادرًا على متابعة حالة الإثبات والطلب من حسابه." },
  { icon: Truck, title: "شحن قابل للمتابعة", text: "تظهر تكلفة منطقة الشحن عند إعدادها، وتُتابع مراحل الطلب بوضوح: معلق، مؤكد، مشحون، ومكتمل." },
  { icon: BookLock, title: "وصول محمي للكتب الرقمية", text: "تُمنح القراءة والتنزيل للكتاب الرقمي بعد اعتماد السداد، مع حفظ موضع القراءة داخل مكتبة العميل." },
];

export default function StoreTrust() {
  return <StoreLayout><section className="border-b border-stone-200 bg-[linear-gradient(135deg,#e3eee8,#fffdf8)]"><div className="container py-12"><p className="text-xs font-extrabold tracking-[0.18em] text-[#2d7a51]">شراء بوضوح</p><h1 className="mt-2 text-4xl font-black text-[#173c37]">ضمان وثقة المتجر</h1><p className="mt-3 max-w-3xl leading-8 text-stone-600">توضح هذه الصفحة كيف يظهر السعر، وكيف تُراجع المدفوعات، وكيف يتابع العميل طلبه ويحصل على محتواه الرقمي المصرح له.</p></div></section><main className="container py-10"><div className="grid gap-5 md:grid-cols-2">{pillars.map(item => { const Icon = item.icon; return <article key={item.title} className="rounded-3xl border border-stone-200 bg-white p-6"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e3eee8] text-[#173c37]"><Icon className="h-6 w-6" /></span><h2 className="mt-5 text-xl font-black text-[#173c37]">{item.title}</h2><p className="mt-3 leading-8 text-stone-600">{item.text}</p></article>; })}</div><section className="mt-7 rounded-3xl bg-[#173c37] p-7 text-white"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-[#f5c96a]"><ShieldCheck className="h-5 w-5" /><span className="text-sm font-bold">قبل الدفع</span></div><h2 className="mt-2 text-2xl font-black">راجع ملخص الطلب وبيانات الدفع</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-stone-300">يمكنك الرجوع إلى طلباتك لرفع إثبات السداد ومتابعة كل تحديث، أو التواصل عبر واتساب مع تضمين مرجع الطلب.</p></div><div className="flex flex-wrap gap-3"><Button asChild className="rounded-xl bg-[#f5c96a] text-[#173c37] hover:bg-[#edbd53]"><Link href="/طلباتي">فتح طلباتي</Link></Button><Button asChild variant="outline" className="rounded-xl border-white/30 text-white hover:bg-white/10 hover:text-white"><Link href="/سياسة-الشحن">سياسة الشحن</Link></Button></div></div></section></main></StoreLayout>;
}
