import { FavoriteButton } from "@/components/FavoriteButton";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeArabicSearch } from "@/lib/digitalBookSearch";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

type SortOption = "الأحدث" | "الأعلى تقييمًا" | "السعر: الأقل" | "السعر: الأعلى";

const PAGE_SIZE = 9;

export default function LocalDigitalBooks() {
  const { data: books = [], isLoading } = trpc.digitalBooks.catalog.useQuery();
  const [category, setCategory] = useState("الكل");
  const [sort, setSort] = useState<SortOption>("الأحدث");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [page, setPage] = useState(1);

  const categories = useMemo(
    () => ["الكل", ...Array.from(new Set(books.map(book => book.category).filter(Boolean)))],
    [books]
  );

  const visibleBooks = useMemo(() => {
    const normalizedSearch = normalizeArabicSearch(search);
    const minimum = Number(minPrice || 0);
    const maximum = maxPrice ? Number(maxPrice) : Number.POSITIVE_INFINITY;

    return books
      .filter(book => {
        const price = Number(book.price);
        const haystack = normalizeArabicSearch(
          [book.title, book.author, book.category, book.language, book.shortDescription, book.description].filter(Boolean).join(" ")
        );
        return (category === "الكل" || book.category === category)
          && (!normalizedSearch || haystack.includes(normalizedSearch))
          && price >= minimum
          && price <= maximum
          && (!freeOnly || price === 0);
      })
      .sort((a, b) => {
        if (sort === "السعر: الأقل") return Number(a.price) - Number(b.price);
        if (sort === "السعر: الأعلى") return Number(b.price) - Number(a.price);
        if (sort === "الأعلى تقييمًا") return b.averageRating - a.averageRating || b.reviewCount - a.reviewCount;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [books, category, freeOnly, maxPrice, minPrice, search, sort]);

  const totalPages = Math.max(1, Math.ceil(visibleBooks.length / PAGE_SIZE));
  const paginatedBooks = visibleBooks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActiveFilters = category !== "الكل" || Boolean(search || minPrice || maxPrice) || freeOnly || sort !== "الأحدث";

  useEffect(() => setPage(1), [category, freeOnly, maxPrice, minPrice, search, sort]);
  useEffect(() => setPage(current => Math.min(current, totalPages)), [totalPages]);

  const clearFilters = () => {
    setCategory("الكل");
    setSort("الأحدث");
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setFreeOnly(false);
  };

  return <StoreLayout>
    <section className="border-b border-stone-200 bg-[linear-gradient(135deg,#f2effa,#fffdf8)]">
      <div className="container py-12">
        <p className="text-xs font-extrabold tracking-[0.16em] text-[#50427b]">مكتبة مستقلة</p>
        <h1 className="mt-2 text-4xl font-black text-[#173c37]">اكتشف كتبك الرقمية التالية</h1>
        <p className="mt-3 max-w-2xl leading-7 text-stone-600">ابحث بعنوان الكتاب أو اسم المؤلف أو التصنيف، ثم رتّب النتائج وحدد النطاق السعري المناسب لك.</p>
      </div>
    </section>
    <main className="container py-10">
      <section aria-label="البحث وتصفية الكتب" className="rounded-3xl border border-[#d9d4ed] bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <label className="relative block">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#50427b]" />
            <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث باسم كتاب أو مؤلف أو موضوع…" className="h-12 rounded-xl border-stone-200 pr-11 text-right" />
          </label>
          <label className="flex h-12 items-center gap-2 rounded-xl border border-stone-200 px-3 text-sm text-stone-600">
            <span>من</span><input aria-label="أقل سعر" value={minPrice} onChange={event => setMinPrice(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="0" className="w-16 bg-transparent text-center font-bold text-[#173c37] outline-none" /><span>ج.م</span>
          </label>
          <label className="flex h-12 items-center gap-2 rounded-xl border border-stone-200 px-3 text-sm text-stone-600">
            <span>إلى</span><input aria-label="أعلى سعر" value={maxPrice} onChange={event => setMaxPrice(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="أي سعر" className="w-20 bg-transparent text-center font-bold text-[#173c37] outline-none" /><span>ج.م</span>
          </label>
          <Button type="button" variant="outline" onClick={() => setFreeOnly(value => !value)} className={`h-12 rounded-xl ${freeOnly ? "border-[#2d7a51] bg-[#eaf3ee] text-[#205f39]" : "border-[#d9d4ed] text-[#50427b]"}`}>كتب مجانية</Button>
        </div>
        <div className="mt-4 flex flex-col gap-4 border-t border-stone-100 pt-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-wrap gap-2">
            {categories.map(item => <Button key={item} type="button" size="sm" variant={category === item ? "default" : "outline"} onClick={() => setCategory(item)} className={category === item ? "rounded-lg bg-[#50427b]" : "rounded-lg border-[#d9d4ed] text-[#50427b]"}>{item}</Button>)}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-bold text-[#173c37]"><SlidersHorizontal className="h-4 w-4 text-[#50427b]" />فرز<select value={sort} onChange={event => setSort(event.target.value as SortOption)} className="h-9 rounded-lg border border-input bg-white px-2 text-sm font-normal"><option>الأحدث</option><option>الأعلى تقييمًا</option><option>السعر: الأقل</option><option>السعر: الأعلى</option></select></label>
            {hasActiveFilters && <Button type="button" variant="ghost" onClick={clearFilters} className="h-9 rounded-lg text-rose-700 hover:bg-rose-50 hover:text-rose-800"><X className="ml-1 h-4 w-4" />مسح الفلاتر</Button>}
          </div>
        </div>
      </section>
      <div className="mt-6 flex items-center justify-between"><p aria-live="polite" className="text-sm text-stone-500">{isLoading ? "جارٍ تحميل الكتب…" : `${visibleBooks.length.toLocaleString("ar-EG")} كتابًا مطابقًا`}</p>{visibleBooks.length > PAGE_SIZE && <p className="text-xs text-stone-400">صفحة {page.toLocaleString("ar-EG")} من {totalPages.toLocaleString("ar-EG")}</p>}</div>
      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[370px] animate-pulse rounded-3xl border border-[#d9d4ed] bg-[#faf9ff]" />) : paginatedBooks.length ? paginatedBooks.map(book => <article key={book.id} className="relative overflow-hidden rounded-3xl border border-[#d9d4ed] bg-white shadow-[0_12px_30px_rgba(80,66,123,0.06)]">
          <div className="absolute left-4 top-4 z-10"><FavoriteButton compact item={{ itemType: "كتاب رقمي", itemId: book.id, title: book.title, subtitle: book.shortDescription || book.description, price: book.price, currencyCode: book.currencyCode, imageUrl: book.coverUrl, targetPath: `/كتب-رقمية/${book.productHandle}` }} /></div>
          <Link href={`/كتب-رقمية/${book.productHandle}`} className="block"><div className="flex h-56 items-center justify-center bg-[#ebe8f5]">{book.coverUrl ? <img src={book.coverUrl} alt={`غلاف ${book.title}`} className="h-full w-full object-cover transition duration-300 hover:scale-105" loading="lazy" /> : <BookOpen className="h-10 w-10 text-[#50427b]" />}</div></Link>
          <div className="p-6"><div className="flex items-center justify-between gap-2"><span className="rounded-full bg-[#f5efe5] px-2.5 py-1 text-[11px] font-bold text-[#b76f2c]">{book.category}</span>{book.pageCount ? <span className="text-xs text-stone-500">{book.pageCount} صفحة</span> : null}</div><Link href={`/كتب-رقمية/${book.productHandle}`} className="mt-3 block text-xl font-black text-[#173c37] hover:underline">{book.title}</Link><p className="mt-1 text-xs font-bold text-stone-500">{book.author || "كتاب رقمي"} · {book.language}</p>{book.reviewCount > 0 ? <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[#b76f2c]"><Star className="h-3.5 w-3.5 fill-current" />{book.averageRating.toLocaleString("ar-EG")} من {book.reviewCount.toLocaleString("ar-EG")} مراجعة موثقة</p> : null}<p className="mt-3 min-h-12 text-sm leading-7 text-stone-600">{book.shortDescription || book.description || "اكتشف تفاصيل هذا الكتاب الرقمي من صفحته."}</p><div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-5"><strong className="flex items-center gap-1 text-lg text-[#50427b]"><CircleDollarSign className="h-4 w-4" />{Number(book.price) === 0 ? "مجاني" : `${Number(book.price).toLocaleString("ar-EG")} ${book.currencyCode}`}</strong><Button asChild className="rounded-xl bg-[#50427b] hover:bg-[#42355f]"><Link href={`/كتب-رقمية/${book.productHandle}`}>تفاصيل وشراء<ArrowLeft className="mr-1.5 h-4 w-4" /></Link></Button></div></div>
        </article>) : <div className="col-span-full rounded-3xl border border-dashed border-stone-300 bg-[#fffdf8] px-6 py-16 text-center"><BookOpen className="mx-auto h-8 w-8 text-[#50427b]" /><h2 className="mt-4 text-xl font-black text-[#173c37]">لا توجد نتائج مطابقة</h2><p className="mt-2 text-sm text-stone-500">جرّب تغيير عبارة البحث أو السعر أو التصنيف.</p>{hasActiveFilters && <Button type="button" variant="outline" onClick={clearFilters} className="mt-5 rounded-xl">عرض كل الكتب</Button>}</div>}
      </div>
      {totalPages > 1 && <nav aria-label="ترقيم صفحات الكتب" className="mt-10 flex flex-wrap items-center justify-center gap-2"><Button type="button" variant="outline" onClick={() => setPage(current => Math.max(1, current - 1))} disabled={page === 1} className="rounded-xl"><ChevronRight className="ml-1 h-4 w-4" />السابق</Button>{Array.from({ length: totalPages }, (_, index) => index + 1).filter(value => value === 1 || value === totalPages || Math.abs(value - page) <= 1).map(value => <Button key={value} type="button" variant={value === page ? "default" : "outline"} onClick={() => setPage(value)} className={`h-10 min-w-10 rounded-xl ${value === page ? "bg-[#50427b]" : "border-[#d9d4ed] text-[#50427b]"}`}>{value.toLocaleString("ar-EG")}</Button>)}<Button type="button" variant="outline" onClick={() => setPage(current => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="rounded-xl">التالي<ChevronLeft className="mr-1 h-4 w-4" /></Button></nav>}
      <section className="mt-12 rounded-3xl bg-[#173c37] p-7 text-white"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-extrabold tracking-[0.14em] text-[#f4c96b]">قراءة بثقة</p><h2 className="mt-2 text-2xl font-black">كل كتاب يصل إلى مكتبتك بعد إتمام الطلب</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-stone-200">يمكنك قراءة العينة أولًا عند توفرها، ثم العودة إلى موضعك المحفوظ من أي جهاز بعد منح الصلاحية.</p></div><div className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm"><Star className="h-4 w-4 text-[#f4c96b]" />مراجعات من قراء موثّقين</div></div></section>
    </main>
  </StoreLayout>;
}
