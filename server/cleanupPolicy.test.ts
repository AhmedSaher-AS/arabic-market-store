import { describe, expect, it } from "vitest";
import { downloadEventCleanupBefore } from "./cleanupPolicy";

describe("download event retention", () => {
  it("يحتفظ بسجل التنزيلات لمدة سنة كاملة", () => {
    expect(downloadEventCleanupBefore(new Date("2026-08-22T00:00:00.000Z")).toISOString()).toBe("2025-08-22T00:00:00.000Z");
  });
});
