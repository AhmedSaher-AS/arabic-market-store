import { afterEach, describe, expect, it } from "vitest";
import { getReadingProgress, saveReadingProgress, setDbForTesting } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("reading progress", () => {
  afterEach(() => setDbForTesting(null));

  it("stores and restores the last page without accessing production data", async () => {
    const writes: unknown[] = [];
    const fakeDb = {
      insert: () => ({ values: (value: unknown) => ({ onDuplicateKeyUpdate: async () => { writes.push(value); } }) }),
      select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ lastPage: 37 }] }) }) }),
    };
    setDbForTesting(fakeDb as never);
    await saveReadingProgress(5, 12, 37);
    await expect(getReadingProgress(5, 12)).resolves.toBe(37);
    expect(writes).toEqual([{ userId: 5, digitalBookId: 12, lastPage: 37 }]);
  });
});

describe("WhatsApp settings validation", () => {
  it("rejects an invalid WhatsApp number before changing payment settings", async () => {
    const admin: NonNullable<TrpcContext["user"]> = {
      id: 1, openId: "admin", name: "Admin", email: "admin@example.com", loginMethod: "manus", role: "admin",
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    };
    const caller = appRouter.createCaller({ user: admin, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
    await expect(caller.payments.updateSettings({
      vodafoneCashNumber: "01000000000", vodafoneCashRecipient: "مالك المتجر", fawryMode: "معطّل", fawryMerchantLabel: "", fawryServiceCode: "", fawryInstructions: "", whatsappNumber: "غير صالح",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
