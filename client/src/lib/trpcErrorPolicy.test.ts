import { describe, expect, it } from "vitest";
import { shouldLogApiError } from "./trpcErrorPolicy";

describe("shouldLogApiError", () => {
  it("does not log expected input validation failures as application errors", () => {
    expect(shouldLogApiError({ data: { code: "BAD_REQUEST" } })).toBe(false);
  });

  it("keeps unexpected failures visible for diagnosis", () => {
    expect(shouldLogApiError({ data: { code: "INTERNAL_SERVER_ERROR" } })).toBe(true);
  });
});
