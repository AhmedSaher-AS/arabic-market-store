import { describe, expect, it } from "vitest";
import { getSmartValidationMessage } from "./validationMessages";

describe("getSmartValidationMessage", () => {
  it("converts technical customer-name validation into Arabic guidance", () => {
    expect(getSmartValidationMessage([{ code: "too_small", path: ["customerName"] }])).toBe("اكتب الاسم الكامل من 3 أحرف على الأقل.");
  });

  it("returns undefined for unrelated validation fields", () => {
    expect(getSmartValidationMessage([{ code: "invalid_type", path: ["unknown"] }])).toBeUndefined();
  });
});
