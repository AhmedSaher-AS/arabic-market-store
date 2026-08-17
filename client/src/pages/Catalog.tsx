import { ProductCard } from "@/components/ProductCard";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { LoaderCircle, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

const categories = ["الكل", "كتب", "ملابس", "أجهزة"];

export default function Catalog() {
  const [location] = useLocation();
  const initialCategory = new URLSearchParams(location.split("?")[1] || "").get("category") || "الكل";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const { data: products = [], isLoading, isError } = trpc.commerce.products.list.useQuery({ first: 100 });
  const filtered = useMemo(() => products.filter(product => {
    const haystack = `${product.title} ${product.description} ${product.productType} ${product.tags.join(" ")}`.toLowerCase();
    const categoryMatches = selectedCategory === "الكل" || product.productType === selectedCategory || product.tags.includes(selectedCategory);
    const textMatches = !query || haystack.includes(query.toLowerCase());
    const priceMatches = !maxPrice || Number(product.priceRange.min.amount) <= Number(maxPrice);
    return categoryMatches && textMatches && priceMatches;
  }), [products, selectedCategory, query, maxPrice]);

  return <StoreLayout><section className="border-b border-stone-200 bg-[#f5f1e8]"><div className="container py-12"><p className="text-xs font-extrabold tracking-[0.18em] text-[#b76f2c]">اكتشف ما يناسبك</p><h1 className="mt-2 text-4xl font-black text-[#173c37]">كتالوج المنتجات</h1><p className="mt-3 max-w-xl leading-7 text-stone-600">ابحث وحدد الفئة والسعر للوصول إلى ما تريده بسرعة.</p></div></section><section className="container py-8"><div className="grid gap-4 rounded-3xl border border-stone-200 bg-white p-4 lg:grid-cols-[1fr_auto_auto]"><label className="relative"><Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث باسم المنتج أو الوصف" className="h-12 rounded-xl border-stone-200 pr-11 text-right" /></label><label className="flex h-12 items-center gap-3 rounded-xl border border-stone-200 px-4 text-sm text-stone-500"><SlidersHorizontal className="h-4 w-4" /><span>حتى سعر</span><input value={maxPrice} onChange={event => setMaxPrice(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="أي سعر" className="w-24 bg-transparent text-right font-bold text-[#173c37] outline-none" /></label><Button variant="ghost" onClick={() => { setSelectedCategory("الكل"); setQuery(""); setMaxPrice(""); }} className="h-12 rounded-xl text-stone-500 hover:bg-stone-100"><X className="ml-2 h-4 w-4" />مسح الفلاتر</Button></div><div className="mt-5 flex flex-wrap gap-2">{categories.map(category => <button key={category} onClick={() => setSelectedCategory(category)} className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${selectedCategory === category ? "bg-[#173c37] text-white" : "bg-stone-100 text-stone-600 hover:bg-[#e3eee8]"}`}>{category}</button>)}</div><div className="mt-8 flex items-center justify-between"><p className="text-sm text-stone-500">{isLoading ? "جارٍ تحميل المنتجات…" : `${filtered.length} منتجًا مطابقًا`}</p></div>{isLoading ? <div className="grid min-h-80 place-items-center"><LoaderCircle className="h-7 w-7 animate-spin text-[#b76f2c]" /></div> : isError ? <div className="mt-6 rounded-2xl bg-rose-50 p-6 text-center text-rose-700">تعذر تحميل الكتالوج مؤقتًا. أعد المحاولة لاحقًا.</div> : filtered.length ? <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{filtered.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-[#fffdf8] px-6 py-16 text-center"><h2 className="text-xl font-extrabold text-[#173c37]">لا توجد نتائج مطابقة</h2><p className="mt-3 text-sm text-stone-500">جرّب تغيير عبارة البحث أو نطاق السعر أو الفئة.</p></div>}</section></StoreLayout>;
}

