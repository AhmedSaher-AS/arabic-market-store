import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

const visitor: NonNullable<TrpcContext["user"]> = {
  id: 999,
  openId: "different-account",
  name: "Visitor",
  email: "visitor@example.com",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("admin ownership protection", () => {
  it("rejects a non-owner before any management data is returned", async () => {
    const caller = appRouter.createCaller({ user: visitor, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });

    await expect(caller.digitalBooks.adminList()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.orders.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.payments.pendingProofs()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
