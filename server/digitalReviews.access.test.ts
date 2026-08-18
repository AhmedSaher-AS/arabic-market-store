import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const reader: NonNullable<TrpcContext["user"]> = {
  id: 94, openId: "review-reader", name: "قارئ", email: "reader@example.com", loginMethod: "manus", role: "user",
  createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
};

function callerFor(user: TrpcContext["user"]) {
  return appRouter.createCaller({ user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
}

describe("digital book reviews access", () => {
  const input = { bookId: 1, rating: 5, title: "قراءة ممتعة", body: "تجربة قراءة واضحة وممتعة من البداية حتى النهاية." };

  it("requires login before a review can be submitted", async () => {
    await expect(callerFor(null).digitalReviews.upsert(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects a rating outside the permitted five-star range", async () => {
    await expect(callerFor(reader).digitalReviews.upsert({ ...input, rating: 6 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("blocks a signed-in customer who has not received the book entitlement", async () => {
    await expect(callerFor(reader).digitalReviews.upsert(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
