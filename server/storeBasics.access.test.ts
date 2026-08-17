import { afterEach, describe, expect, it } from "vitest";
import { setDbForTesting } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const customer: NonNullable<TrpcContext["user"]> = { id: 21, openId: "store-basics-user", name: "Customer", email: "customer@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const admin: NonNullable<TrpcContext["user"]> = { ...customer, id: 22, role: "admin" };
const context = (user: TrpcContext["user"]) => ({ user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });

describe("store basics access and server pricing", () => {
  afterEach(() => setDbForTesting(null));
  it("requires customer login for saved addresses and admin privileges for shipping management", async () => {
    const anonymous = appRouter.createCaller(context(null)); const userCaller = appRouter.createCaller(context(customer));
    await expect(anonymous.storeBasics.addresses.mine()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(userCaller.storeBasics.shipping.adminList()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("calculates the price from product, shipping, and coupon data stored on the server", async () => {
    const product = { id: 9, title: "حقيبة", price: "200.00", currencyCode: "EGP", inventory: 5, isAvailable: 1 };
    const zone = { id: 1, city: "القاهرة", label: "القاهرة الكبرى", amount: "30.00", currencyCode: "EGP", isActive: 1, estimatedDays: "2-3 أيام" };
    const coupon = { id: 3, code: "SAVE10", discountType: "نسبة" as const, value: "10.00", minimumAmount: "100.00", maxUses: 0, usedCount: 0, isActive: 1, expiresAt: null };
    const rows = [[product], [zone], [coupon]]; let index = 0;
    const tx = { select: () => ({ from: () => ({ where: () => ({ limit: async () => rows[index++] }) }) }) };
    const fakeDb = { transaction: async (work: (connection: typeof tx) => Promise<unknown>) => work(tx) };
    setDbForTesting(fakeDb as never);
    const result = await appRouter.createCaller(context(null)).storeBasics.shipping.quote({ productId: 9, city: "القاهرة", quantity: 2, couponCode: "save10" });
    expect(result).toMatchObject({ subtotal: "400.00", discountAmount: "40.00", shippingAmount: "30.00", total: "390.00", currencyCode: "EGP", couponCode: "SAVE10" });
  });

  it("allows an admin context to access operational reports", async () => {
    const fakeDb = { select: () => ({ from: () => Promise.resolve([]) }) };
    setDbForTesting(fakeDb as never);
    await expect(appRouter.createCaller(context(admin)).storeBasics.operations()).resolves.toMatchObject({ orders: 0, revenue: "0.00" });
  });
});
