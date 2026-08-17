import { afterEach, describe, expect, it } from "vitest";
import { createLocalProductOrder, setDbForTesting } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const admin: NonNullable<TrpcContext["user"]> = { id: 1, openId: "local-product-admin", name: "Admin", email: "admin@example.com", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const productInput = { handle: "wireless-headphones", title: "سماعات لاسلكية", description: "صوت واضح", category: "أجهزة" as const, tags: "صوت، جديد", price: 899.5, currencyCode: "EGP", inventory: 8, isAvailable: true };

describe("local product direct management", () => {
  afterEach(() => setDbForTesting(null));

  it("allows an admin to create, edit, and remove a product with server-side price and inventory values", async () => {
    const writes: Array<{ kind: string; values?: Record<string, unknown> }> = [];
    const fakeDb = {
      insert: () => ({ values: async (values: Record<string, unknown>) => { writes.push({ kind: "insert", values }); } }),
      update: () => ({ set: (values: Record<string, unknown>) => ({ where: async () => { writes.push({ kind: "update", values }); } }) }),
      delete: () => ({ where: async () => { writes.push({ kind: "delete" }); } }),
    };
    setDbForTesting(fakeDb as never);
    const caller = appRouter.createCaller({ user: admin, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
    await caller.localProducts.create(productInput);
    await caller.localProducts.update({ productId: 3, ...productInput, price: 749, inventory: 5, isAvailable: false });
    await caller.localProducts.remove({ productId: 3, confirmed: true });

    expect(writes).toContainEqual({ kind: "insert", values: expect.objectContaining({ price: "899.50", inventory: 8, isAvailable: 1, currencyCode: "EGP" }) });
    expect(writes).toContainEqual({ kind: "update", values: expect.objectContaining({ price: "749.00", inventory: 5, isAvailable: 0 }) });
    expect(writes).toContainEqual({ kind: "delete" });
  });

  it("creates a local order using the product price and decrements its stored inventory", async () => {
    const inserts: Array<Record<string, unknown>> = [];
    const updates: Array<Record<string, unknown>> = [];
    const product = { id: 9, handle: "wireless-headphones", title: "سماعات لاسلكية", category: "أجهزة", price: "1299.00", currencyCode: "EGP", inventory: 5, isAvailable: 1, imageUrl: "https://example.com/product.webp" };
    let insertCount = 0;
    const tx = {
      select: () => ({ from: () => ({ where: () => ({ limit: async () => [product] }) }) }),
      insert: () => ({ values: async (values: Record<string, unknown>) => { insertCount += 1; inserts.push(values); return insertCount === 1 ? [{ insertId: 44 }] : undefined; } }),
      update: () => ({ set: (values: Record<string, unknown>) => ({ where: async () => { updates.push(values); return [{ affectedRows: 1 }]; } }) }),
    };
    setDbForTesting({ transaction: async (callback: (database: typeof tx) => Promise<unknown>) => callback(tx) } as never);
    const order = await createLocalProductOrder({ productId: 9, userId: 3, customerName: "عميل", customerPhone: "01111111111", shippingAddress: "العنوان بالتفصيل", country: "مصر", city: "القاهرة", paymentMethod: "فودافون كاش" });

    expect(order).toEqual(expect.objectContaining({ orderId: 44, total: "1299.00", currencyCode: "EGP" }));
    expect(inserts[0]).toEqual(expect.objectContaining({ total: "1299.00", currencyCode: "EGP", userId: 3 }));
    expect(inserts[1]).toEqual(expect.objectContaining({ unitPrice: "1299.00", lineTotal: "1299.00", productHandle: "wireless-headphones", imageUrl: "https://example.com/product.webp" }));
    expect(updates).toContainEqual({ inventory: 4 });
  });
});
