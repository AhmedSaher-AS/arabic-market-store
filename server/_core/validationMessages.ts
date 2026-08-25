type ValidationIssue = {
  code: string;
  path: PropertyKey[];
};

const fieldMessages: Record<string, string> = {
  customerName: "اكتب الاسم الكامل من 3 أحرف على الأقل.",
  customerPhone: "أدخل رقم هاتف صحيحًا قبل متابعة الطلب.",
  shippingAddress: "اكتب عنوان التوصيل بالتفصيل.",
  country: "اكتب اسم الدولة بصورة صحيحة.",
  city: "اكتب اسم المدينة بصورة صحيحة.",
  paymentMethod: "اختر طريقة دفع متاحة.",
  quantity: "اختر كمية صحيحة للطلب.",
  cartId: "تعذر تحديد السلة. حدّث الصفحة ثم حاول مرة أخرى.",
  bookId: "تعذر تحديد الكتاب. حدّث الصفحة ثم حاول مرة أخرى.",
  productId: "تعذر تحديد المنتج. حدّث الصفحة ثم حاول مرة أخرى.",
};

/** يحوّل أخطاء المخطط التقني إلى إرشادات قصيرة ومفهومة للعميل. */
export function getSmartValidationMessage(issues: ValidationIssue[]): string | undefined {
  const field = issues[0]?.path.at(-1);
  return typeof field === "string" ? fieldMessages[field] : undefined;
}
