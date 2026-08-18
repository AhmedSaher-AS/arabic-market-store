import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const customer: NonNullable<TrpcContext["user"]> = {
  id: 12, openId: "local-book-customer", name: "Customer", email: "customer@example.com", loginMethod: "manus", role: "user",
  createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
};

describe("local digital book pricing access", () => {
  it("requires login before a customer can create a local digital-book order", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
    await expect(caller.digitalBooks.purchase({ bookId: 1, customerName: "عميل تجريبي", customerPhone: "01111111111", paymentMethod: "فودافون كاش" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("prevents a customer from changing the local digital-book price or availability", async () => {
    const caller = appRouter.createCaller({ user: customer, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
    await expect(caller.digitalBooks.updateDetails({ bookId: 1, title: "كتاب", description: "وصف", price: 99, currencyCode: "EGP", isAvailable: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("prevents a customer from replacing or deleting a digital-book cover", async () => {
    const caller = appRouter.createCaller({ user: customer, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
    await expect(caller.digitalBooks.updateCover({ bookId: 1, removeCover: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
