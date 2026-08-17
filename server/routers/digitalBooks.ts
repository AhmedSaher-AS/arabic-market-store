import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getReadableBook, listDigitalBooksForUser, upsertDigitalBook } from "../db";
import { parseBase64Upload, safeFileStem } from "../fileUpload";
import { storageGetSignedUrl, storagePut } from "../storage";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

export const digitalBooksRouter = router({
  upload: adminProcedure.input(z.object({
    productHandle: z.string().trim().min(1).max(255),
    title: z.string().trim().min(2).max(255),
    fileName: z.string().trim().min(1).max(255),
    dataUrl: z.string().min(20).max(34_000_000),
  })).mutation(async ({ input }) => {
    const { content } = parseBase64Upload(input.dataUrl, ["application/pdf"], 24 * 1024 * 1024);
    const stored = await storagePut(`digital-books/${safeFileStem(input.productHandle)}-${Date.now()}.pdf`, content, "application/pdf");
    await upsertDigitalBook({ productHandle: input.productHandle, title: input.title, fileName: input.fileName, pdfKey: stored.key, pdfUrl: stored.url });
    return { success: true } as const;
  }),
  mine: protectedProcedure.query(({ ctx }) => listDigitalBooksForUser(ctx.user.id)),
  reader: protectedProcedure.input(z.object({ productHandle: z.string().min(1).max(255) })).query(async ({ ctx, input }) => {
    const book = await getReadableBook(input.productHandle, ctx.user.id, ctx.user.role === "admin");
    if (!book) throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك صلاحية قراءة هذا الكتاب حاليًا." });
    return { title: book.title, pdfUrl: await storageGetSignedUrl(book.pdfKey) };
  }),
});
