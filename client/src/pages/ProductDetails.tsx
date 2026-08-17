import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatMoney } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Check, LoaderCircle, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Link, useRoute } from "wouter";

export default function ProductDetails() {
  const [, params] = useRoute("/المنتجات/:handle");
  const handle = params?.handle ? decodeURIComponent(params.handle) : "";
  const { data: product, isLoading, isError } = trpc.commerce.products.byHandle.useQuery({ handle }, { enabled: Boolean(handle) });
  const { addItem, loading } = useCart();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  if (isLoading) return <StoreLayout><div className="container grid min-h-[60vh] place-items-center"><LoaderCircle className="h-7 w-7 animate-spin text-[#b76f2c]" /></div></StoreLayout>;
  if (isError || !product) return <StoreLayout><div className="container py-20 text-center"><h1 className="text-3xl font-black text-[#173c37]">لم نجد هذا المنتج</h1><Button asChild className="mt-6 rounded-xl bg-[#173c37]"><Link href="/المنتجات">العودة إلى الكتالوج</Link></Button></div></StoreLayout>;
  const variant = product.variants[0];
  const image = product.images[activeImageIndex] ?? product.images[0];
  return <StoreLayout><div className="container py-8"><Link href="/المنتجات" className="inline-flex items-center gap-2 text-sm font-bold text-stone-600 transition-colors hover:text-[#173c37]"><ArrowRight className="h-4 w-4" />العودة إلى المنتجات</Link><div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16"><div><div className="overflow-hidden rounded-[32px] bg-[#e3eee8]">{image ? <img src={image.url} alt={image.altText || product.title} className="aspect-square h-full w-full object-cover" /> : <div className="aspect-square bg-[radial-gradient(circle_at_65%_30%,#f5d79e,transparent_35%),linear-gradient(135deg,#e3eee8,#c9ded4)]" />}</div>{product.images.length > 1 && <div className="mt-3 flex gap-3 overflow-x-auto pb-1">{product.images.map((thumbnail, index) => <button key={`${thumbnail.url}-${index}`} type="button" onClick={() => setActiveImageIndex(index)} className={`h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${index === activeImageIndex ? "border-[#b76f2c]" : "border-transparent hover:border-stone-300"}`} aria-label={`عرض الصورة ${index + 1} للمنتج`}><img src={thumbnail.url} alt={thumbnail.altText || `${product.title} ${index + 1}`} className="h-full w-full object-cover" /></button>)}</div>}</div><div className="max-w-xl py-2"><p className="text-sm font-bold text-[#b76f2c]">{product.productType || "منتج"}</p><h1 className="mt-3 text-4xl font-black leading-tight text-[#173c37] sm:text-5xl">{product.title}</h1><p className="mt-5 text-2xl font-extrabold text-[#b76f2c]">{formatMoney(product.priceRange.min)}</p><div className="my-7 h-px bg-stone-200" /><p className="whitespace-pre-line leading-8 text-stone-600">{product.description || "ستظهر تفاصيل هذا المنتج هنا عند إضافتها من لوحة إدارة المنتجات."}</p><Button onClick={() => variant && addItem(variant.id)} disabled={!variant?.availableForSale || loading} className="mt-9 h-13 w-full rounded-xl bg-[#173c37] text-base font-extrabold hover:bg-[#0f2b27] sm:w-auto sm:px-9"><ShoppingBag className="ml-2 h-5 w-5" />{variant?.availableForSale ? "أضف إلى السلة" : "غير متوفر حاليًا"}</Button><div className="mt-8 grid gap-3 border-t border-stone-200 pt-6 text-sm text-stone-600"><p className="flex items-center gap-2"><Check className="h-4 w-4 text-[#b76f2c]" />خيارات دفع متنوعة تظهر عند إتمام الطلب.</p><p className="flex items-center gap-2"><Check className="h-4 w-4 text-[#b76f2c]" />متابعة منظمة لحالة الطلب بعد تأكيده.</p></div></div></div></div></StoreLayout>;
}
