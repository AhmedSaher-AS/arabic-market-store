import { normalizeEgyptianMobile } from "./checkoutProfile";

export type PurchaseIdentityValidation =
  | { ok: true; customerName: string; customerPhone: string }
  | { ok: false; message: string };

/** تحقق آلي محلي يمنع إرسال بيانات غير مكتملة إلى الخادم. */
export function validatePurchaseIdentity(customerName: string, customerPhone: string): PurchaseIdentityValidation {
  const name = customerName.trim().replace(/\s+/g, " ");
  if (name.length < 3) return { ok: false, message: "اكتب الاسم الكامل من 3 أحرف على الأقل قبل متابعة الطلب." };

  const phone = normalizeEgyptianMobile(customerPhone);
  if (!phone) return { ok: false, message: "أدخل رقم هاتف مصري صحيحًا بصيغة 01xxxxxxxxx قبل متابعة الطلب." };

  return { ok: true, customerName: name, customerPhone: phone };
}

/** حاجز أخير يمنع ظهور نصوص Zod أو JSON أو تفاصيل الخادم للعميل. */
export function formatSafePurchaseError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/^(اكتب|أدخل|اختر|تعذر تحديد)/.test(message)) return message;
  if (/customerName|customerPhone|too_small|ZodError|\"code\"/.test(message)) return "راجع الاسم ورقم الهاتف ثم حاول مرة أخرى.";
  return "تعذر تسجيل الطلب الآن. تحقق من اتصالك ثم حاول مرة أخرى، أو راسل فريق المتجر عبر واتساب.";
}
