import { afterEach, describe, expect, it } from "vitest";
import { setDbForTesting, upsertDigitalBook } from "./db";

describe("upsertDigitalBook", () => {
  afterEach(() => setDbForTesting(null));

  it("returns the saved book so the upload interface can confirm publication", async () => {
    const savedBook = { id: 41, productHandle: "arabic-investigation", title: "دليل التحقيق", isAvailable: 1 };
    const fakeDb = {
      insert: () => ({ values: () => ({ onDuplicateKeyUpdate: async () => undefined }) }),
      select: () => ({ from: () => ({ where: () => ({ limit: async () => [savedBook] }) }) }),
    };
    setDbForTesting(fakeDb as never);

    const result = await upsertDigitalBook({
      productHandle: "arabic-investigation", title: "دليل التحقيق", description: "", shortDescription: "", author: "", language: "العربية", pageCount: 10, category: "عام", tags: "", tableOfContents: null,
      price: "25.00", currencyCode: "EGP", isAvailable: 1, fileName: "book.pdf", pdfKey: "digital-books/book.pdf", pdfUrl: "/manus-storage/book.pdf",
    });

    expect(result).toEqual(savedBook);
  });
});
