import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("orders.tracking access control", () => {
  it("requires authentication before exposing payment proofs and digital entitlements", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    await expect(caller.orders.tracking()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
