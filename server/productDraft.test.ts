import { describe, expect, it } from "vitest";
import { formatProductDraft } from "../shared/productDraft";

describe("formatProductDraft", () => {
  it("preserves the product fields prepared for transfer to Shopify", () => {
    expect(formatProductDraft({ title: "قميص قطني", description: "مقاس مريح", price: "749", category: "ملابس", tags: "صيفي، قطني", inventory: "12", imageFileName: "shirt.jpg" })).toContain("اسم المنتج: قميص قطني");
    expect(formatProductDraft({ title: "قميص قطني", description: "مقاس مريح", price: "749", category: "ملابس", tags: "صيفي، قطني", inventory: "12", imageFileName: "shirt.jpg" })).toContain("الصورة المختارة: shirt.jpg");
  });
});
