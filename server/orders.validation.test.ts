import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { orderDraftSchema } from "./routers/orders";
import type { TrpcContext } from "./_core/context";

const validDraft = {
  cartId: "gid://shopify/Cart/example",
  customerName: "أحمد علي",
  customerPhone: "01012345678",
  shippingAddress: "10 شارع النيل، الدقي",
  country: "مصر",
  city: "القاهرة",
  paymentMethod: "فودافون كاش",
};

describe("orderDraftSchema", () => {
  it("accepts one of the four supported payment methods and complete delivery data", () => {
    expect(orderDraftSchema.parse(validDraft)).toMatchObject(validDraft);
  });

  it("rejects unsupported payment methods and incomplete addresses", () => {
    expect(orderDraftSchema.safeParse({ ...validDraft, paymentMethod: "تحويل غير معتمد" }).success).toBe(false);
    expect(orderDraftSchema.safeParse({ ...validDraft, shippingAddress: "قصير" }).success).toBe(false);
  });
});

describe("order access control", () => {
  it("rejects anonymous attempts to create an order before touching commerce data", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    await expect(caller.orders.create(validDraft)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects a normal customer attempting to update an order status", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 7,
        openId: "customer-7",
        name: "Customer",
        email: "customer@example.com",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    await expect(caller.orders.updateStatus({ orderId: 1, status: "مؤكد" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
