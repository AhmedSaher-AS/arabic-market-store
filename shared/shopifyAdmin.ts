const storeBase = "https://admin.shopify.com/store/arabicshop-p2xmxzpy-ember-blossom-1jkpfuef";

export const shopifyProductsAdminUrl = `${storeBase}/products`;
export const shopifyNewProductAdminUrl = `${storeBase}/products/new`;

export function shopifyProductAdminUrl(productId: string) {
  const numericId = productId.split("/").pop();
  return numericId && /^\d+$/.test(numericId) ? `${shopifyProductsAdminUrl}/${numericId}` : shopifyProductsAdminUrl;
}
