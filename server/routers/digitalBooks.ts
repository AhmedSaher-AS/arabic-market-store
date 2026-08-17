import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createLocalDigitalBookOrder, getReadableBook, getReadingProgress, listAllDigitalBooks, listAvailableDigitalBooks, listDigitalBooksForUser, markOwnerNotified, removeDigitalBook, saveReadingProgress, updateDigitalBookDetails, upsertDigitalBook } from "../db";
import { paymentMethods } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";
import { parseBase64Upload, safeFileStem } from "../fileUpload";
import { storageGetSignedUrl, storagePut } from "../storage";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const digitalBooksRouter = router({
  upload: adminProcedure.input(z.object({
    productHandle: z.string().trim().min(1).max(255),
    title: z.string().trim().min(2).max(255),
    description: z.string().trim().max(5000).default(""),
    price: z.coerce.number().positive().max(10_000_000),
    currencyCode: z.string().trim().length(3).default("EGP"),
    isAvailable: z.boolean().default(true),
    fileName: z.string().trim().min(1).max(255),
    dataUrl: z.string().min(20).max(34_000_000),
  })).mutation(async ({ input }) => {
    const { content } = parseBase64Upload(input.dataUrl, ["application/pdf"], 24 * 1024 * 1024);
    const stored = await storagePut(`digital-books/${safeFileStem(input.productHandle)}-${Date.now()}.pdf`, content, "application/pdf");
    await upsertDigitalBook({ productHandle: input.productHandle, title: input.title, description: input.description, price: input.price.toFixed(2), currencyCode: input.currencyCode.toUpperCase(), isAvailable: input.isAvailable ? 1 : 0, fileName: input.fileName, pdfKey: stored.key, pdfUrl: stored.url });
    return { success: true } as const;
  }),
  adminList: adminProcedure.query(() => listAllDigitalBooks()),
  catalog: publicProcedure.query(() => listAvailableDigitalBooks()),
  purchase: protectedProcedure.input(z.object({
    bookId: z.number().int().positive(),
    customerName: z.string().trim().min(3).max(160),
    customerPhone: z.string().trim().min(7).max(32),
    paymentMethod: z.enum(paymentMethods),
  })).mutation(async ({ ctx, input }) => {
    const order = await createLocalDigitalBookOrder({ ...input, userId: ctx.user.id });
    try {
      const notified = await notifyOwner({ title: `طلب كتاب رقمي ${order.orderNumber}`, content: `ورد طلب كتاب رقمي محلي بقيمة ${order.total} ${order.currencyCode}. العميل: ${order.customerName}.` });
      if (notified) await markOwnerNotified(order.id);
    } catch (error) {
      console.warn("[DigitalBooks] Owner notification failed after digital order", error);
    }
    return order;
  }),
  updateDetails: adminProcedure.input(z.object({
    bookId: z.number().int().positive(),
    title: z.string().trim().min(2).max(255),
    description: z.string().trim().max(5000),
    price: z.coerce.number().positive().max(10_000_000),
    currencyCode: z.string().trim().length(3).default("EGP"),
    isAvailable: z.boolean(),
  })).mutation(async ({ input }) => {
    await updateDigitalBookDetails(input.bookId, { title: input.title, description: input.description, price: input.price.toFixed(2), currencyCode: input.currencyCode.toUpperCase(), isAvailable: input.isAvailable ? 1 : 0 });
    return { success: true } as const;
  }),
  remove: adminProcedure.input(z.object({ bookId: z.number().int().positive(), confirmed: z.literal(true) })).mutation(async ({ input }) => {
    await removeDigitalBook(input.bookId);
    return { success: true } as const;
  }),
  mine: protectedProcedure.query(({ ctx }) => listDigitalBooksForUser(ctx.user.id)),
  reader: protectedProcedure.input(z.object({ productHandle: z.string().min(1).max(255) })).query(async ({ ctx, input }) => {
    const book = await getReadableBook(input.productHandle, ctx.user.id, ctx.user.role === "admin");
    if (!book) throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك صلاحية قراءة هذا الكتاب حاليًا." });
    const signedUrl = await storageGetSignedUrl(book.pdfKey);
    return { id: book.id, title: book.title, pdfUrl: signedUrl, downloadUrl: signedUrl, lastPage: await getReadingProgress(ctx.user.id, book.id) };
  }),
  saveProgress: protectedProcedure.input(z.object({ productHandle: z.string().min(1).max(255), lastPage: z.number().int().min(1).max(100000) })).mutation(async ({ ctx, input }) => {
    const book = await getReadableBook(input.productHandle, ctx.user.id, ctx.user.role === "admin");
    if (!book) throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك صلاحية حفظ تقدم هذا الكتاب." });
    await saveReadingProgress(ctx.user.id, book.id, input.lastPage);
    return { success: true, lastPage: input.lastPage } as const;
  }),
});
