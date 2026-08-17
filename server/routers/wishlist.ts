import { z } from "zod";
import { listWishlistItems, removeWishlistItem, saveWishlistItem } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const itemSchema = z.object({
  itemType: z.enum(["منتج", "كتاب رقمي"]),
  itemId: z.number().int().positive(),
  title: z.string().trim().min(1).max(255),
  subtitle: z.string().trim().max(255).default(""),
  price: z.coerce.number().min(0).max(10_000_000),
  currencyCode: z.string().trim().length(3).default("EGP"),
  imageUrl: z.string().url().max(5000).optional(),
  targetPath: z.string().startsWith("/").max(512),
});

export const wishlistRouter = router({
  mine: protectedProcedure.query(({ ctx }) => listWishlistItems(ctx.user.id)),
  save: protectedProcedure.input(itemSchema).mutation(async ({ ctx, input }) => {
    await saveWishlistItem(ctx.user.id, { ...input, price: input.price.toFixed(2), currencyCode: input.currencyCode.toUpperCase() });
    return { success: true } as const;
  }),
  remove: protectedProcedure.input(z.object({ itemType: z.enum(["منتج", "كتاب رقمي"]), itemId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await removeWishlistItem(ctx.user.id, input.itemType, input.itemId);
    return { success: true } as const;
  }),
});
