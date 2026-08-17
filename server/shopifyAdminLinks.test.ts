import { describe, expect, it } from "vitest";
import { shopifyNewProductAdminUrl, shopifyProductAdminUrl, shopifyProductsAdminUrl } from "../shared/shopifyAdmin";

describe("Shopify admin product links", () => {
  it("builds the exact product page used by edit, media, and delete/archive entry points", () => {
    expect(shopifyProductAdminUrl("gid://shopify/Product/123456")).toBe(`${shopifyProductsAdminUrl}/123456`);
  });

  it("falls back to the products list for an invalid identifier", () => {
    expect(shopifyProductAdminUrl("not-a-product-id")).toBe(shopifyProductsAdminUrl);
    expect(shopifyNewProductAdminUrl).toBe(`${shopifyProductsAdminUrl}/new`);
  });
});
