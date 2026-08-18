import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { setDbForTesting } from "./db";

const storagePut = vi.fn().mockResolvedValue({ key: "digital-book-covers/5-cover.png", url: "/manus-storage/5-cover.png" });
vi.mock("./storage", () => ({ storagePut }));

const { appRouter } = await import("./routers");

const admin: NonNullable<TrpcContext["user"]> = {
  id: 1, openId: "review-admin", name: "Admin", email: "admin@example.com", loginMethod: "manus", role: "admin",
  createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
};

describe("digital book cover admin route", () => {
  afterEach(() => { setDbForTesting(null); storagePut.mockClear(); });

  it("uploads an allowed image and stores its key and URL through the protected admin route", async () => {
    let stored: Record<string, unknown> | null = null;
    const fakeDb = { update: () => ({ set: (values: Record<string, unknown>) => ({ where: async () => { stored = values; } }) }) };
    setDbForTesting(fakeDb as never);
    const caller = appRouter.createCaller({ user: admin, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });

    const result = await caller.digitalBooks.updateCover({ bookId: 5, coverDataUrl: "data:image/png;base64,aGVsbG8=" });

    expect(storagePut).toHaveBeenCalledWith(expect.stringMatching(/^digital-book-covers\/5-/), expect.any(Buffer), "image/png");
    expect(stored).toEqual({ coverKey: "digital-book-covers/5-cover.png", coverUrl: "/manus-storage/5-cover.png" });
    expect(result).toEqual({ success: true, coverUrl: "/manus-storage/5-cover.png" });
  });
});
