import { DigitalBookReviews } from "@/components/DigitalBookReviews";
import { FavoriteButton } from "@/components/FavoriteButton";
import { StoreLayout } from "@/components/StoreLayout";
import { SeoMeta } from "@/components/SeoMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { clearCheckoutProfile, loadCheckoutProfile, normalizeEgyptianMobile, paymentMethods, PaymentMethod, saveCheckoutProfile } from "@/lib/checkoutProfile";
import { getBookSeo } from "@/lib/bookSeo";
import { trpc } from "@/lib/trpc";
import { BookOpen, CheckCircle2, ChevronLeft, CircleDollarSign, FileText, LoaderCircle, LockKeyhole, MessageCircle, Share2, ShoppingBag, Trash2, UserRound } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Link, useRoute } from "wouter";

export default function DigitalBookDetails() {
  const [, params] = useRoute("/كتب-رقمية/:handle");
  const handle = params?.handle || "";
  const { user, loading } = useAuth();
  const { data, isLoading, error } = trpc.digitalBooks.detail.useQuery({ productHandle: handle }, { enabled: Boolean(handle) });
  const book = data?.book;
  const [showPurchase, setShowPurchase] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [rememberDetails, setRememberDetails] = useState(true);
  const [savedOnDevice, setSavedOnDevice] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("واتساب");
  const [createdOrder, setCreatedOrder] = useState<{ id: number; orderNumber: string } | null>(null);
  const purchaseRef = useRef<HTMLElement>(null);
  const sample = trpc.digitalBooks.sample.useQuery({ productHandle: handle }, { enabled: showSample && Boolean(handle), retry: false });
  const purchase = trpc.digitalBooks.purchase.useMutation();

  useEffect(() => {
    const profile = loadCheckoutProfile();
    if (!profile) return;
    setCustomerName(profile.customerName);
    setCustomerPhone(profile.customerPhone);
    setPaymentMethod(profile.paymentMethod);
    setSavedOnDevice(true);
  }, []);

  useEffect(() => {
    if (!showPurchase) return;
    const frame = window.requestAnimationFrame(() => purchaseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [showPurchase]);

  const buy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!book || !user) return;
    const normalizedPhone = normalizeEgyptianMobile(customerPhone);
    if (!normalizedPhone) {
      toast.error("أدخل رقم هاتف مصري صحيحًا بصيغة 01xxxxxxxxx قبل متابعة الطلب.");
      return;
    }
    setCustomerPhone(normalizedPhone);
    const order = await purchase.mutateAsync({ bookId: book.id, customerName, customerPhone: normalizedPhone, paymentMethod });
    if (rememberDetails) {
      saveCheckoutProfile({ customerName, customerPhone: normalizedPhone, paymentMethod });
      setSavedOnDevice(true);
      toast.success("تم حفظ بياناتك وطريقة الدفع على هذا الجهاز.");
    }
    setCreatedOrder({ id: order.id, orderNumber: order.orderNumber });
  };

  const clearSavedDetails = () => {
    clearCheckoutProfile();
    setCustomerName("");
    setCustomerPhone("");
    setSavedOnDevice(false);
    setRememberDetails(false);
    toast.success("تم مسح بيانات الشراء المحفوظة من هذا الجهاز.");
  };

  if (isLoading) return <StoreLayout><div className="container grid min-h-[60vh] place-items-center"><LoaderCircle className="h-8 w-8 animate-spin text-[#50427b]" /></div></StoreLayout>;
  if (!book || error) return <StoreLayout><div className="container py-20 text-center"><BookOpen className="mx-auto h-10 w-10 text-[#50427b]" /><h1 className="mt-4 text-2xl font-black text-[#173c37]">لم يتم العثور على الكتاب</h1><Button asChild className="mt-6 rounded-xl bg-[#173c37]"><Link href="/كتب-رقمية">العودة إلى المكتبة</Link></Button></div></StoreLayout>;

  const isFree = Number(book.price) === 0;
  const whatsappUrl = createdOrder ? `https://wa.me/201554586850?text=${encodeURIComponent(`مرحبًا، أريد إتمام سداد طلب الكتاب «${book.title}». رقم الطلب: ${createdOrder.orderNumber}.`)}` : "";
  const purchaseWhatsappUrl = `https://wa.me/201554586850?text=${encodeURIComponent(`مرحبًا، أرغب في شراء كتاب «${book.title}» من سوقك العربي. أريد معرفة طريقة الدفع المناسبة.`)}`;
  const openPurchase = () => { setCreatedOrder(null); setShowPurchase(true); };
  const shareBook = async () => {
    const url = `${window.location.origin}/كتب-رقمية/${encodeURIComponent(book.productHandle)}`;
    const text = `اكتشف كتاب «${book.title}» في سوقك العربي.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: book.title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("تم نسخ رابط الكتاب للمشاركة.");
      }
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") toast.error("تعذر تجهيز رابط المشاركة الآن.");
    }
  };

  const bookSeo = getBookSeo(book);
  const productPath = `/كتب-رقمية/${encodeURIComponent(book.productHandle)}`;
  return <StoreLayout><SeoMeta title={bookSeo.title} description={bookSeo.description} canonicalPath={productPath} image={book.coverUrl} type="product" jsonLd={{ "@context": "https://schema.org", "@type": "Product", name: book.title, description: bookSeo.description, image: book.coverUrl || undefined, author: { "@type": "Person", name: book.author || "الناشر" }, inLanguage: book.language || "ar", offers: { "@type": "Offer", price: Number(book.price), priceCurrency: book.currencyCode, availability: book.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${window.location.origin}${productPath}` } }} /><main className="container py-8">
    <Link href="/كتب-رقمية" className="inline-flex items-center gap-1 text-sm font-bold text-[#50427b] hover:underline"><ChevronLeft className="h-4 w-4" />العودة إلى الكتب الرقمية</Link>
    <section className="mt-6 grid gap-8 rounded-[2rem] border border-[#d9d4ed] bg-[linear-gradient(135deg,#faf9ff,#fffdf8)] p-6 lg:grid-cols-[320px_1fr]">
      <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-3xl bg-[#ebe8f5] shadow-xl">{book.coverUrl ? <img src={book.coverUrl} alt={`غلاف ${book.title}`} className="aspect-[3/4] w-full object-cover" /> : <div className="grid aspect-[3/4] place-items-center"><BookOpen className="h-16 w-16 text-[#50427b]" /></div>}<div className="absolute left-4 top-4"><FavoriteButton compact item={{ itemType: "كتاب رقمي", itemId: book.id, title: book.title, subtitle: book.shortDescription || book.description, price: book.price, currencyCode: book.currencyCode, imageUrl: book.coverUrl, targetPath: `/كتب-رقمية/${book.productHandle}` }} /></div></div>
      <div className="min-w-0"><p className="text-xs font-extrabold tracking-[0.15em] text-[#b76f2c]">{book.category}</p><h1 className="mt-2 text-3xl font-black leading-tight text-[#173c37] md:text-5xl">{book.title}</h1><div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-stone-600"><span className="inline-flex items-center gap-1"><UserRound className="h-4 w-4" />{book.author || "الناشر"}</span><span>{book.pageCount ? `${book.pageCount} صفحة` : "كتاب رقمي"}</span><span>{book.language}</span></div><p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">{book.shortDescription || book.description || "كتاب رقمي متاح للقراءة من مكتبتك بعد إتمام الطلب."}</p><div className="mt-6 flex flex-wrap items-center gap-3"><strong className="inline-flex items-center gap-2 text-2xl text-[#50427b]"><CircleDollarSign className="h-5 w-5" />{isFree ? "مجاني" : `${Number(book.price).toLocaleString("ar-EG")} ${book.currencyCode}`}</strong><span className="rounded-full bg-[#eaf3ee] px-3 py-1 text-xs font-bold text-[#2d7a51]"><LockKeyhole className="ml-1 inline h-3.5 w-3.5" />وصول محمي من مكتبتك</span></div><div className="mt-7 flex flex-wrap gap-3"><Button onClick={openPurchase} className="h-12 rounded-xl bg-[#50427b] px-6 hover:bg-[#42355f]"><ShoppingBag className="ml-2 h-4 w-4" />{isFree ? "احصل على الكتاب مجانًا" : "اشترِ الكتاب الآن"}</Button>{book.sampleUrl && <Button variant="outline" onClick={() => setShowSample(true)} className="h-12 rounded-xl border-[#d9d4ed] text-[#50427b]"><FileText className="ml-2 h-4 w-4" />اقرأ العينة</Button>}<Button type="button" variant="outline" onClick={shareBook} className="h-12 rounded-xl border-[#d9d4ed] text-[#50427b]"><Share2 className="ml-2 h-4 w-4" />مشاركة</Button></div>{showSample && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-3"><span>عينة القراءة جاهزة للفتح في نافذة جديدة.</span>{sample.isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : sample.data ? <Button asChild size="sm" className="rounded-lg bg-[#b76f2c]"><a href={sample.data.pdfUrl} target="_blank" rel="noreferrer">فتح العينة</a></Button> : <span className="text-rose-700">تعذر فتح العينة.</span>}</div></div>}</div>
    </section>
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><div className="space-y-6"><article className="rounded-3xl border border-stone-200 bg-white p-6"><h2 className="text-2xl font-black text-[#173c37]">عن هذا الكتاب</h2><p className="mt-4 whitespace-pre-line leading-8 text-stone-700">{book.description || "أضف وصفًا كاملًا من بوابة المدير ليعرف القارئ ما الذي سيحصل عليه."}</p></article>{bookSeo.isFloatingAdmiral && <article className="rounded-3xl border border-[#d9d4ed] bg-[#faf9ff] p-6"><h2 className="text-2xl font-black text-[#173c37]">رواية الأميرال العائم PDF: النسخة الرقمية</h2><p className="mt-4 leading-8 text-stone-700">تتوفر رواية «الأميرال العائم» هنا ككتاب PDF رقمي للشراء والقراءة من مكتبتك الخاصة في سوقك العربي. راجع وصف الرواية وفهرسها، ثم أكمل الطلب بالطريقة المناسبة لك لتصل إلى نسختك الرقمية وفق سياسة المنتجات الرقمية.</p></article>}{book.tableOfContents && <article className="rounded-3xl border border-stone-200 bg-white p-6"><h2 className="text-2xl font-black text-[#173c37]">فهرس المحتويات</h2><p className="mt-4 whitespace-pre-line leading-8 text-stone-700">{book.tableOfContents}</p></article>}<DigitalBookReviews bookId={book.id} bookTitle={book.title} /></div><aside className="space-y-6"><article className="rounded-3xl bg-[#173c37] p-6 text-white"><h2 className="text-xl font-black">ماذا ستحصل عليه؟</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-stone-200"><li>ملف PDF كامل داخل مكتبتك الرقمية.</li><li>قارئ يحفظ آخر صفحة وصلت إليها.</li><li>تنزيل متاح بعد منح الصلاحية.</li><li>دعم مباشر عبر واتساب عند الحاجة.</li></ul></article><article className="rounded-3xl border border-stone-200 bg-white p-6"><h2 className="text-xl font-black text-[#173c37]">أسئلة سريعة</h2><div className="mt-4 space-y-4 text-sm leading-6 text-stone-600"><p><strong className="text-[#173c37]">متى يصل الكتاب؟</strong><br />بعد اعتماد السداد، أو فورًا إن كان مجانيًا.</p><p><strong className="text-[#173c37]">أين أجده؟</strong><br />من صفحة «مكتبتي» في حسابك.</p><p><strong className="text-[#173c37]">هل يمكنني المتابعة لاحقًا؟</strong><br />نعم، يحفظ القارئ موضع القراءة.</p></div></article></aside></section>
    {data.related.length > 0 && <section className="mt-10"><h2 className="text-2xl font-black text-[#173c37]">كتب مشابهة</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.related.map(item => <Link key={item.id} href={`/كتب-رقمية/${item.productHandle}`} className="rounded-2xl border border-stone-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex gap-3"><div className="grid h-20 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#ebe8f5]">{item.coverUrl ? <img src={item.coverUrl} alt="" className="h-full w-full object-cover" /> : <BookOpen className="h-5 w-5 text-[#50427b]" />}</div><div><p className="text-xs font-bold text-[#b76f2c]">{item.category}</p><h3 className="mt-1 font-black text-[#173c37]">{item.title}</h3><p className="mt-2 text-sm font-bold text-[#50427b]">{Number(item.price) === 0 ? "مجاني" : `${Number(item.price).toLocaleString("ar-EG")} ${item.currencyCode}`}</p></div></div></Link>)}</div></section>}
    {showPurchase && <section ref={purchaseRef} id="إتمام-الشراء" className="mt-10 scroll-mt-24 rounded-3xl border border-[#d9d4ed] bg-[#faf9ff] p-6"><div className="flex items-start justify-between"><div><p className="text-xs font-bold text-[#50427b]">إتمام الطلب</p><h2 className="mt-1 text-2xl font-black text-[#173c37]">{book.title}</h2></div><Button type="button" variant="ghost" onClick={() => { setShowPurchase(false); setCreatedOrder(null); }}>إغلاق</Button></div>{!isFree && !createdOrder && <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#b7e6c9] bg-[#f3fcf6] p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm leading-6 text-[#205f39]">تفضّل التواصل قبل تسجيل الطلب؟ أرسل لنا رسالة عن هذا الكتاب وسنساعدك في إتمام السداد.</p><Button asChild variant="outline" className="shrink-0 rounded-xl border-[#25D366] text-[#157b40] hover:bg-white"><a href={purchaseWhatsappUrl} target="_blank" rel="noreferrer"><MessageCircle className="ml-2 h-4 w-4" />راسل فريق المتجر</a></Button></div>}{createdOrder ? <div className="mt-5 rounded-2xl bg-white p-5"><CheckCircle2 className="h-7 w-7 text-[#2d7a51]" /><h3 className="mt-3 font-black text-[#173c37]">اكتملت مرحلة التنفيذ تلقائيًا</h3><p className="mt-2 text-sm leading-7 text-stone-600">{isFree ? "أُضيف الكتاب إلى مكتبتك مباشرة ويمكنك البدء في القراءة." : <>رقم الطلب: <strong>{createdOrder.orderNumber}</strong>. تم تجهيز طلب الكتاب الرقمي تلقائيًا؛ اختر الآن طريقة إتمام السداد.</>}</p>{isFree ? <Button asChild className="mt-5 rounded-xl bg-[#173c37]"><Link href="/مكتبتي">اذهب إلى مكتبتي</Link></Button> : <div className="mt-5 grid gap-3 sm:grid-cols-2"><Button asChild className="h-12 rounded-xl bg-[#b76f2c] font-extrabold hover:bg-[#9a5821]"><Link href={`/إثبات-الدفع/${createdOrder.id}`}><FileText className="ml-2 h-5 w-5" />رفع إثبات السداد الآن</Link></Button><Button asChild variant="outline" className="h-12 rounded-xl border-[#25D366] text-[#157b40] hover:bg-[#effcf3]"><a href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle className="ml-2 h-5 w-5" />راسل فريق المتجر</a></Button></div>}<Button asChild variant="ghost" className="mt-3 rounded-xl"><Link href="/طلباتي">عرض تفاصيل الطلب</Link></Button></div> : loading ? <p className="mt-5 text-sm text-stone-500">جارٍ التحقق من الحساب…</p> : !user ? <div className="mt-5 rounded-2xl bg-white p-5"><p className="text-sm text-stone-600">سجل الدخول أولًا لربط الكتاب بحسابك.</p><Button onClick={() => startLogin()} className="mt-4 rounded-xl bg-[#173c37]">تسجيل الدخول</Button></div> : <form onSubmit={buy} aria-busy={purchase.isPending} className="mt-5 grid gap-4 md:grid-cols-2"><Field label="الاسم"><Input value={customerName} onChange={event => setCustomerName(event.target.value)} required placeholder="الاسم الكامل" autoComplete="name" /></Field><Field label="رقم الهاتف"><Input value={customerPhone} onChange={event => setCustomerPhone(event.target.value)} required placeholder="01xxxxxxxxx" autoComplete="tel" inputMode="tel" dir="ltr" /><p className="text-xs text-stone-500">أدخل رقمًا مصريًا صحيحًا بصيغة 01xxxxxxxxx.</p></Field>{!isFree && <Field label="طريقة الدفع"><select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value as PaymentMethod)} className="h-11 w-full rounded-xl border border-[#25D366] bg-[#f3fcf6] px-3 text-sm font-bold text-[#173c37]">{paymentMethods.map(method => <option key={method}>{method === "واتساب" ? "واتساب فريق المتجر — أفضل طريقة للدفع" : method}</option>)}</select><p className="mt-2 text-xs font-bold text-[#157b40]">واتساب فريق المتجر هو أفضل طريقة للدفع والتواصل السريع.</p></Field>}<div className="rounded-xl border border-[#d9d4ed] bg-white p-3 md:col-span-2"><label className="flex cursor-pointer items-start gap-2 text-sm text-stone-700"><input type="checkbox" checked={rememberDetails} onChange={event => setRememberDetails(event.target.checked)} className="mt-1 h-4 w-4 accent-[#50427b]" /><span><strong className="text-[#173c37]">حفظ بياناتي وطريقة الدفع على هذا الجهاز</strong><br /><span className="text-xs text-stone-500">يُحفظ الاسم ورقم الهاتف وطريقة الدفع المختارة في متصفحك فقط. لا تُحفظ بيانات الدفع الحساسة.</span></span></label>{savedOnDevice && <Button type="button" variant="ghost" onClick={clearSavedDetails} className="mt-2 h-8 px-0 text-xs text-rose-700 hover:bg-transparent hover:text-rose-800"><Trash2 className="ml-1 h-3.5 w-3.5" />مسح البيانات المحفوظة من هذا الجهاز</Button>}</div><div className="md:col-span-2"><Button type="submit" disabled={purchase.isPending} aria-busy={purchase.isPending} className="h-12 w-full rounded-xl bg-[#50427b] transition-opacity disabled:cursor-wait disabled:opacity-80">{purchase.isPending ? <><LoaderCircle className="ml-2 h-4 w-4 animate-spin" />جارٍ تأكيد الطلب…</> : isFree ? "إضافة إلى مكتبتي" : "تسجيل الطلب والانتقال للسداد"}</Button><p role="status" aria-live="polite" className="mt-2 min-h-5 text-center text-xs text-[#50427b]">{purchase.isPending ? "يجري تجهيز طلبك الآن؛ لا تغلق الصفحة." : ""}</p></div>{purchase.error && <p className="md:col-span-2 text-sm text-rose-700">{purchase.error.message}</p>}</form>}</section>}
  </main></StoreLayout>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
