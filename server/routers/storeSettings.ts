import { z } from "zod";
import { getStoreSettings, updateStoreSettings } from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";

const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(2).max(120),
  heroEyebrow: z.string().trim().min(2).max(160),
  heroTitle: z.string().trim().min(2).max(200),
  heroHighlight: z.string().trim().min(2).max(200),
  heroDescription: z.string().trim().min(10).max(2000),
  footerDescription: z.string().trim().min(10).max(2000),
});

export const storeSettingsRouter = router({
  public: publicProcedure.query(() => getStoreSettings()),
  admin: adminProcedure.query(() => getStoreSettings()),
  update: adminProcedure.input(storeSettingsSchema).mutation(({ input }) => updateStoreSettings(input)),
});
