import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const customer = {
  id: 9,
  openId: "customer-9",
  name: "Customer",
  email: "customer@example.com",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function callerFor(user: TrpcContext["user"]) {
  return appRouter.createCaller({ user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
}

describe("digital payments access control", () => {
  it("requires authentication before accepting a proof upload", async () => {
    await expect(callerFor(null).payments.uploadProof({
      orderId: 1,
      dataUrl: "data:image/png;base64,aGVsbG8=",
      fileName: "receipt.png",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication before reading a protected digital book", async () => {
    await expect(callerFor(null).digitalBooks.reader({ productHandle: "secure-book" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("prevents a customer from uploading or deleting books and reviewing payment proofs", async () => {
    const caller = callerFor(customer);
    await expect(caller.digitalBooks.upload({
      productHandle: "secure-book",
      title: "كتاب محمي",
      fileName: "book.pdf",
      dataUrl: "data:application/pdf;base64,aGVsbG8=",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.digitalBooks.remove({ bookId: 1, confirmed: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.payments.reviewProof({ proofId: 1, accepted: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
