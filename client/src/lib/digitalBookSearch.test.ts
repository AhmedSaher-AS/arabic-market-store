import { describe, expect, it } from "vitest";
import { normalizeArabicSearch } from "./digitalBookSearch";

describe("normalizeArabicSearch", () => {
  it("يوحّد صور الحروف العربية الشائعة عند البحث", () => {
    expect(normalizeArabicSearch("الأميرال العائم")).toBe(normalizeArabicSearch("الاميرال العايم"));
    expect(normalizeArabicSearch("رِوايةــ")).toBe("روايه");
  });
});
