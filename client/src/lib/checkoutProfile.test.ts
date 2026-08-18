import { describe, expect, it } from "vitest";
import { normalizeEgyptianMobile, parseCheckoutProfile } from "./checkoutProfile";

describe("parseCheckoutProfile", () => {
  it("returns trimmed name and phone from a valid locally stored profile", () => {
    expect(parseCheckoutProfile('{"customerName":"  أحمد  ","customerPhone":" 01111111111 ","paymentMethod":"فوري"}')).toEqual({ customerName: "أحمد", customerPhone: "01111111111", paymentMethod: "فوري" });
  });

  it("rejects malformed or incomplete locally stored profile data", () => {
    expect(parseCheckoutProfile("not-json")).toBeNull();
    expect(parseCheckoutProfile('{"customerName":"أحمد"}')).toBeNull();
    expect(parseCheckoutProfile('{"customerName":"","customerPhone":""}')).toBeNull();
  });

  it("normalizes Egyptian mobile numbers and rejects invalid formats", () => {
    expect(normalizeEgyptianMobile("+20 11 1111 1111")).toBe("01111111111");
    expect(normalizeEgyptianMobile("٠١١١١١١١١١١")).toBe("01111111111");
    expect(normalizeEgyptianMobile("0101234567")).toBeNull();
    expect(normalizeEgyptianMobile("01412345678")).toBeNull();
  });
});
