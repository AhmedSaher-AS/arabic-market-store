export type QualityBook = {
  id: number;
  title: string;
  productHandle: string;
  description?: string | null;
  shortDescription?: string | null;
  author?: string | null;
  category?: string | null;
  pageCount?: number | null;
  tags?: string | null;
  coverUrl?: string | null;
  pdfKey?: string | null;
  isAvailable: boolean | number;
};

export type QualityIssue = {
  bookId: number;
  bookTitle: string;
  severity: "critical" | "warning";
  title: string;
  detail: string;
};

const textLength = (value?: string | null) => value?.trim().length ?? 0;

/** فحص مجاني وحتمي لجاهزية الكتب للعرض والفهرسة، بلا استدعاء AI أو خدمة خارجية. */
export function auditDigitalBooks(books: QualityBook[]) {
  const issues: QualityIssue[] = [];
  for (const book of books) {
    const live = Boolean(book.isAvailable);
    if (!book.pdfKey) issues.push({ bookId: book.id, bookTitle: book.title, severity: "critical", title: "ملف الكتاب غير مكتمل", detail: "ارفع ملف PDF صالحًا قبل إتاحة الكتاب للقراء." });
    if (live && !book.coverUrl) issues.push({ bookId: book.id, bookTitle: book.title, severity: "warning", title: "الغلاف مفقود", detail: "أضف غلافًا واضحًا لتحسين الثقة ونسبة فتح صفحة الكتاب." });
    if (textLength(book.title) < 8) issues.push({ bookId: book.id, bookTitle: book.title, severity: "warning", title: "عنوان قصير", detail: "استخدم عنوانًا وصفيًا من 8 أحرف أو أكثر ليسهل اكتشاف الكتاب." });
    if (textLength(book.description) < 140) issues.push({ bookId: book.id, bookTitle: book.title, severity: "warning", title: "الوصف يحتاج توسعة", detail: "اكتب وصفًا أصليًا من 140 حرفًا على الأقل لتحسين صفحة الكتاب وفهم محركات البحث." });
    if (textLength(book.shortDescription) < 45) issues.push({ bookId: book.id, bookTitle: book.title, severity: "warning", title: "الملخص القصير ناقص", detail: "أضف ملخصًا قصيرًا واضحًا لبطاقات الاكتشاف والمشاركة." });
    if (!textLength(book.author)) issues.push({ bookId: book.id, bookTitle: book.title, severity: "warning", title: "اسم المؤلف غير مضاف", detail: "أضف اسم المؤلف لتحسين بيانات الكتاب وثقة القارئ." });
    if (!textLength(book.tags)) issues.push({ bookId: book.id, bookTitle: book.title, severity: "warning", title: "لا توجد وسوم", detail: "أضف وسومًا عربية دقيقة لتسهيل البحث والتصنيفات." });
    if (live && !Number(book.pageCount)) issues.push({ bookId: book.id, bookTitle: book.title, severity: "warning", title: "عدد الصفحات غير محدد", detail: "أضف عدد صفحات الكتاب لإكمال معلومات العرض." });
  }
  const criticalCount = issues.filter(issue => issue.severity === "critical").length;
  const warningCount = issues.length - criticalCount;
  return {
    issues,
    criticalCount,
    warningCount,
    liveBooks: books.filter(book => Boolean(book.isAvailable)).length,
    score: Math.max(0, 100 - criticalCount * 35 - warningCount * 7),
  };
}
