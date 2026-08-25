import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { formatMoney } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, CreditCard, Landmark, LoaderCircle, MessageCircle, Smartphone, WalletCards } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "wouter";

const methods = [
  { name: "فودافون كاش", note: "محفظة محلية مع رفع إثبات السداد", icon: Smartphone },
  { name: "فوري", note: "رمز فوري أو إثبات سداد بحسب إعداد التاجر", icon: Landmark },
  { name: "واتساب", note: "تواصل مباشر لإتمام الدفع ومراجعة الطلب", icon: MessageCircle },
  { name: "إنستا باي", note: "تحويل بنكي فوري", icon: Landmark },
  { name: "فيزا/ماستركارد", note: "بطاقات الائتمان والخصم", icon: CreditCard },
  { name: "PayPal", note: "دفع دولي", icon: WalletCards },
] as const;

export default function Checkout() {
  const { cart, proceedToCheckout, loading } = useCart();
  const { user } = useAuth();
  const [payment, setPayment] = useState<(typeof methods)[number]["name"]>("فودافون كاش");
  const [notice, setNotice] = useState("");
  const [createdOrder, setCreatedOrder] = useState<{ id: number; orderNumber: string; paymentReference: string } | null>(null);
  const createOrder = trpc.orders.create.useMutation();
  const { data: paymentSettings } = trpc.payments.publicSettings.useQuery();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cart?.itemCount || !cart.id) { setNotice("أضف منتجًا واحدًا على الأقل قبل إتمام الطلب."); return; }
    if (!user) { setNotice("سجّل الدخول أولًا لحفظ طلبك ومتابعة حالته."); startLogin(); return; }
    if (payment === "فودافون كاش" && !paymentSettings?.vodafoneCashNumber) { setNotice("فودافون كاش غير مفعّل من المدير بعد."); return; }
    if (payment === "فوري" && (!paymentSettings || paymentSettings.fawryMode === "معطّل")) { setNotice("فوري غير مفعّل من المدير بعد."); return; }
    if (payment === "واتساب" && !paymentSettings?.whatsappNumber) { setNotice("التواصل عبر واتساب غير مفعّل من المدير بعد."); return; }
    const form = new FormData(event.currentTarget);
    try {
      const order = await createOrder.mutateAsync({
        cartId: cart.id,
        customerName: String(form.get("name") || ""),
        customerPhone: String(form.get("phone") || ""),
        shippingAddress: String(form.get("address") || ""),
        country: String(form.get("country") || ""),
        city: String(form.get("city") || ""),
        paymentMethod: payment,
      });
      setCreatedOrder({ id: order.id, orderNumber: order.orderNumber, paymentReference: order.paymentReference });
      setNotice("");
    } catch (error) { setNotice(error instanceof Error ? error.message : "تعذر تسجيل الطلب. حاول مرة أخرى."); }
  };

  if (createdOrder) {
    const manual = payment === "فودافون كاش" || payment === "فوري" || payment === "واتساب";
    const whatsapp = payment === "واتساب";
    const whatsappMessage = encodeURIComponent(`مرحبًا، أريد إتمام طلب رقم ${createdOrder.orderNumber} من سوقك العربي. مرجع الدفع: ${createdOrder.paymentReference}.`);
    const whatsappUrl = `https://wa.me/${paymentSettings?.whatsappNumber || "201554586850"}?text=${whatsappMessage}`;
    const instructions = payment === "فودافون كاش" ? <>{"حوّل الإجمالي إلى "}<strong dir="ltr">{paymentSettings?.vodafoneCashNumber}</strong>{paymentSettings?.vodafoneCashRecipient ? <> باسم <strong>{paymentSettings.vodafoneCashRecipient}</strong></> : null}، ثم ارفع لقطة السداد موضحًا مرجع الطلب.</> : payment === "فوري" ? <>{paymentSettings?.fawryInstructions || "اسدد عبر فوري حسب بيانات التاجر، ثم ارفع الإيصال للمراجعة."}</> : <>تواصل مع المتجر عبر واتساب لإتمام طريقة الدفع المناسبة، ثم ارفع إثبات السداد عند طلبه.</>;
    return <StoreLayout><div className="container grid min-h-[65vh] place-items-center py-14"><div className="max-w-xl rounded-[32px] border border-stone-200 bg-white p-8 text-center shadow-xl shadow-stone-200/50"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e3eee8] text-[#173c37]"><CheckCircle2 className="h-7 w-7" /></span><h1 className="mt-5 text-3xl font-black text-[#173c37]">تم تسجيل طلبك بحالة معلق</h1><p className="mt-4 leading-8 text-stone-600">رقم الطلب <strong>{createdOrder.orderNumber}</strong> — مرجع الدفع <strong>{createdOrder.paymentReference}</strong>.</p>{manual ? <div className="mt-5 rounded-2xl bg-[#fff6e9] p-4 text-right text-sm leading-7 text-[#744819]">{instructions}</div> : <p className="mt-4 leading-8 text-stone-600">اخترت <strong>{payment}</strong>. ستنتقل الآن إلى صفحة الدفع الآمنة لتأكيد السداد؛ لا تُخزَّن بيانات البطاقة في هذا الموقع.</p>}{whatsapp ? <><Button asChild className="mt-7 h-12 w-full rounded-xl bg-[#1f9d55] font-extrabold hover:bg-[#168244]"><a href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle className="ml-2 h-5 w-5" />التواصل لإتمام الدفع عبر واتساب</a></Button><Button asChild variant="outline" className="mt-3 h-11 w-full rounded-xl"><Link href={`/إثبات-الدفع/${createdOrder.id}`}>رفع إثبات السداد لاحقًا</Link></Button></> : manual ? <Button asChild className="mt-7 h-12 w-full rounded-xl bg-[#b76f2c] font-extrabold hover:bg-[#9a5821]"><Link href={`/إثبات-الدفع/${createdOrder.id}`}>رفع إثبات السداد</Link></Button> : <Button onClick={proceedToCheckout} className="mt-7 h-12 w-full rounded-xl bg-[#b76f2c] font-extrabold hover:bg-[#9a5821]">المتابعة إلى الدفع الآمن</Button>}<Button asChild variant="ghost" className="mt-2 rounded-xl text-[#173c37]"><Link href="/حسابي">متابعة طلبي</Link></Button></div></div></StoreLayout>;
  }

  return <StoreLayout><section className="border-b border-stone-200 bg-[#f5f1e8]"><div className="container py-10"><p className="text-xs font-extrabold tracking-[0.18em] text-[#b76f2c]">الخطوة الأخيرة</p><h1 className="mt-2 text-4xl font-black text-[#173c37]">إتمام الطلب</h1></div></section><form onSubmit={submit} className="container grid gap-8 py-10 lg:grid-cols-[1fr_380px]"><div className="space-y-7"><section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8"><h2 className="text-xl font-black text-[#173c37]">بيانات الشحن</h2><p className="mt-2 text-sm leading-6 text-stone-500">تُحفظ لتمكين تنفيذ الطلب ومتابعته من حسابك.</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="name">الاسم الكامل</Label><Input id="name" name="name" required placeholder="اكتب الاسم كما يظهر في الشحن" className="h-12 rounded-xl" /></div><div className="space-y-2"><Label htmlFor="phone">رقم الهاتف</Label><Input id="phone" name="phone" required inputMode="tel" placeholder="01xxxxxxxxx" className="h-12 rounded-xl" /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="address">العنوان بالتفصيل</Label><Input id="address" name="address" required placeholder="المدينة، المنطقة، الشارع، رقم المبنى" className="h-12 rounded-xl" /></div><div className="space-y-2"><Label htmlFor="country">الدولة</Label><Input id="country" name="country" required placeholder="مثال: مصر" className="h-12 rounded-xl" /></div><div className="space-y-2"><Label htmlFor="city">المدينة</Label><Input id="city" name="city" required placeholder="مثال: القاهرة" className="h-12 rounded-xl" /></div></div></section><section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8"><h2 className="text-xl font-black text-[#173c37]">اختر طريقة الدفع</h2><div className="mt-5 grid gap-3">{methods.map(method => { const Icon = method.icon; const selected = payment === method.name; return <label key={method.name} className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-colors ${selected ? "border-[#173c37] bg-[#eaf3ee]" : "border-stone-200 hover:border-stone-300"}`}><input type="radio" name="payment" value={method.name} checked={selected} onChange={() => setPayment(method.name)} className="accent-[#173c37]" /><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#173c37]"><Icon className="h-5 w-5" /></span><span className="flex-1"><span className="block font-extrabold text-[#173c37]">{method.name}</span><span className="mt-1 block text-xs text-stone-500">{method.note}</span></span></label>})}</div></section></div><aside className="h-fit rounded-3xl border border-stone-200 bg-white p-6 lg:sticky lg:top-24"><h2 className="text-lg font-black text-[#173c37]">ملخص الطلب</h2>{cart?.items.length ? <div className="mt-5 space-y-4 border-y border-stone-200 py-5">{cart.items.map(item => <div key={item.lineId} className="flex items-center justify-between gap-3 text-sm"><span className="line-clamp-1 text-stone-600">{item.productTitle} <span className="text-stone-400">× {item.quantity}</span></span><strong className="shrink-0 text-[#173c37]">{formatMoney(item.lineTotal)}</strong></div>)}</div> : <p className="mt-4 rounded-xl bg-[#f5f1e8] p-4 text-sm leading-6 text-stone-600">السلة فارغة. يمكنك العودة لاختيار المنتجات.</p>}<div className="mt-5 flex items-center justify-between"><span className="font-bold text-stone-600">الإجمالي</span><strong className="text-xl text-[#173c37]">{cart ? formatMoney(cart.total) : "—"}</strong></div>{notice && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{notice}</p>}<Button type="submit" disabled={loading || createOrder.isPending} className="mt-6 h-12 w-full rounded-xl bg-[#173c37] font-extrabold hover:bg-[#0f2b27]">{(loading || createOrder.isPending) && <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}تأكيد بيانات الطلب</Button><p className="mt-4 text-center text-xs leading-6 text-stone-500">تُراجع عمليات الدفع اليدوية قبل اعتمادها. أما البطاقة وPayPal فيعالجان في صفحة مزود الدفع.</p></aside></form></StoreLayout>;
}
