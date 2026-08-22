import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ImageUp, LoaderCircle, ShieldCheck } from "lucide-react";
import { ChangeEvent, FormEvent, useState } from "react";
import { Link, useRoute } from "wouter";

function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("تعذر قراءة الملف."));
    reader.onerror = () => reject(new Error("تعذر قراءة الملف."));
    reader.readAsDataURL(file);
  });
}

export default function PaymentProof() {
  const [, params] = useRoute("/إثبات-الدفع/:orderId");
  const orderId = Number(params?.orderId);
  const { user, loading } = useAuth();
  const { data: orders = [] } = trpc.orders.mine.useQuery(undefined, { enabled: Boolean(user) });
  const order = orders.find(item => item.id === orderId);
  const uploadProof = trpc.payments.uploadProof.useMutation();
  const [file, setFile] = useState<File | null>(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [note, setNote] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null;
    if (!selected) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type) || selected.size > 8 * 1024 * 1024) {
      setError("اختر صورة JPG أو PNG أو WEBP بحجم لا يزيد على 8 ميجابايت.");
      return;
    }
    setFile(selected);
    setError("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!order || !file) { setError("اختر صورة إثبات السداد أولًا."); return; }
    const normalizedAmount = Number(paidAmount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) { setError("أدخل مبلغ التحويل الظاهر في الإيصال."); return; }
    try {
      await uploadProof.mutateAsync({ orderId: order.id, dataUrl: await toDataUrl(file), fileName: file.name, paidAmount: normalizedAmount, transactionReference, note });
      setSuccess(true);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر رفع الإثبات. حاول مرة أخرى.");
    }
  };

  if (loading) return <StoreLayout><div className="container grid min-h-[60vh] place-items-center"><LoaderCircle className="h-7 w-7 animate-spin text-[#b76f2c]" /></div></StoreLayout>;
  if (!user) return <StoreLayout><div className="container grid min-h-[65vh] place-items-center"><div className="max-w-lg rounded-3xl border border-stone-200 bg-white p-8 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-[#b76f2c]" /><h1 className="mt-4 text-3xl font-black text-[#173c37]">تسجيل الدخول مطلوب</h1><p className="mt-3 leading-7 text-stone-600">سجّل الدخول لرفع إثبات السداد ومتابعة مراجعة الطلب.</p><Button onClick={() => startLogin()} className="mt-6 rounded-xl bg-[#173c37]">تسجيل الدخول</Button></div></div></StoreLayout>;
  if (!order || !["فودافون كاش", "فوري", "واتساب"].includes(order.paymentMethod)) return <StoreLayout><div className="container grid min-h-[65vh] place-items-center"><div className="max-w-lg rounded-3xl border border-stone-200 bg-white p-8 text-center"><h1 className="text-2xl font-black text-[#173c37]">لا يتوفر إثبات يدوي لهذا الطلب</h1><p className="mt-3 text-stone-600">تحقق من رقم الطلب أو طريقة الدفع المختارة.</p><Button asChild className="mt-6 rounded-xl bg-[#173c37]"><Link href="/حسابي">العودة إلى حسابي</Link></Button></div></div></StoreLayout>;
  if (success) return <StoreLayout><div className="container grid min-h-[65vh] place-items-center"><div className="max-w-lg rounded-3xl border border-stone-200 bg-white p-8 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-[#b76f2c]" /><h1 className="mt-4 text-3xl font-black text-[#173c37]">تم رفع إثبات السداد</h1><p className="mt-3 leading-7 text-stone-600">سيظهر للمدير للمراجعة. بعد اعتماد الدفع، ستتغير حالة الطلب ويُمنح الكتاب الإلكتروني عند وجوده في الطلب.</p><Button asChild className="mt-6 rounded-xl bg-[#173c37]"><Link href="/حسابي">العودة إلى حسابي</Link></Button></div></div></StoreLayout>;

  return <StoreLayout><div className="container max-w-3xl py-12"><p className="text-xs font-extrabold tracking-[0.18em] text-[#b76f2c]">إثبات السداد</p><h1 className="mt-2 text-4xl font-black text-[#173c37]">رفع لقطة التحويل</h1><p className="mt-3 text-stone-600">الطلب <strong>{order.orderNumber}</strong> — المرجع المطلوب: <strong>{order.paymentReference}</strong>.</p><form onSubmit={submit} className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8"><div className="rounded-2xl bg-[#fff6e9] p-4 text-sm leading-7 text-[#744819]">إجمالي الطلب: <strong>{Number(order.total).toLocaleString("ar-EG")} {order.currencyCode}</strong>. أدخل مبلغ التحويل كما يظهر في الإيصال؛ ستتم مراجعته يدويًا ولا تعني اللقطة اعتماد الدفع تلقائيًا.</div><div className="mt-6 grid gap-5"><div className="space-y-2"><Label htmlFor="proof">صورة إثبات السداد</Label><Input id="proof" type="file" accept="image/jpeg,image/png,image/webp" required onChange={chooseFile} className="h-12 cursor-pointer rounded-xl" />{file && <p className="text-xs text-stone-500">{file.name}</p>}</div><div className="space-y-2"><Label htmlFor="paid-amount">مبلغ التحويل الفعلي</Label><Input id="paid-amount" value={paidAmount} onChange={event => setPaidAmount(event.target.value)} required inputMode="decimal" type="number" min="0.01" step="0.01" placeholder={String(order.total)} dir="ltr" className="h-12 rounded-xl" /></div><div className="space-y-2"><Label htmlFor="transaction">رقم عملية التحويل (إن وُجد)</Label><Input id="transaction" value={transactionReference} onChange={event => setTransactionReference(event.target.value)} placeholder="أدخل رقم العملية الظاهر في المحفظة أو الإيصال" className="h-12 rounded-xl" /></div><div className="space-y-2"><Label htmlFor="note">ملاحظة للمدير (اختياري)</Label><Textarea id="note" value={note} onChange={event => setNote(event.target.value)} placeholder="مثال: تم التحويل باسم…" className="min-h-24 rounded-xl" /></div></div>{error && <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<Button type="submit" disabled={uploadProof.isPending} className="mt-6 h-12 w-full rounded-xl bg-[#173c37] font-extrabold hover:bg-[#0f2b27]">{uploadProof.isPending ? <LoaderCircle className="ml-2 h-4 w-4 animate-spin" /> : <ImageUp className="ml-2 h-4 w-4" />}رفع الإثبات للمراجعة</Button></form></div></StoreLayout>;
}
