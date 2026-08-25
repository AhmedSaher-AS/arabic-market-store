import { describe, expect, it } from "vitest";
import { formatSafePurchaseError, validatePurchaseIdentity } from "./purchaseValidation";

describe("validatePurchaseIdentity", () => {
  it("rejects a short customer name with Arabic guidance", () => {
    expect(validatePurchaseIdentity("أ", "01111111111")).toEqual({ ok: false, message: "اكتب الاسم الكامل من 3 أحرف على الأقل قبل متابعة الطلب." });
  });

  it("normalizes a valid identity before it is sent", () => {
    expect(validatePurchaseIdentity("  أحمد  علي ", "+20 11 1111 1111")).toEqual({ ok: true, customerName: "أحمد علي", customerPhone: "01111111111" });
  });

  it("never returns raw validation JSON to the customer", () => {
    expect(formatSafePurchaseError(new Error('[{"code":"too_small","path":["customerName"]}]'))).toBe("راجع الاسم ورقم الهاتف ثم حاول مرة أخرى.");
  });
});
