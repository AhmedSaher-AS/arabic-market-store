import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { formatMoney } from "@/lib/format";
import { LoaderCircle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "wouter";

export function CartDrawer() {
  const { cart, isOpen, closeCart, loading, updateQuantity, removeItem } = useCart();
  const items = cart?.items ?? [];

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && closeCart()}>
      <SheetContent side="left" className="flex w-full max-w-[430px] flex-col border-r-0 bg-[#fffdf8] p-0 sm:max-w-[430px]" dir="rtl">
        <SheetHeader className="border-b border-stone-200 px-6 py-6 text-right">
          <SheetTitle className="text-xl font-extrabold text-[#173c37]">سلة التسوق</SheetTitle>
          <SheetDescription>راجِع منتجاتك قبل الانتقال إلى إتمام الطلب.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="grid min-h-[360px] place-items-center text-center">
              <div>
                <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-[#e3eee8] text-[#173c37]"><ShoppingBag className="h-7 w-7" /></div>
                <h3 className="text-lg font-bold text-[#173c37]">السلة فارغة حاليًا</h3>
                <p className="mt-2 max-w-[260px] text-sm leading-6 text-stone-500">اختر ما يناسبك من الكتالوج وسيظهر هنا مباشرة.</p>
                <Button asChild onClick={closeCart} className="mt-6 rounded-xl bg-[#173c37] px-6 hover:bg-[#0f2b27]"><Link href="/المنتجات">تصفح المنتجات</Link></Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <article key={item.lineId} className="flex gap-3 border-b border-stone-200 py-4 first:pt-0">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[#e3eee8]">
                    {item.image ? <img src={item.image.url} alt={item.image.altText || item.productTitle} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-[linear-gradient(135deg,#d9e7df,#eed6a6)]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="line-clamp-1 text-sm font-bold text-[#173c37]">{item.productTitle}</h3>
                        {item.variantTitle !== "Default Title" && <p className="mt-0.5 text-xs text-stone-500">{item.variantTitle}</p>}
                      </div>
                      <button onClick={() => removeItem(item.lineId)} disabled={loading} className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600" aria-label={`حذف ${item.productTitle}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-lg border border-stone-200 bg-white">
                        <button onClick={() => updateQuantity(item.lineId, item.quantity - 1)} disabled={loading} className="grid h-7 w-7 place-items-center text-stone-600 disabled:opacity-40" aria-label="تقليل الكمية"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-7 text-center text-xs font-bold text-[#173c37]">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.lineId, item.quantity + 1)} disabled={loading} className="grid h-7 w-7 place-items-center text-stone-600 disabled:opacity-40" aria-label="زيادة الكمية"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <strong className="text-sm text-[#173c37]">{formatMoney(item.lineTotal)}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t border-stone-200 bg-white px-6 py-5">
            <div className="mb-4 flex items-center justify-between text-sm"><span className="font-semibold text-stone-600">إجمالي المنتجات</span><strong className="text-lg text-[#173c37]">{cart ? formatMoney(cart.total) : "—"}</strong></div>
            <Button asChild onClick={closeCart} disabled={loading} className="h-12 w-full rounded-xl bg-[#b76f2c] text-sm font-extrabold hover:bg-[#9a5821]"><Link href="/إتمام-الطلب">إتمام الطلب</Link></Button>
            {loading && <div className="mt-3 flex items-center justify-center gap-2 text-xs text-stone-500"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />يجري تحديث السلة</div>}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

