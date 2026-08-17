import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { BookOpen, FileUp, LoaderCircle } from "lucide-react";
import { ChangeEvent, FormEvent, useState } from "react";

function toDataUrl(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("تعذر قراءة ملف الكتاب.")); reader.onerror = () => reject(new Error("تعذر قراءة ملف الكتاب.")); reader.readAsDataURL(file); }); }

export function DigitalBookUploader() {
  const [productHandle, setProductHandle] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const upload = trpc.digitalBooks.upload.useMutation();
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => { const selected = event.target.files?.[0] || null; if (!selected) return; if (selected.type !== "application/pdf" || selected.size > 24 * 1024 * 1024) { setMessage("اختر ملف PDF بحجم لا يزيد على 24 ميجابايت."); return; } setFile(selected); setMessage(""); };
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!file) { setMessage("اختر ملف PDF أولًا."); return; } try { await upload.mutateAsync({ productHandle, title, fileName: file.name, dataUrl: await toDataUrl(file) }); setMessage("تم ربط ملف الكتاب بالمنتج. سيظهر للعميل بعد اعتماد الدفع."); setProductHandle(""); setTitle(""); setFile(null); } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر رفع الكتاب."); } };
  return <section className="mt-7 rounded-3xl border border-stone-200 bg-white p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ebe8f5] text-[#50427b]"><BookOpen className="h-5 w-5" /></span><div><h2 className="font-black text-[#173c37]">إضافة كتاب إلكتروني</h2><p className="text-xs text-stone-500">اربط PDF بمنتج كتاب موجود باستخدام اسم الرابط (Handle) في مركز التاجر.</p></div></div><form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label htmlFor="book-handle">رابط المنتج (Handle)</Label><Input id="book-handle" value={productHandle} onChange={event => setProductHandle(event.target.value)} required placeholder="اسم-رابط-الكتاب" className="h-11 rounded-xl" /></div><div className="space-y-2"><Label htmlFor="book-title">عنوان الكتاب</Label><Input id="book-title" value={title} onChange={event => setTitle(event.target.value)} required placeholder="عنوان يظهر في المكتبة" className="h-11 rounded-xl" /></div><div className="space-y-2"><Label htmlFor="book-file">ملف PDF</Label><Input id="book-file" type="file" accept="application/pdf" required onChange={chooseFile} className="h-11 cursor-pointer rounded-xl" /></div><div className="md:col-span-3"><Button type="submit" disabled={upload.isPending} className="h-11 rounded-xl bg-[#50427b]">{upload.isPending ? <LoaderCircle className="ml-2 h-4 w-4 animate-spin" /> : <FileUp className="ml-2 h-4 w-4" />}رفع وربط الكتاب</Button>{message && <p className="mt-3 text-sm text-stone-600">{message}</p>}</div></form></section>;
}
