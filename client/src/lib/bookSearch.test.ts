import { describe, expect, it } from "vitest";
import { getBookSuggestions, normalizeArabicSearch } from "./bookSearch";

const books = [
  { id: 1, title: "أسرار التحقيق", author: "أحمد", category: "غموض", shortDescription: "دليل عملي", description: "كتاب في أساليب التحقيق", productHandle: "investigation", coverUrl: null },
  { id: 2, title: "مبادئ القراءة", author: "سارة", category: "تعليم", shortDescription: "للمبتدئين", description: "كتاب مبسط", productHandle: "reading", coverUrl: null },
  { id: 3, title: "التحقيق الجنائي", author: "ليلى", category: "غموض", shortDescription: "ملف قضايا", description: "مدخل إلى التحقيق", productHandle: "criminal", coverUrl: null },
];

describe("بحث الكتب العربي", () => {
  it("يوحّد اختلافات الأحرف العربية أثناء البحث", () => {
    expect(normalizeArabicSearch("إلى هُنا")) .toBe("الي هنا");
    expect(normalizeArabicSearch("مبادئ")) .toBe(normalizeArabicSearch("مبادىء"));
  });

  it("يعيد الاقتراحات المطابقة ويقدّم العنوان الذي يبدأ بالكلمة", () => {
    expect(getBookSuggestions(books, "تحقيق").map(book => book.id)).toEqual([3, 1]);
    expect(getBookSuggestions(books, "سارة").map(book => book.id)).toEqual([2]);
    expect(getBookSuggestions(books, "ا")).toEqual([]);
  });
});
