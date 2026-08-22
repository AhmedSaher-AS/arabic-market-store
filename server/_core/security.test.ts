import { describe, expect, it } from "vitest";
import { redactAuditValue } from "./security";

describe("security audit redaction", () => {
  it("redacts credentials and truncates oversized non-sensitive values", () => {
    expect(redactAuditValue("Authorization", "Bearer secret")).toBe("[محجوب]");
    expect(redactAuditValue("cookie", "session=value")).toBe("[محجوب]");
    expect(redactAuditValue("path", "a".repeat(250))).toHaveLength(238);
  });
});
