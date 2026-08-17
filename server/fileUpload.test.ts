import { describe, expect, it } from "vitest";
import { parseBase64Upload, safeFileStem } from "./fileUpload";

describe("parseBase64Upload", () => {
  it("accepts an allowed image payload and returns its bytes", () => {
    const uploaded = parseBase64Upload("data:image/png;base64,aGVsbG8=", ["image/png"], 32);
    expect(uploaded.contentType).toBe("image/png");
    expect(uploaded.content.toString()).toBe("hello");
  });

  it("rejects a proof upload with a disallowed file type", () => {
    expect(() => parseBase64Upload("data:application/pdf;base64,aGVsbG8=", ["image/png"], 32)).toThrow("نوع الملف غير مسموح");
  });

  it("normalizes a storage-safe file stem", () => {
    expect(safeFileStem("Receipt May 2026 (Final).png")).toBe("receipt-may-2026-final-png");
  });
});
