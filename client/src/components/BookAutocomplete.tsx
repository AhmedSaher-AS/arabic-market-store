import { Input } from "@/components/ui/input";
import { getBookSuggestions } from "@/lib/bookSearch";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { BookOpen, LoaderCircle, Search, Sparkles } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type BookAutocompleteProps = {
  className?: string;
  defaultValue?: string;
  autoFocus?: boolean;
  onSearch?: (query: string) => void;
};

export function BookAutocomplete({ className, defaultValue = "", autoFocus = false, onSearch }: BookAutocompleteProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { data: books = [], isLoading } = trpc.digitalBooks.catalog.useQuery();
  const suggestions = useMemo(() => getBookSuggestions(books, query), [books, query]);

  useEffect(() => { setQuery(defaultValue); }, [defaultValue]);
  useEffect(() => { setActiveIndex(-1); }, [query]);

  const submitSearch = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const selected = activeIndex >= 0 ? suggestions[activeIndex] : undefined;
    if (selected) {
      setLocation(`/كتب-رقمية/${selected.productHandle}`);
      setOpen(false);
      return;
    }
    const term = query.trim();
    if (!term) return;
    onSearch?.(term);
    if (!onSearch) setLocation(`/بحث?q=${encodeURIComponent(term)}`);
    setOpen(false);
  };

  const handleKeys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && suggestions.length) { event.preventDefault(); setOpen(true); setActiveIndex(current => (current + 1) % suggestions.length); }
    if (event.key === "ArrowUp" && suggestions.length) { event.preventDefault(); setOpen(true); setActiveIndex(current => current <= 0 ? suggestions.length - 1 : current - 1); }
    if (event.key === "Escape") { setOpen(false); setActiveIndex(-1); }
  };

  const showSuggestions = open && query.trim().length >= 2;
  return <div className={cn("relative", className)}>
    <form onSubmit={submitSearch} className="relative">
      <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b76f2c]" />
      <Input value={query} onChange={event => setQuery(event.target.value)} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 140)} onKeyDown={handleKeys} autoFocus={autoFocus} placeholder="ابحث عن كتاب أو مؤلف…" role="combobox" aria-autocomplete="list" aria-expanded={showSuggestions} aria-controls="book-search-suggestions" className="h-11 rounded-xl border-[#d9d4ed] bg-white pr-10 text-right text-sm shadow-sm transition-shadow focus-visible:border-[#b76f2c] focus-visible:ring-[#b76f2c]/20" />
      <span className="pointer-events-none absolute left-3 top-1/2 hidden -translate-y-1/2 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-400 lg:block">↵</span>
    </form>
    {showSuggestions && <div id="book-search-suggestions" role="listbox" className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-[#d9d4ed] bg-white p-2 shadow-[0_18px_45px_rgba(23,60,55,0.16)]">{isLoading ? <div className="flex items-center gap-2 px-3 py-4 text-sm text-stone-500"><LoaderCircle className="h-4 w-4 animate-spin" />جارٍ تجهيز الاقتراحات…</div> : suggestions.length ? <><p className="px-3 pb-2 pt-1 text-[11px] font-extrabold tracking-wide text-[#b76f2c]">كتب مقترحة</p>{suggestions.map((book, index) => <button key={book.id} type="button" role="option" aria-selected={activeIndex === index} onMouseDown={() => { setLocation(`/كتب-رقمية/${book.productHandle}`); setOpen(false); }} className={cn("flex w-full items-center gap-3 rounded-xl p-2.5 text-right transition-colors", activeIndex === index ? "bg-[#f2effa]" : "hover:bg-[#f8f5ee]")}>{book.coverUrl ? <img src={book.coverUrl} alt="" className="h-11 w-9 rounded-lg object-cover" /> : <span className="grid h-11 w-9 shrink-0 place-items-center rounded-lg bg-[#ebe8f5] text-[#50427b]"><BookOpen className="h-4 w-4" /></span>}<span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#173c37]">{book.title}</strong><span className="mt-0.5 block truncate text-xs text-stone-500">{[book.author, book.category].filter(Boolean).join(" · ") || "كتاب رقمي"}</span></span><BookOpen className="h-4 w-4 shrink-0 text-[#b76f2c]" /></button>)}</> : <div className="flex items-center gap-2 px-3 py-4 text-sm text-stone-500"><Sparkles className="h-4 w-4 text-[#b76f2c]" />لا توجد اقتراحات مباشرة؛ اضغط إدخال للبحث الموسع.</div>}</div>}
  </div>;
}
