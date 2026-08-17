import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BookOpen, ChevronLeft, ChevronRight, Download, LibraryBig, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function DigitalLibrary() {
  const { user, loading } = useAuth();
  const { data: books = [], isLoading } = trpc.digitalBooks.mine.useQuery(undefined, { enabled: Boolean(user) });
  const [selectedHandle, setSelectedHandle] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const saveProgress = trpc.digitalBooks.saveProgress.useMutation();
  useEffect(() => { if (!selectedHandle && books[0]) setSelectedHandle(books[0].book.productHandle); }, [books, selectedHandle]);
  const reader = trpc.digitalBooks.reader.useQuery({ productHandle: selectedHandle || "unavailable" }, { enabled: Boolean(selectedHandle) });
  useEffect(() => { if (reader.data) setCurrentPage(reader.data.lastPage); }, [reader.data?.id, reader.data?.lastPage]);
  const movePage = (next: number) => {
    const page = Math.max(1, next);
    setCurrentPage(page);
    if (selectedHandle) saveProgress.mutate({ productHandle: selectedHandle, lastPage: page });
  };

  if (loading) return <StoreLayout><div className="container grid min-h-[60vh] place-items-center"><LoaderCircle className="h-7 w-7 animate-spin text-[#b76f2c]" /></div></StoreLayout>;
  if (!user) return <StoreLayout><div className="container grid min-h-[65vh] place-items-center"><div className="max-w-lg rounded-3xl border border-stone-200 bg-white p-8 text-center"><LibraryBig className="mx-auto h-9 w-9 text-[#b76f2c]" /><h1 className="mt-4 text-3xl font-black text-[#173c37]">مكتبتي الرقمية</h1><p className="mt-3 leading-7 text-stone-600">سجّل الدخول لقراءة الكتب التي تم اعتماد دفعها من حسابك.</p><Button onClick={() => startLogin()} className="mt-6 rounded-xl bg-[#173c37]">تسجيل الدخول</Button></div></div></StoreLayout>;
  return <StoreLayout><div className="container py-10"><div className="rounded-[32px] bg-[#173c37] p-7 text-white"><p className="text-sm text-[#f5c96a]">قراءة وتنزيل مرخّصان</p><h1 className="mt-2 text-3xl font-black">مكتبتي الرقمية</h1><p className="mt-3 text-sm leading-7 text-stone-300">يُحفظ رقم الصفحة عند استخدام أزرار القارئ، لتعود إلى آخر موضع قراءة بسهولة. لا تشارك الملفات إلا وفق حقوق النشر والترخيص.</p></div>{isLoading ? <div className="grid min-h-48 place-items-center"><LoaderCircle className="h-6 w-6 animate-spin text-[#b76f2c]" /></div> : books.length ? <div className="mt-7 grid gap-6 lg:grid-cols-[280px_1fr]"><aside className="rounded-3xl border border-stone-200 bg-white p-4">{books.map(({ book }) => <button key={book.id} type="button" onClick={() => setSelectedHandle(book.productHandle)} className={`mb-2 flex w-full items-center gap-3 rounded-2xl p-4 text-right transition-colors ${selectedHandle === book.productHandle ? "bg-[#e3eee8] text-[#173c37]" : "hover:bg-stone-50 text-stone-600"}`}><BookOpen className="h-5 w-5 shrink-0" /><span className="font-bold">{book.title}</span></button>)}</aside><section className="overflow-hidden rounded-3xl border border-stone-200 bg-white"><div className="flex flex-col gap-4 border-b border-stone-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black text-[#173c37]">{reader.data?.title || "جارٍ فتح الكتاب…"}</h2><p className="mt-1 text-xs text-stone-500">آخر صفحة محفوظة: {reader.data?.lastPage || 1}</p></div>{reader.data && <div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" onClick={() => movePage(currentPage - 1)} disabled={currentPage <= 1 || saveProgress.isPending} className="rounded-lg"><ChevronRight className="h-4 w-4" />السابق</Button><span className="min-w-20 text-center text-sm font-bold text-[#173c37]">صفحة {currentPage}</span><Button size="sm" variant="outline" onClick={() => movePage(currentPage + 1)} disabled={saveProgress.isPending} className="rounded-lg">التالي<ChevronLeft className="h-4 w-4" /></Button><Button asChild size="sm" className="rounded-lg bg-[#b76f2c] hover:bg-[#9a5821]"><a href={reader.data.downloadUrl} download target="_blank" rel="noreferrer"><Download className="ml-1 h-4 w-4" />تنزيل PDF</a></Button></div>}</div>{reader.isLoading ? <div className="grid min-h-[620px] place-items-center"><LoaderCircle className="h-6 w-6 animate-spin text-[#b76f2c]" /></div> : reader.data ? <iframe key={`${reader.data.id}-${currentPage}`} title={reader.data.title} src={`${reader.data.pdfUrl}#page=${currentPage}`} className="h-[720px] w-full bg-stone-100" /> : <div className="grid min-h-[360px] place-items-center p-8 text-center text-sm text-stone-500">تعذر فتح الكتاب الآن. حاول التحديث لاحقًا.</div>}</section></div> : <div className="mt-7 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center"><LibraryBig className="mx-auto h-9 w-9 text-[#b76f2c]" /><h2 className="mt-4 text-xl font-black text-[#173c37]">لا توجد كتب رقمية في مكتبتك</h2><p className="mt-2 text-sm leading-7 text-stone-500">بعد شراء كتاب إلكتروني واعتماد إثبات السداد، سيظهر هنا للقراءة والتنزيل.</p></div>}</div></StoreLayout>;
}
