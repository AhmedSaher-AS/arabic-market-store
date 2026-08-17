import { afterEach, describe, expect, it } from "vitest";
import { reviewPaymentProof, setDbForTesting } from "./db";

describe("reviewPaymentProof", () => {
  afterEach(() => setDbForTesting(null));

  it("marks an approved payment as paid and grants the purchased digital book", async () => {
    const updates: Array<Record<string, unknown>> = [];
    let granted: unknown = null;
    const proof = { id: 4, orderId: 32, userId: 9 };

    const tx = {
      update: () => ({ set: (values: Record<string, unknown>) => ({ where: async () => { updates.push(values); } }) }),
      select: () => ({ from: () => ({ innerJoin: () => ({ where: async () => [{ bookId: 18 }] }) }) }),
      insert: () => ({ values: (values: unknown) => ({ onDuplicateKeyUpdate: async () => { granted = values; } }) }),
    };
    const fakeDb = {
      select: () => ({ from: () => ({ where: () => ({ limit: async () => [proof] }) }) }),
      transaction: async (callback: (database: typeof tx) => Promise<void>) => callback(tx),
    };

    setDbForTesting(fakeDb as never);
    await reviewPaymentProof(4, true, "تمت المطابقة");

    expect(updates).toContainEqual(expect.objectContaining({ status: "مقبول" }));
    expect(updates).toContainEqual(expect.objectContaining({ paymentStatus: "مدفوع", status: "مؤكد" }));
    expect(granted).toEqual([{ userId: 9, digitalBookId: 18, orderId: 32 }]);
  });
});
