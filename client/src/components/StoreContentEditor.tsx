import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { FilePenLine, LoaderCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type ContentForm = { storeName: string; heroEyebrow: string; heroTitle: string; heroHighlight: string; heroDescription: string; footerDescription: string };
const emptyContent: ContentForm = { storeName: "سوقك العربي", heroEyebrow: "اختيارات منتقاة لك", heroTitle: "كل ما تحتاجه،", heroHighlight: "في مكان عربي واحد.", heroDescription: "", footerDescription: "" };

export function StoreContentEditor() {
  const utils = trpc.useUtils();
  const { data: settings } = trpc.storeSettings.admin.useQuery();
  const [form, setForm] = useState<ContentForm>(emptyContent);
  const [notice, setNotice] = useState("");
  useEffect(() => { if (settings) setForm(settings); }, [settings]);
  const update = trpc.storeSettings.update.useMutation({ onSuccess: () => { utils.storeSettings.admin.invalidate(); utils.storeSettings.public.invalidate(); setNotice("تم حفظ محتوى المتجر وتحديث الواجهة الرئيسية."); } });
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setNotice(""); try { await update.mutateAsync(form); } catch (error) { setNotice(error instanceof Error ? error.message : "تعذر حفظ المحتوى."); } };
  return <section id="store-content" className="mt-7 scroll-mt-24 rounded-3xl border border-stone-200 bg-white p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e3eee8] text-[#173c37]"><FilePenLine className="h-5 w-5" /></span><div><h2 className="font-black text-[#173c37]">محرر محتوى المتجر</h2><p className="text-xs text-stone-500">عدّل اسم المتجر والرسالة التسويقية والوصف الظاهر في الصفحة الرئيسية مباشرة.</p></div></div><form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="store-name">اسم المتجر</Label><Input id="store-name" value={form.storeName} onChange={event => setForm(current => ({ ...current, storeName: event.target.value }))} className="h-11 rounded-xl" /></div><div className="space-y-2"><Label htmlFor="hero-eyebrow">النص الصغير أعلى العنوان</Label><Input id="hero-eyebrow" value={form.heroEyebrow} onChange={event => setForm(current => ({ ...current, heroEyebrow: event.target.value }))} className="h-11 rounded-xl" /></div><div className="space-y-2"><Label htmlFor="hero-title">عنوان الواجهة الرئيسي</Label><Input id="hero-title" value={form.heroTitle} onChange={event => setForm(current => ({ ...current, heroTitle: event.target.value }))} className="h-11 rounded-xl" /></div><div className="space-y-2"><Label htmlFor="hero-highlight">الجزء الملوّن من العنوان</Label><Input id="hero-highlight" value={form.heroHighlight} onChange={event => setForm(current => ({ ...current, heroHighlight: event.target.value }))} className="h-11 rounded-xl" /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="hero-description">وصف الواجهة</Label><Textarea id="hero-description" value={form.heroDescription} onChange={event => setForm(current => ({ ...current, heroDescription: event.target.value }))} className="min-h-20 rounded-xl" /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="footer-description">وصف التذييل</Label><Textarea id="footer-description" value={form.footerDescription} onChange={event => setForm(current => ({ ...current, footerDescription: event.target.value }))} className="min-h-20 rounded-xl" /></div><div className="md:col-span-2"><Button type="submit" disabled={update.isPending} className="h-11 rounded-xl bg-[#173c37]">{update.isPending && <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}حفظ محتوى المتجر</Button>{notice && <p className="mt-3 text-sm text-stone-600">{notice}</p>}</div></form></section>;
}
