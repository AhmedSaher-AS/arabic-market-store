import { afterEach, describe, expect, it } from "vitest";
import { setDbForTesting, upsertDigitalBookReview } from "./db";

describe("digital book review persistence", () => {
  afterEach(() => setDbForTesting(null));

  it("stores a review only after the entitlement check succeeds", async () => {
    const stored = { id: 3, userId: 7, digitalBookId: 12, rating: 5, title: "قصة متقنة", body: "أسلوب الكتاب واضح وسهل المتابعة حتى نهايته." };
    let inserted: unknown = null;
    let reads = 0;
    const fakeDb = {
      select: () => ({ from: () => ({ where: () => ({ limit: async () => {
        reads += 1;
        return reads <= 1 ? [{ id: 44 }] : [stored];
      } }) }) }),
      insert: () => ({ values: (values: unknown) => ({ onDuplicateKeyUpdate: async () => { inserted = values; } }) }),
    };

    setDbForTesting(fakeDb as never);
    const review = await upsertDigitalBookReview(7, { digitalBookId: 12, rating: 5, title: "قصة متقنة", body: "أسلوب الكتاب واضح وسهل المتابعة حتى نهايته." });

    expect(inserted).toEqual(expect.objectContaining({ userId: 7, digitalBookId: 12, rating: 5 }));
    expect(review).toEqual(stored);
  });
});
