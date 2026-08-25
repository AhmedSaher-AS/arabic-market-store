type TrpcLikeError = { data?: { code?: unknown } };

/** أخطاء الإدخال المتوقعة تُعرض للمستخدم داخل النموذج ولا ينبغي تسجيلها كأعطال تشغيل. */
export function shouldLogApiError(error: unknown): boolean {
  const code = typeof error === "object" && error !== null ? (error as TrpcLikeError).data?.code : undefined;
  return code !== "BAD_REQUEST";
}
