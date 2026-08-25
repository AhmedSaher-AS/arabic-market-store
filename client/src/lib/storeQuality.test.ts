import { describe, expect, it } from "vitest";
import { auditDigitalBooks } from "./storeQuality";

describe("auditDigitalBooks", () => {
  it("flags missing critical book files and SEO fields", () => {
    const audit = auditDigitalBooks([{ id: 1, title: "قصير", productHandle: "short", description: "", shortDescription: "", author: "", category: "عام", pageCount: 0, tags: "", coverUrl: null, pdfKey: null, isAvailable: true }]);
    expect(audit.criticalCount).toBe(1);
    expect(audit.warningCount).toBeGreaterThan(4);
    expect(audit.score).toBeLessThan(60);
  });

  it("keeps a complete published book free from quality issues", () => {
    const audit = auditDigitalBooks([{ id: 2, title: "رواية تحقيق عربية متكاملة", productHandle: "arabic-mystery", description: "وصف أصلي ومفصل للكتاب يشرح الفكرة والشخصيات والأجواء وتجربة القراءة الرقمية بما يمنح القارئ معلومات كافية قبل اتخاذ قرار الشراء والاستمتاع بالكتاب داخل مكتبته.", shortDescription: "ملخص قصير وواضح يشرح تجربة القراءة ويشجع القارئ على اكتشاف الكتاب.", author: "مؤلف عربي", category: "تحقيق", pageCount: 220, tags: "تحقيق، غموض، رواية", coverUrl: "https://example.com/cover.jpg", pdfKey: "digital-books/book.pdf", isAvailable: true }]);
    expect(audit).toMatchObject({ criticalCount: 0, warningCount: 0, score: 100, liveBooks: 1 });
  });
});
