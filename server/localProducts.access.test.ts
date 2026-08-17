import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const customer: NonNullable<TrpcContext["user"]> = { id: 21, openId: "local-product-customer", name: "Customer", email: "customer@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const request = {} as TrpcContext["req"];
const response = {} as TrpcContext["res"];
const productInput = { handle: "wireless-headphones", title: "سماعات لاسلكية", description: "وصف المنتج", category: "أجهزة" as const, tags: "صوت", price: 899, currencyCode: "EGP", inventory: 3, isAvailable: true };

describe("local product administration access", () => {
  it("requires login before a local product order can be created", async () => {
    const caller = appRouter.createCaller({ user: null, req: request, res: response });
    await expect(caller.localProducts.purchase({ productId: 1, customerName: "عميل تجريبي", customerPhone: "01111111111", shippingAddress: "شارع تجريبي، القاهرة", country: "مصر", city: "القاهرة", paymentMethod: "فودافون كاش" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("prevents a normal customer from creating, editing, or deleting local products", async () => {
    const caller = appRouter.createCaller({ user: customer, req: request, res: response });
    await expect(caller.localProducts.create(productInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.localProducts.update({ productId: 1, ...productInput })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.localProducts.remove({ productId: 1, confirmed: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
