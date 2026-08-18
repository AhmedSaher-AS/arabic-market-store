import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { canUserReviewDigitalBook, getDigitalBookReviewSummary, getUserDigitalBookReview, upsertDigitalBookReview } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const bookInput = z.object({ bookId: z.number().int().positive() });

export const digitalReviewsRouter = router({
  list: publicProcedure.input(bookInput).query(({ input }) => getDigitalBookReviewSummary(input.bookId)),
  mine: protectedProcedure.input(bookInput).query(async ({ ctx, input }) => ({
    eligible: await canUserReviewDigitalBook(ctx.user.id, input.bookId),
    review: await getUserDigitalBookReview(ctx.user.id, input.bookId),
  })),
  upsert: protectedProcedure.input(bookInput.extend({
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().max(160).default(""),
    body: z.string().trim().min(12, "اكتب رأيك في 12 حرفًا على الأقل.").max(2000),
  })).mutation(async ({ ctx, input }) => {
    const eligible = await canUserReviewDigitalBook(ctx.user.id, input.bookId);
    if (!eligible) throw new TRPCError({ code: "FORBIDDEN", message: "تتوفر المراجعة بعد منحك صلاحية قراءة الكتاب." });
    const review = await upsertDigitalBookReview(ctx.user.id, { digitalBookId: input.bookId, rating: input.rating, title: input.title, body: input.body });
    return { review };
  }),
});
