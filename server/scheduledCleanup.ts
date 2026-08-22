import { and, eq, lt } from "drizzle-orm";
import { digitalBookDownloads, discountCodes } from "../drizzle/schema";
import { getDb, getStoreSettings } from "./db";
import { downloadEventCleanupBefore } from "./cleanupPolicy";

export async function runCommerceCleanup() {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const now = new Date();
  const [expiredCoupons, oldDownloads] = await Promise.all([
    db.update(discountCodes).set({ isActive: 0 }).where(and(eq(discountCodes.isActive, 1), lt(discountCodes.expiresAt, now))),
    db.delete(digitalBookDownloads).where(lt(digitalBookDownloads.createdAt, downloadEventCleanupBefore(now))),
  ]);
  return {
    deactivatedCoupons: expiredCoupons[0].affectedRows,
    removedDownloadRecords: oldDownloads[0].affectedRows,
  };
}

export async function isKnownCleanupTask(taskUid: string) {
  const settings = await getStoreSettings();
  return Boolean(settings.cleanupTaskUid && settings.cleanupTaskUid === taskUid);
}
