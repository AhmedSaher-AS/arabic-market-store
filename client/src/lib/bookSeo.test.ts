import { describe, expect, it } from "vitest";
import { getBookSeo } from "./bookSeo";

describe("getBookSeo", () => {
  it("uses a precise, readable search title for The Floating Admiral digital edition", () => {
    expect(getBookSeo({ title: "الأميرال العائم" })).toMatchObject({
      isFloatingAdmiral: true,
      title: "رواية الأميرال العائم PDF | شراء وقراءة | سوقك العربي",
    });
  });

  it("keeps a useful title and description for other digital books", () => {
    expect(getBookSeo({ title: "كتاب تجريبي", shortDescription: "وصف مختصر" })).toEqual({
      isFloatingAdmiral: false,
      title: "كتاب تجريبي | كتب رقمية | سوقك العربي",
      description: "وصف مختصر",
    });
  });
});
