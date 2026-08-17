import { afterEach, describe, expect, it } from "vitest";
import { listOrderTrackingForUser, setDbForTesting } from "./db";

describe("listOrderTrackingForUser", () => {
  afterEach(() => setDbForTesting(null));

  it("combines the customer order, payment proof, and digital entitlement without exposing another user's data", async () => {
    let selectCall = 0;
    const order = { id: 11, userId: 5, orderNumber: "SA-TRACK", paymentStatus: "مدفوع" };
    const proof = { id: 3, orderId: 11, userId: 5, status: "مقبول" };
    const grantedBook = { entitlement: { id: 7, userId: 5, digitalBookId: 22, orderId: 11 }, book: { id: 22, title: "كتاب رقمي", productHandle: "digital-book" } };
    const fakeDb = {
      select: () => {
        selectCall += 1;
        if (selectCall === 1) return { from: () => ({ where: () => ({ orderBy: async () => [order] }) }) };
        if (selectCall === 2) return { from: () => ({ where: async () => [proof] }) };
        return { from: () => ({ innerJoin: () => ({ where: async () => [grantedBook] }) }) };
      },
    };
    setDbForTesting(fakeDb as never);

    await expect(listOrderTrackingForUser(5)).resolves.toEqual([{ order, proof, books: [grantedBook] }]);
  });
});
