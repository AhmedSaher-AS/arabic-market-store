import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getOrderForUser, getPaymentSettings, listPendingPaymentProofs, reviewPaymentProof, updatePaymentSettings, upsertPaymentProof } from "../db";
import { parseBase64Upload, safeFileStem } from "../fileUpload";
import { storageGetSignedUrl, storagePut } from "../storage";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";

const paymentSettingsSchema = z.object({
  vodafoneCashNumber: z.string().trim().max(32),
  vodafoneCashRecipient: z.string().trim().max(160),
  fawryMode: z.enum(["معطّل", "إثبات يدوي", "تكامل فوري"]),
  fawryMerchantLabel: z.string().trim().max(160),
  fawryServiceCode: z.string().trim().max(64),
  fawryInstructions: z.string().trim().max(1200),
  whatsappNumber: z.string().trim().regex(/^\d{10,18}$/, "أدخل رقم واتساب دولي بالأرقام فقط.").max(32),
});

export const paymentsRouter = router({
  publicSettings: publicProcedure.query(async () => {
    const settings = await getPaymentSettings();
    return {
      vodafoneCashNumber: settings.vodafoneCashNumber,
      vodafoneCashRecipient: settings.vodafoneCashRecipient,
      fawryMode: settings.fawryMode,
      fawryMerchantLabel: settings.fawryMerchantLabel,
      fawryServiceCode: settings.fawryServiceCode,
      fawryInstructions: settings.fawryInstructions,
      whatsappNumber: settings.whatsappNumber,
    };
  }),
  adminSettings: adminProcedure.query(() => getPaymentSettings()),
  updateSettings: adminProcedure.input(paymentSettingsSchema).mutation(({ input }) => updatePaymentSettings(input)),
  uploadProof: protectedProcedure.input(z.object({
    orderId: z.number().int().positive(),
    dataUrl: z.string().min(20).max(12_000_000),
    fileName: z.string().trim().min(1).max(180),
    transactionReference: z.string().trim().max(160).optional(),
    note: z.string().trim().max(1000).optional(),
  })).mutation(async ({ ctx, input }) => {
    const order = await getOrderForUser(input.orderId, ctx.user.id);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "لم يتم العثور على الطلب." });
    if (!["فودافون كاش", "فوري", "واتساب"].includes(order.paymentMethod)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "إثبات السداد متاح فقط للدفع اليدوي." });
    }
    const { content, contentType } = parseBase64Upload(input.dataUrl, ["image/jpeg", "image/png", "image/webp"], 8 * 1024 * 1024);
    const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const stored = await storagePut(`payment-proofs/${ctx.user.id}/${order.orderNumber}-${safeFileStem(input.fileName)}.${extension}`, content, contentType);
    await upsertPaymentProof({ orderId: order.id, userId: ctx.user.id, transactionReference: input.transactionReference || null, note: input.note || null, imageKey: stored.key, imageUrl: stored.url });
    return { success: true, proofUrl: stored.url } as const;
  }),
  pendingProofs: adminProcedure.query(async () => {
    const proofs = await listPendingPaymentProofs();
    return Promise.all(proofs.map(async item => ({ ...item, proof: { ...item.proof, imageUrl: await storageGetSignedUrl(item.proof.imageKey) } })));
  }),
  reviewProof: adminProcedure.input(z.object({ proofId: z.number().int().positive(), accepted: z.boolean(), reviewNote: z.string().trim().max(1000).optional() })).mutation(async ({ input }) => {
    await reviewPaymentProof(input.proofId, input.accepted, input.reviewNote || "");
    return { success: true } as const;
  }),
});
