import { describe, expect, it } from "vitest";
import { isDownloadLimitReached, remainingDownloads } from "./digitalDownloadLimits";

describe("digital download limits", () => {
  it("يعرض عدد التنزيلات المتبقية للحدود المحددة", () => {
    expect(remainingDownloads(5, 2)).toBe(3);
    expect(remainingDownloads(5, 8)).toBe(0);
    expect(isDownloadLimitReached(5, 5)).toBe(true);
  });

  it("يعامل القيمة صفر كتنزيلات غير محدودة", () => {
    expect(remainingDownloads(0, 999)).toBeNull();
    expect(isDownloadLimitReached(0, 999)).toBe(false);
  });
});
