import { afterEach, describe, expect, it } from "vitest";
import { setDbForTesting, updateDigitalBookCover } from "./db";

describe("digital book cover persistence", () => {
  afterEach(() => setDbForTesting(null));

  it("stores a replacement cover reference for the selected digital book", async () => {
    let saved: Record<string, unknown> | null = null;
    const fakeDb = {
      update: () => ({ set: (values: Record<string, unknown>) => ({ where: async () => { saved = values; } }) }),
    };
    setDbForTesting(fakeDb as never);

    await updateDigitalBookCover(16, { coverKey: "digital-book-covers/16-cover.jpg", coverUrl: "/manus-storage/16-cover.jpg" });

    expect(saved).toEqual({ coverKey: "digital-book-covers/16-cover.jpg", coverUrl: "/manus-storage/16-cover.jpg" });
  });
});
