import { describe, expect, it } from "vitest";
import { isPaymentProofAmountAccepted, paymentProofTolerance } from "./paymentProofAmount";

describe("مطابقة مبلغ إثبات السداد", () => {
  it("يسمح بهامش مراجعة أصغرُه خمسة جنيهات أو واحد بالمئة", () => {
    expect(paymentProofTolerance(100)).toBe(5);
    expect(paymentProofTolerance(1000)).toBe(10);
    expect(isPaymentProofAmountAccepted(1000, 1009.5)).toBe(true);
    expect(isPaymentProofAmountAccepted(1000, 1011)).toBe(false);
  });

  it("يرفض المبالغ غير الصالحة", () => {
    expect(isPaymentProofAmountAccepted(100, 0)).toBe(false);
    expect(isPaymentProofAmountAccepted(100, Number.NaN)).toBe(false);
  });
});
