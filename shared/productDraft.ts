export type ProductDraft = {
  title: string;
  description: string;
  price: string;
  category: string;
  tags: string;
  inventory: string;
  imageFileName?: string;
};

export function formatProductDraft(draft: ProductDraft) {
  return [
    `اسم المنتج: ${draft.title}`,
    `الوصف: ${draft.description}`,
    `السعر: ${draft.price}`,
    `التصنيف: ${draft.category}`,
    `الوسوم: ${draft.tags || "—"}`,
    `المخزون: ${draft.inventory || "غير محدد"}`,
    `الصورة المختارة: ${draft.imageFileName || "لم تُحدد صورة"}`,
  ].join("\n");
}
