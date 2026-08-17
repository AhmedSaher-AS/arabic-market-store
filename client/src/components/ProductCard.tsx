import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatMoney } from "@/lib/format";
import type { Product } from "@shared/commerce/types";
import { ShoppingBag } from "lucide-react";
import { Link } from "wouter";

export function ProductCard({ product }: { product: Product }) {
  const { addItem, loading } = useCart();
  const variant = product.variants[0];
  const image = product.images[0];
  const canAdd = Boolean(variant?.availableForSale);

  return (
    <article className="group overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-2 shadow-[0_12px_32px_rgba(37,53,45,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(23,60,55,0.10)]">
      <Link href={`/المنتجات/${encodeURIComponent(product.handle)}`} className="relative block aspect-[4/4.6] overflow-hidden rounded-[18px] bg-[#e3eee8]">
        {image ? <img src={image.url} alt={image.altText || product.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" /> : <div className="h-full w-full bg-[radial-gradient(circle_at_70%_25%,#f8e6bd,transparent_40%),linear-gradient(135deg,#d4e7dc,#eff3eb)]" />}
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-[#173c37] backdrop-blur">{product.productType || "منتج مميز"}</span>
      </Link>
      <div className="px-2 pb-2 pt-4">
        <Link href={`/المنتجات/${encodeURIComponent(product.handle)}`}><h3 className="line-clamp-1 font-extrabold text-[#173c37] transition-colors hover:text-[#b76f2c]">{product.title}</h3></Link>
        <div className="mt-2 flex items-end justify-between gap-3"><strong className="text-sm text-[#b76f2c]">{formatMoney(product.priceRange.min)}</strong><Button onClick={() => variant && addItem(variant.id)} disabled={!canAdd || loading} size="sm" className="h-9 rounded-xl bg-[#173c37] px-3 text-xs hover:bg-[#0f2b27]"><ShoppingBag className="ml-1.5 h-3.5 w-3.5" />{canAdd ? "أضف للسلة" : "غير متوفر"}</Button></div>
      </div>
    </article>
  );
}

