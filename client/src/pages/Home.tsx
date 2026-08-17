import { ProductCard } from "@/components/ProductCard";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookOpenText, Cpu, LoaderCircle, Shirt, ShieldCheck, Truck } from "lucide-react";
import { Link } from "wouter";

const categories = [
  { label: "كتب", subtitle: "أفكار تفتح آفاقًا جديدة", icon: BookOpenText, tone: "bg-[#dfece5] text-[#173c37]", href: "/المنتجات?category=كتب" },
  { label: "ملابس", subtitle: "اختيارات يومية بأناقة هادئة", icon: Shirt, tone: "bg-[#f7ead6] text-[#9a5821]", href: "/المنتجات?category=ملابس" },
  { label: "أجهزة", subtitle: "تقنية عملية للحياة الحديثة", icon: Cpu, tone: "bg-[#e8e4f5] text-[#50427b]", href: "/المنتجات?category=أجهزة" },
];

export default function Home() {
  const { data: products = [], isLoading } = trpc.commerce.products.list.useQuery({ first: 8 });
  return (
    <StoreLayout>
      <section className="relative isolate overflow-hidden border-b border-stone-200 bg-[#f5f1e8]">
        <div className="absolute inset-y-0 left-0 hidden w-[46%] bg-[#173c37] lg:block" />
        <div className="container relative grid items-center gap-10 py-12 lg:grid-cols-[1.08fr_0.92fr] lg:py-20">
          <div className="order-2 lg:order-1">
            <p className="mb-5 flex items-center gap-2 text-xs font-extrabold tracking-[0.18em] text-[#b76f2c]"><span className="h-px w-7 bg-[#b76f2c]" />اختيارات منتقاة لك</p>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.25] tracking-tight text-[#173c37] sm:text-5xl lg:text-6xl">كل ما تحتاجه،<br /><span className="text-[#b76f2c]">في مكان عربي واحد.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-stone-600">استكشف كتبًا ملهمة وملابس مختارة وأجهزة عملية عبر تجربة تسوق مصممة بوضوح وسهولة.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button asChild className="h-12 rounded-xl bg-[#173c37] px-6 font-extrabold hover:bg-[#0f2b27]"><Link href="/المنتجات">ابدأ التسوق <ArrowLeft className="mr-2 h-4 w-4" /></Link></Button><Button asChild variant="outline" className="h-12 rounded-xl border-stone-300 bg-white/60 px-6 text-[#173c37] hover:bg-white"><Link href="/المنتجات?category=كتب">تصفح الكتب</Link></Button></div>
          </div>
          <div className="relative order-1 min-h-[320px] lg:order-2 lg:min-h-[430px]"><div className="absolute inset-0 -rotate-3 rounded-[40px] bg-[#f5c96a]" /><div className="absolute inset-0 rotate-2 overflow-hidden rounded-[40px] bg-[#173c37] p-7 text-white shadow-2xl"><div className="flex h-full flex-col justify-between"><div className="flex items-center justify-between"><span className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold">اختيار الأسبوع</span><span className="text-3xl font-black text-[#f5c96a]">س</span></div><div><p className="max-w-sm text-3xl font-extrabold leading-tight sm:text-4xl">تسوّق براحة،<br />واختر بثقة.</p><div className="mt-7 grid grid-cols-3 gap-2"><span className="rounded-xl bg-white/10 p-3 text-center text-xs">كتب</span><span className="rounded-xl bg-white/10 p-3 text-center text-xs">ملابس</span><span className="rounded-xl bg-white/10 p-3 text-center text-xs">أجهزة</span></div></div></div></div></div>
        </div>
      </section>
      <section className="container py-16"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold tracking-[0.18em] text-[#b76f2c]">تصفح حسب اهتمامك</p><h2 className="mt-2 text-3xl font-black text-[#173c37]">الأقسام الرئيسية</h2></div><Link href="/المنتجات" className="hidden text-sm font-bold text-[#173c37] underline-offset-4 hover:underline sm:block">عرض كل المنتجات</Link></div><div className="grid gap-4 md:grid-cols-3">{categories.map(category => { const Icon = category.icon; return <Link key={category.label} href={category.href} className="group rounded-3xl border border-stone-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-[#d5a75c] hover:shadow-lg"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${category.tone}`}><Icon className="h-6 w-6" /></span><h3 className="mt-6 text-xl font-extrabold text-[#173c37]">{category.label}</h3><p className="mt-2 text-sm text-stone-500">{category.subtitle}</p><span className="mt-6 flex items-center gap-2 text-sm font-bold text-[#b76f2c]">استكشف القسم <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /></span></Link>})}</div></section>
      <section className="border-y border-stone-200 bg-white"><div className="container py-16"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold tracking-[0.18em] text-[#b76f2c]">مختارات السوق</p><h2 className="mt-2 text-3xl font-black text-[#173c37]">منتجات مميزة</h2></div><Button asChild variant="outline" className="rounded-xl border-stone-300 text-[#173c37]"><Link href="/المنتجات">عرض الكتالوج</Link></Button></div>{isLoading ? <div className="grid min-h-48 place-items-center text-stone-500"><LoaderCircle className="h-6 w-6 animate-spin" /></div> : products.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.slice(0, 4).map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="rounded-3xl border border-dashed border-stone-300 bg-[#fffdf8] px-6 py-14 text-center"><h3 className="text-xl font-extrabold text-[#173c37]">الكتالوج في طور التجهيز</h3><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-stone-500">سيظهر هنا أول ما يضيف مدير المتجر المنتجات وينشرها.</p></div>}</div></section>
      <section className="container grid gap-5 py-14 md:grid-cols-3"><div className="flex gap-4 rounded-2xl bg-[#e3eee8] p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#173c37]"><ShieldCheck className="h-5 w-5" /></span><div><h3 className="font-extrabold text-[#173c37]">دفع آمن</h3><p className="mt-1 text-sm leading-6 text-stone-600">بوابات دفع موثوقة بعد إعداد حساب التاجر.</p></div></div><div className="flex gap-4 rounded-2xl bg-[#f7ead6] p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#9a5821]"><Truck className="h-5 w-5" /></span><div><h3 className="font-extrabold text-[#173c37]">متابعة واضحة للطلب</h3><p className="mt-1 text-sm leading-6 text-stone-600">حالات مرتبة من التأكيد حتى اكتمال الطلب.</p></div></div><div className="flex gap-4 rounded-2xl bg-[#ebe8f5] p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#50427b]"><BookOpenText className="h-5 w-5" /></span><div><h3 className="font-extrabold text-[#173c37]">خيارات متنوعة</h3><p className="mt-1 text-sm leading-6 text-stone-600">أقسام متوازنة تناسب الاحتياجات اليومية.</p></div></div></section>
    </StoreLayout>
  );
}
