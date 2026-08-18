import { describe, expect, it } from "vitest";
import { parseCheckoutProfile } from "./checkoutProfile";

describe("parseCheckoutProfile", () => {
  it("returns trimmed name and phone from a valid locally stored profile", () => {
    expect(parseCheckoutProfile('{"customerName":"  أحمد  ","customerPhone":" 01111111111 "}')).toEqual({ customerName: "أحمد", customerPhone: "01111111111" });
  });

  it("rejects malformed or incomplete locally stored profile data", () => {
    expect(parseCheckoutProfile("not-json")).toBeNull();
    expect(parseCheckoutProfile('{"customerName":"أحمد"}')).toBeNull();
    expect(parseCheckoutProfile('{"customerName":"","customerPhone":""}')).toBeNull();
  });
});
