import { describe, expect, it } from "vitest";
import { buildRevenueTimeline } from "./operationsTimeline";

describe("سلسلة مبيعات المدير", () => {
  it("تجمع الطلبات المدفوعة أو المكتملة داخل أيامها فقط", () => {
    const timeline = buildRevenueTimeline([
      { createdAt: new Date("2026-08-20T10:00:00Z"), total: "50.00", paymentStatus: "مدفوع", status: "مؤكد" },
      { createdAt: new Date("2026-08-20T11:00:00Z"), total: "70.00", paymentStatus: "بانتظار الدفع", status: "مكتمل" },
      { createdAt: new Date("2026-08-20T12:00:00Z"), total: "99.00", paymentStatus: "بانتظار الدفع", status: "معلق" },
    ], new Date("2026-08-22T12:00:00Z"), 3);
    expect(timeline[0]).toMatchObject({ date: "2026-08-20", revenue: 120, orders: 2 });
  });
});
