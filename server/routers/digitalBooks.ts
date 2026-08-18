import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createLocalDigitalBookOrder, getAvailableDigitalBookByHandle, getReadableBook, getReadingProgress, listAllDigitalBooks, listAvailableDigitalBooks, listDigitalBooksForUser, listRelatedDigitalBooks, markOwnerNotified, recordDigitalBookEvent, removeDigitalBook, saveReadingProgress, updateDigitalBookCover, updateDigitalBookDetails, updateDigitalBookSample, upsertDigitalBook } from "../db";
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
    shortDescription: z.string().trim().max(600).default(""),
    author: z.string().trim().max(255).default(""),
    language: z.string().trim().max(64).default("العربية"),
    pageCount: z.coerce.number().int().min(0).max(100_000).default(0),
    category: z.string().trim().min(1).max(120).default("عام"),
    tags: z.string().trim().max(1000).default(""),
    tableOfContents: z.string().trim().max(5000).optional(),
    price: z.coerce.number().min(0).max(10_000_000),
    currencyCode: z.string().trim().length(3).default("EGP"),
    isAvailable: z.boolean().default(true),
    fileName: z.string().trim().min(1).max(255),
    dataUrl: z.string().min(20).max(34_000_000),
    coverDataUrl: z.string().min(20).max(9_000_000).optional(),
    sampleDataUrl: z.string().min(20).max(12_000_000).optional(),
  })).mutation(async ({ input }) => {
    const { content } = parseBase64Upload(input.dataUrl, ["application/pdf"], 24 * 1024 * 1024);
    const stored = await storagePut(`digital-books/${safeFileStem(input.productHandle)}-${Date.now()}.pdf`, content, "application/pdf");
    let cover: { coverKey?: string; coverUrl?: string } = {};
    if (input.coverDataUrl) {
      const parsedCover = parseBase64Upload(input.coverDataUrl, ["image/jpeg", "image/png", "image/webp"], 6 * 1024 * 1024);
      const extension = parsedCover.contentType === "image/png" ? "png" : parsedCover.contentType === "image/webp" ? "webp" : "jpg";
      const uploadedCover = await storagePut(`digital-book-covers/${safeFileStem(input.productHandle)}-${Date.now()}.${extension}`, parsedCover.content, parsedCover.contentType);
      cover = { coverKey: uploadedCover.key, coverUrl: uploadedCover.url };
    }
    let sample: { sampleKey?: string; sampleUrl?: string } = {};
    if (input.sampleDataUrl) {
      const parsedSample = parseBase64Upload(input.sampleDataUrl, ["application/pdf"], 8 * 1024 * 1024);
      const uploadedSample = await storagePut(`digital-book-samples/${safeFileStem(input.productHandle)}-${Date.now()}.pdf`, parsedSample.content, "application/pdf");
      sample = { sampleKey: uploadedSample.key, sampleUrl: uploadedSample.url };
    }
    const book = await upsertDigitalBook({
      productHandle: input.productHandle, title: input.title, description: input.description,
      shortDescription: input.shortDescription, author: input.author, language: input.language,
      pageCount: input.pageCount, category: input.category, tags: input.tags, tableOfContents: input.tableOfContents ?? null,
      price: input.price.toFixed(2), currencyCode: input.currencyCode.toUpperCase(), isAvailable: input.isAvailable ? 1 : 0,
      fileName: input.fileName, pdfKey: stored.key, pdfUrl: stored.url, ...sample, ...cover,
    });
    return { success: true, book: { id: book.id, title: book.title, productHandle: book.productHandle, isAvailable: Boolean(book.isAvailable) } } as const;
  }),
  adminList: adminProcedure.query(() => listAllDigitalBooks()),
  catalog: publicProcedure.query(() => listAvailableDigitalBooks()),
  detail: publicProcedure.input(z.object({ productHandle: z.string().trim().min(1).max(255) })).query(async ({ input }) => {
    const book = await getAvailableDigitalBookByHandle(input.productHandle);
    if (!book) throw new TRPCError({ code: "NOT_FOUND", message: "لم يتم العثور على هذا الكتاب." });
    await recordDigitalBookEvent({ digitalBookId: book.id, eventType: "عرض" });
    const related = await listRelatedDigitalBooks(book.id, book.category);
    return { book, related };
  }),
  sample: publicProcedure.input(z.object({ productHandle: z.string().trim().min(1).max(255) })).query(async ({ input }) => {
    const book = await getAvailableDigitalBookByHandle(input.productHandle);
    if (!book?.sampleKey) throw new TRPCError({ code: "NOT_FOUND", message: "لا توجد عينة متاحة لهذا الكتاب حاليًا." });
    return { title: book.title, pdfUrl: await storageGetSignedUrl(book.sampleKey) };
  }),
  purchase: protectedProcedure.input(z.object({
    bookId: z.number().int().positive(),
    customerName: z.string().trim().min(3).max(160),
    customerPhone: z.string().trim().min(7).max(32),
    paymentMethod: z.enum(paymentMethods),
  })).mutation(async ({ ctx, input }) => {
    await recordDigitalBookEvent({ digitalBookId: input.bookId, userId: ctx.user.id, eventType: "بدء طلب" });
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
    shortDescription: z.string().trim().max(600),
    author: z.string().trim().max(255),
    language: z.string().trim().min(1).max(64),
    pageCount: z.coerce.number().int().min(0).max(100_000),
    category: z.string().trim().min(1).max(120),
    tags: z.string().trim().max(1000),
    tableOfContents: z.string().trim().max(5000).nullable(),
    price: z.coerce.number().min(0).max(10_000_000),
    currencyCode: z.string().trim().length(3).default("EGP"),
    isAvailable: z.boolean(),
  })).mutation(async ({ input }) => {
    await updateDigitalBookDetails(input.bookId, {
      title: input.title, description: input.description, shortDescription: input.shortDescription, author: input.author,
      language: input.language, pageCount: input.pageCount, category: input.category, tags: input.tags,
      tableOfContents: input.tableOfContents, price: input.price.toFixed(2), currencyCode: input.currencyCode.toUpperCase(), isAvailable: input.isAvailable ? 1 : 0,
    });
    return { success: true } as const;
  }),
  updateCover: adminProcedure.input(z.object({
    bookId: z.number().int().positive(),
    coverDataUrl: z.string().min(20).max(9_000_000).optional(),
    removeCover: z.boolean().default(false),
  }).refine(input => input.removeCover || Boolean(input.coverDataUrl), { message: "اختر غلافًا أو اطلب حذفه." })).mutation(async ({ input }) => {
    if (input.removeCover) {
      await updateDigitalBookCover(input.bookId, { coverKey: null, coverUrl: null });
      return { success: true, coverUrl: null } as const;
    }
    const parsedCover = parseBase64Upload(input.coverDataUrl!, ["image/jpeg", "image/png", "image/webp"], 6 * 1024 * 1024);
    const extension = parsedCover.contentType === "image/png" ? "png" : parsedCover.contentType === "image/webp" ? "webp" : "jpg";
    const uploadedCover = await storagePut(`digital-book-covers/${input.bookId}-${Date.now()}.${extension}`, parsedCover.content, parsedCover.contentType);
    await updateDigitalBookCover(input.bookId, { coverKey: uploadedCover.key, coverUrl: uploadedCover.url });
    return { success: true, coverUrl: uploadedCover.url } as const;
  }),
  updateSample: adminProcedure.input(z.object({
    bookId: z.number().int().positive(),
    sampleDataUrl: z.string().min(20).max(12_000_000).optional(),
    removeSample: z.boolean().default(false),
  }).refine(input => input.removeSample || Boolean(input.sampleDataUrl), { message: "اختر ملف عينة أو اطلب حذفه." })).mutation(async ({ input }) => {
    if (input.removeSample) {
      await updateDigitalBookSample(input.bookId, { sampleKey: null, sampleUrl: null });
      return { success: true, sampleUrl: null } as const;
    }
    const parsedSample = parseBase64Upload(input.sampleDataUrl!, ["application/pdf"], 8 * 1024 * 1024);
    const uploadedSample = await storagePut(`digital-book-samples/${input.bookId}-${Date.now()}.pdf`, parsedSample.content, "application/pdf");
    await updateDigitalBookSample(input.bookId, { sampleKey: uploadedSample.key, sampleUrl: uploadedSample.url });
    return { success: true, sampleUrl: uploadedSample.url } as const;
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
