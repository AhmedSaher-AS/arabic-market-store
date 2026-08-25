import { describe, expect, it } from "vitest";
import { formatUserFacingError } from "./userFacingError";

describe("formatUserFacingError", () => {
  it("keeps a short Arabic business message", () => {
    expect(formatUserFacingError(new Error("هذا المنتج نفد من المخزون."), "تعذر الحفظ."))
      .toBe("هذا المنتج نفد من المخزون.");
  });

  it("hides technical validation details", () => {
    expect(formatUserFacingError(new Error('[{"code":"too_small","path":["customerName"]}]'), "راجع البيانات ثم حاول مرة أخرى."))
      .toBe("راجع البيانات ثم حاول مرة أخرى.");
  });
});
