import { TRPCError } from "@trpc/server";

export function parseBase64Upload(
  dataUrl: string,
  allowedTypes: string[],
  maxBytes: number,
) {
  const match = /^data:([^;]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "تنسيق الملف غير صالح." });
  const contentType = match[1].toLowerCase();
  if (!allowedTypes.includes(contentType)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "نوع الملف غير مسموح." });
  }
  const content = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!content.length || content.length > maxBytes) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "حجم الملف غير مسموح." });
  }
  return { content, contentType };
}

export function safeFileStem(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "file";
}
