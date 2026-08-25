import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { formatUserFacingError } from "@/lib/userFacingError";
import { Download, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function DownloadPolicyManager() {
  const utils = trpc.useUtils();
  const { data: books = [], isLoading } = trpc.digitalBooks.adminList.useQuery();
  const [values, setValues] = useState<Record<number, string>>({});
  const updateDetails = trpc.digitalBooks.updateDetails.useMutation({
    onSuccess: () => {
      void utils.digitalBooks.adminList.invalidate();
      toast.success("تم حفظ حد التنزيل للكتاب.");
    },
    onError: error => toast.error(formatUserFacingError(error, "تعذر حفظ حد التنزيل الآن. حاول مرة أخرى.")),
  });

  const saveLimit = (book: typeof books[number]) => {
    const rawLimit = values[book.id] ?? String(book.maxDownloads);
    const maxDownloads = Number(rawLimit);
    if (!Number.isInteger(maxDownloads) || maxDownloads < 0 || maxDownloads > 100) {
      toast.error("أدخل رقمًا صحيحًا من 0 إلى 100. الصفر يعني تنزيلات غير محدودة.");
      return;
    }
    updateDetails.mutate({
      bookId: book.id,
      title: book.title,
      description: book.description,
      shortDescription: book.shortDescription,
      author: book.author,
      language: book.language,
      pageCount: book.pageCount,
      category: book.category,
      tags: book.tags,
      tableOfContents: book.tableOfContents,
      price: Number(book.price),
      currencyCode: book.currencyCode,
      isAvailable: Boolean(book.isAvailable),
      maxDownloads,
    });
  };

  return <section id="download-policy" className="mt-7 rounded-3xl border border-[#d9d4ed] bg-[#faf9ff] p-6">
    <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ebe8f5] text-[#50427b]"><Download className="h-5 w-5" /></span><div><h2 className="font-black text-[#173c37]">سياسة تنزيل الكتب</h2><p className="mt-1 text-xs leading-6 text-stone-500">يُطبّق الحد من الخادم عند إنشاء رابط تنزيل مرخّص. اكتب 0 للسماح بتنزيلات غير محدودة.</p></div></div>
    {isLoading ? <div className="grid min-h-24 place-items-center"><LoaderCircle className="h-5 w-5 animate-spin text-[#50427b]" /></div> : books.length ? <div className="mt-5 grid gap-3">{books.map(book => <div key={book.id} className="flex flex-col gap-3 rounded-2xl border border-white bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-[#173c37]">{book.title}</p><p className="mt-1 text-xs text-stone-500">الحد الحالي: {book.maxDownloads === 0 ? "غير محدود" : `${book.maxDownloads} تنزيلات`}</p></div><div className="flex items-center gap-2"><Input aria-label={`حد تنزيل ${book.title}`} value={values[book.id] ?? String(book.maxDownloads)} onChange={event => setValues(current => ({ ...current, [book.id]: event.target.value.replace(/[^0-9]/g, "") }))} inputMode="numeric" className="h-10 w-24 rounded-xl text-center" /><Button type="button" size="sm" onClick={() => saveLimit(book)} disabled={updateDetails.isPending} className="h-10 rounded-xl bg-[#50427b] hover:bg-[#42355f]">حفظ الحد</Button></div></div>)}</div> : <p className="mt-5 text-sm text-stone-500">أضف كتابًا رقميًا أولًا لتحدد سياسة تنزيله.</p>}
  </section>;
}
