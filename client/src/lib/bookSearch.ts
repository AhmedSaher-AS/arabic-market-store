export type BookSearchCandidate = {
  id: number;
  title: string;
  author: string;
  category: string;
  shortDescription: string;
  description: string;
  productHandle: string;
  coverUrl?: string | null;
};

export function normalizeArabicSearch(value: string) {
  return value.toLocaleLowerCase("ar").normalize("NFD").replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/ء/g, "").trim();
}

export function getBookSuggestions<T extends BookSearchCandidate>(books: T[], query: string, limit = 6) {
  const term = normalizeArabicSearch(query);
  if (term.length < 2) return [];
  const startsWithTerm = (title: string) => {
    const normalizedTitle = normalizeArabicSearch(title);
    return normalizedTitle.startsWith(term) || normalizedTitle.startsWith(`ال${term}`);
  };
  return books.map(book => ({ book, haystack: normalizeArabicSearch(`${book.title} ${book.author} ${book.category} ${book.shortDescription} ${book.description}`) }))
    .filter(item => item.haystack.includes(term))
    .sort((a, b) => Number(startsWithTerm(b.book.title)) - Number(startsWithTerm(a.book.title)) || a.book.title.localeCompare(b.book.title, "ar"))
    .slice(0, limit)
    .map(item => item.book);
}
