import { describe, expect, it, vi } from "vitest";

const getAvailableDigitalBookByHandle = vi.fn();
const listAvailableDigitalBooks = vi.fn();

vi.mock("./db", () => ({ getAvailableDigitalBookByHandle, listAvailableDigitalBooks }));

const { renderDynamicSitemap, renderPublishedBookForIndexing } = await import("./bookIndexing");

const book = {
  id: 7,
  productHandle: "رواية_تحقيق",
  title: "رواية الأميرال العائم",
  shortDescription: "رواية غموض وتحقيق متاحة بصيغة PDF.",
  description: "وصف كامل أصلي للرواية الرقمية.",
  author: "أجاثا كريستي",
  language: "العربية",
  pageCount: 250,
  category: "غموض",
  price: "50.00",
  currencyCode: "EGP",
  coverUrl: "/manus-storage/cover.jpg",
  isAvailable: 1,
  updatedAt: new Date("2026-08-19T00:00:00.000Z"),
};

describe("book indexing output", () => {
  it("renders a crawler-visible title, description, canonical URL, and book body for a published book", async () => {
    getAvailableDigitalBookByHandle.mockResolvedValue(book);

    const page = await renderPublishedBookForIndexing("/كتب-رقمية/رواية_تحقيق");

    expect(page?.status).toBe(200);
    expect(page?.head).toContain("رواية الأميرال العائم PDF | سوقك العربي");
    expect(page?.head).toContain("https://arabicshop-p2xmxzpy.manus.space/كتب-رقمية/%D8%B1%D9%88%D8%A7%D9%8A%D8%A9_%D8%AA%D8%AD%D9%82%D9%8A%D9%82");
    expect(page?.body).toContain("وصف كامل أصلي للرواية الرقمية.");
  });

  it("adds every published book to the generated sitemap without hard-coded handles", async () => {
    listAvailableDigitalBooks.mockResolvedValue([book, { ...book, id: 8, productHandle: "كتاب_جديد", title: "كتاب جديد" }]);

    const sitemap = await renderDynamicSitemap();

    expect(sitemap).toContain(encodeURIComponent("رواية_تحقيق"));
    expect(sitemap).toContain(encodeURIComponent("كتاب_جديد"));
    expect(sitemap).toContain("<lastmod>2026-08-19</lastmod>");
  });
});
