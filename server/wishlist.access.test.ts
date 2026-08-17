import { afterEach, describe, expect, it } from "vitest";
import { setDbForTesting } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const customer: NonNullable<TrpcContext["user"]> = { id: 14, openId: "wishlist-customer", name: "Customer", email: "customer@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const favorite = { itemType: "منتج" as const, itemId: 7, title: "سماعات", subtitle: "أجهزة", price: 899, currencyCode: "EGP", targetPath: "/متجر-مستقل?product=7" };

describe("wishlist access and persistence", () => {
  afterEach(() => setDbForTesting(null));

  it("requires login to read or change saved favorites", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
    await expect(caller.wishlist.mine()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.wishlist.save(favorite)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("saves, lists, and removes only the authenticated user's favorite", async () => {
    const writes: Record<string, unknown>[] = []; const removals: unknown[] = [];
    const item = { id: 2, userId: 14, ...favorite, price: "899.00", currencyCode: "EGP", imageUrl: null, createdAt: new Date() };
    const fakeDb = {
      select: () => ({ from: () => ({ where: () => ({ orderBy: async () => [item] }) }) }),
      insert: () => ({ values: (values: Record<string, unknown>) => ({ onDuplicateKeyUpdate: async () => { writes.push(values); } }) }),
      delete: () => ({ where: async (condition: unknown) => { removals.push(condition); } }),
    };
    setDbForTesting(fakeDb as never);
    const caller = appRouter.createCaller({ user: customer, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
    await caller.wishlist.save(favorite);
    const mine = await caller.wishlist.mine();
    await caller.wishlist.remove({ itemType: "منتج", itemId: 7 });

    expect(writes).toContainEqual(expect.objectContaining({ userId: 14, itemId: 7, price: "899.00", targetPath: "/متجر-مستقل?product=7" }));
    expect(mine).toEqual([item]);
    expect(removals).toHaveLength(1);
  });
});
