import rateLimit from "express-rate-limit";
import helmet from "helmet";
import type { Request } from "express";

export const securityHeaders = helmet({
  // The storefront intentionally embeds Product JSON-LD and Vite injects development code.
  // Keep CSP opt-in until every trusted storefront and storage origin is explicitly allowlisted.
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  strictTransportSecurity: process.env.NODE_ENV === "production"
    ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
    : false,
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "تم تجاوز الحد المؤقت للطلبات. حاول مرة أخرى بعد قليل.",
  },
});

const sensitiveKeys = new Set([
  "authorization",
  "cookie",
  "password",
  "token",
  "paymentproof",
  "imageurl",
]);

export function redactAuditValue(key: string, value: unknown) {
  if (sensitiveKeys.has(key.toLowerCase())) return "[محجوب]";
  if (typeof value === "string" && value.length > 240) return `${value.slice(0, 237)}…`;
  return value;
}

export function logTrpcError(req: Request, path: string | undefined, message: string) {
  const headers = Object.fromEntries(
    Object.entries(req.headers).map(([key, value]) => [key, redactAuditValue(key, value)])
  );

  console.warn("[Security audit] tRPC request failed", {
    path: path ?? "غير معروف",
    method: req.method,
    ip: req.ip,
    message,
    headers,
  });
}
