import { z } from "zod";
import { createLocalProduct, createLocalProductOrder, listLocalProducts, removeLocalProduct, updateLocalProduct } from "../db";
import { parseBase64Upload, safeFileStem } from "../fileUpload";
import { storagePut } from "../storage";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";

const categories = ["كتب", "ملابس", "أجهزة", "متنوعة"] as const;
const paymentMethods = ["فودافون كاش", "فوري", "واتساب", "إنستا باي", "فيزا/ماستركارد", "PayPal"] as const;
const baseProductSchema = z.object({
  handle: z.string().trim().min(3).max(255).regex(/^[a-z0-9-]+$/, "استخدم أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط في المعرّف."),
  title: z.string().trim().min(2).max(255),
  description: z.string().trim().max(5000).default(""),
  category: z.enum(categories),
  tags: z.string().trim().max(1000).default(""),
  price: z.coerce.number().positive().max(10_000_000),
  currencyCode: z.string().trim().length(3).default("EGP"),
  inventory: z.coerce.number().int().min(0).max(10_000_000).default(0),
  isAvailable: z.boolean().default(true),
  imageDataUrl: z.string().min(20).max(12_000_000).optional(),
});

async function productValues(input: z.infer<typeof baseProductSchema>) {
  let imageKey: string | null | undefined;
  let imageUrl: string | null | undefined;
  if (input.imageDataUrl) {
    const file = parseBase64Upload(input.imageDataUrl, ["image/jpeg", "image/png", "image/webp"], 8 * 1024 * 1024);
    const stored = await storagePut(`local-products/${safeFileStem(input.handle)}-${Date.now()}`, file.content, file.contentType);
    imageKey = stored.key;
    imageUrl = stored.url;
  }
  return { handle: input.handle, title: input.title, description: input.description, category: input.category, tags: input.tags, price: input.price.toFixed(2), currencyCode: input.currencyCode.toUpperCase(), inventory: input.inventory, isAvailable: input.isAvailable ? 1 : 0, imageKey, imageUrl };
}

export const localProductsRouter = router({
  catalog: publicProcedure.query(() => listLocalProducts(true)),
  adminList: adminProcedure.query(() => listLocalProducts(false)),
  create: adminProcedure.input(baseProductSchema).mutation(async ({ input }) => { await createLocalProduct(await productValues(input)); return { success: true } as const; }),
  update: adminProcedure.input(baseProductSchema.extend({ productId: z.number().int().positive() })).mutation(async ({ input }) => {
    const values = await productValues(input);
    if (!input.imageDataUrl) { delete values.imageKey; delete values.imageUrl; }
    await updateLocalProduct(input.productId, values);
    return { success: true } as const;
  }),
  remove: adminProcedure.input(z.object({ productId: z.number().int().positive(), confirmed: z.literal(true) })).mutation(async ({ input }) => { await removeLocalProduct(input.productId); return { success: true } as const; }),
  purchase: protectedProcedure.input(z.object({ productId: z.number().int().positive(), customerName: z.string().trim().min(2).max(160), customerPhone: z.string().trim().min(7).max(32), shippingAddress: z.string().trim().min(5).max(2000), country: z.string().trim().min(2).max(96), city: z.string().trim().min(2).max(96), paymentMethod: z.enum(paymentMethods) })).mutation(async ({ ctx, input }) => {
    return createLocalProductOrder({ ...input, userId: ctx.user.id });
  }),
});
