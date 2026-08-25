/**
 * لا تمرّر الواجهة تفاصيل التحقق أو البنية الداخلية للعميل. نحتفظ فقط برسالة
 * عربية قصيرة صالحة للعرض، وإلا نستخدم الإرشاد الخاص بالإجراء.
 */
export function formatUserFacingError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message.trim() : "";
  const looksTechnical = /ZodError|too_small|customerName|customerPhone|\{\s*"|\[\s*\{|TRPCClientError|INTERNAL_SERVER_ERROR/i.test(message);
  const isShortArabicMessage = /[\u0600-\u06FF]/.test(message) && message.length <= 180;
  return isShortArabicMessage && !looksTechnical ? message : fallback;
}
