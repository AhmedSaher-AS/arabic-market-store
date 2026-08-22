import { decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const paymentMethods = ["فودافون كاش", "فوري", "واتساب", "إنستا باي", "فيزا/ماستركارد", "PayPal"] as const;
export const orderStatuses = ["معلق", "مؤكد", "مشحون", "مكتمل"] as const;
export const localProductCategories = ["كتب", "ملابس", "أجهزة", "متنوعة"] as const;

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  userId: int("userId").notNull().references(() => users.id),
  sourceCartId: varchar("sourceCartId", { length: 512 }).notNull(),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 32 }).notNull(),
  shippingAddress: text("shippingAddress").notNull(),
  country: varchar("country", { length: 96 }).notNull(),
  city: varchar("city", { length: 96 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", paymentMethods).notNull(),
  status: mysqlEnum("status", orderStatuses).default("معلق").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["بانتظار الدفع", "مدفوع", "فشل", "مسترد"]).default("بانتظار الدفع").notNull(),
  paymentReference: varchar("paymentReference", { length: 64 }).notNull().default(""),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull().default("0.00"),
  discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  shippingAmount: decimal("shippingAmount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  couponCode: varchar("couponCode", { length: 64 }),
  currencyCode: varchar("currencyCode", { length: 8 }).notNull(),
  checkoutUrl: text("checkoutUrl").notNull(),
  ownerNotified: int("ownerNotified").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id),
  variantId: varchar("variantId", { length: 255 }).notNull(),
  productHandle: varchar("productHandle", { length: 255 }).notNull(),
  productTitle: varchar("productTitle", { length: 255 }).notNull(),
  variantTitle: varchar("variantTitle", { length: 255 }),
  imageUrl: text("imageUrl"),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  quantity: int("quantity").notNull(),
  lineTotal: decimal("lineTotal", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const paymentSettings = mysqlTable("paymentSettings", {
  id: int("id").primaryKey(),
  vodafoneCashNumber: varchar("vodafoneCashNumber", { length: 32 }).notNull(),
  vodafoneCashRecipient: varchar("vodafoneCashRecipient", { length: 160 }).notNull(),
  fawryMode: mysqlEnum("fawryMode", ["معطّل", "إثبات يدوي", "تكامل فوري"]).default("معطّل").notNull(),
  fawryMerchantLabel: varchar("fawryMerchantLabel", { length: 160 }).notNull(),
  fawryServiceCode: varchar("fawryServiceCode", { length: 64 }).notNull(),
  fawryInstructions: text("fawryInstructions").notNull(),
  whatsappNumber: varchar("whatsappNumber", { length: 32 }).notNull().default("201146303129"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const storeSettings = mysqlTable("storeSettings", {
  id: int("id").primaryKey(),
  storeName: varchar("storeName", { length: 120 }).notNull(),
  heroEyebrow: varchar("heroEyebrow", { length: 160 }).notNull(),
  heroTitle: varchar("heroTitle", { length: 200 }).notNull(),
  heroHighlight: varchar("heroHighlight", { length: 200 }).notNull(),
  heroDescription: text("heroDescription").notNull(),
  footerDescription: text("footerDescription").notNull(),
  cleanupTaskUid: varchar("cleanupTaskUid", { length: 65 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const paymentProofs = mysqlTable("paymentProofs", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id),
  userId: int("userId").notNull().references(() => users.id),
  transactionReference: varchar("transactionReference", { length: 160 }),
  note: text("note"),
  imageKey: varchar("imageKey", { length: 512 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  status: mysqlEnum("status", ["قيد المراجعة", "مقبول", "مرفوض"]).default("قيد المراجعة").notNull(),
  reviewNote: text("reviewNote"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("paymentProofs_orderId_unique").on(table.orderId)]);

export const digitalBooks = mysqlTable("digitalBooks", {
  id: int("id").autoincrement().primaryKey(),
  productHandle: varchar("productHandle", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 5000 }).notNull().default(""),
  shortDescription: varchar("shortDescription", { length: 600 }).notNull().default(""),
  author: varchar("author", { length: 255 }).notNull().default(""),
  language: varchar("language", { length: 64 }).notNull().default("العربية"),
  pageCount: int("pageCount").notNull().default(0),
  category: varchar("category", { length: 120 }).notNull().default("عام"),
  tags: varchar("tags", { length: 1000 }).notNull().default(""),
  tableOfContents: text("tableOfContents"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull().default("0.00"),
  currencyCode: varchar("currencyCode", { length: 8 }).notNull().default("EGP"),
  isAvailable: int("isAvailable").notNull().default(1),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  pdfKey: varchar("pdfKey", { length: 512 }).notNull(),
  pdfUrl: text("pdfUrl").notNull(),
  sampleKey: varchar("sampleKey", { length: 512 }),
  sampleUrl: text("sampleUrl"),
  coverKey: varchar("coverKey", { length: 512 }),
  coverUrl: text("coverUrl"),
  maxDownloads: int("maxDownloads").notNull().default(5),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const digitalBookEvents = mysqlTable("digitalBookEvents", {
  id: int("id").autoincrement().primaryKey(),
  digitalBookId: int("digitalBookId").notNull().references(() => digitalBooks.id),
  userId: int("userId").references(() => users.id),
  eventType: mysqlEnum("eventType", ["عرض", "بدء طلب", "سداد معتمد"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const localProducts = mysqlTable("localProducts", {
  id: int("id").autoincrement().primaryKey(),
  handle: varchar("handle", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 5000 }).notNull().default(""),
  category: mysqlEnum("category", localProductCategories).notNull(),
  tags: varchar("tags", { length: 1000 }).notNull().default(""),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currencyCode: varchar("currencyCode", { length: 8 }).notNull().default("EGP"),
  inventory: int("inventory").notNull().default(0),
  isAvailable: int("isAvailable").notNull().default(1),
  imageKey: varchar("imageKey", { length: 512 }),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customerAddresses = mysqlTable("customerAddresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  label: varchar("label", { length: 80 }).notNull().default("عنوان"),
  recipientName: varchar("recipientName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  country: varchar("country", { length: 96 }).notNull(),
  city: varchar("city", { length: 96 }).notNull(),
  address: text("address").notNull(),
  isDefault: int("isDefault").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const shippingZones = mysqlTable("shippingZones", {
  id: int("id").autoincrement().primaryKey(),
  city: varchar("city", { length: 96 }).notNull().unique(),
  label: varchar("label", { length: 160 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  currencyCode: varchar("currencyCode", { length: 8 }).notNull().default("EGP"),
  estimatedDays: varchar("estimatedDays", { length: 80 }).notNull().default("يُحدّد عند تأكيد الطلب"),
  isActive: int("isActive").notNull().default(1),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const discountCodes = mysqlTable("discountCodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  discountType: mysqlEnum("discountType", ["نسبة", "مبلغ ثابت"]).notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  minimumAmount: decimal("minimumAmount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  maxUses: int("maxUses").notNull().default(0),
  usedCount: int("usedCount").notNull().default(0),
  isActive: int("isActive").notNull().default(1),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const wishlistItems = mysqlTable("wishlistItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  itemType: mysqlEnum("itemType", ["منتج", "كتاب رقمي"]).notNull(),
  itemId: int("itemId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 255 }).notNull().default(""),
  price: decimal("price", { precision: 12, scale: 2 }).notNull().default("0.00"),
  currencyCode: varchar("currencyCode", { length: 8 }).notNull().default("EGP"),
  imageUrl: text("imageUrl"),
  targetPath: varchar("targetPath", { length: 512 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("wishlist_user_item_unique").on(table.userId, table.itemType, table.itemId)]);

export const digitalEntitlements = mysqlTable("digitalEntitlements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  digitalBookId: int("digitalBookId").notNull().references(() => digitalBooks.id),
  orderId: int("orderId").notNull().references(() => orders.id),
  downloadCount: int("downloadCount").notNull().default(0),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
}, table => [uniqueIndex("digitalEntitlements_orderId_book_unique").on(table.orderId, table.digitalBookId)]);

export const digitalBookDownloads = mysqlTable("digitalBookDownloads", {
  id: int("id").autoincrement().primaryKey(),
  digitalBookId: int("digitalBookId").notNull().references(() => digitalBooks.id),
  userId: int("userId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("digitalBookDownloads_user_book_idx").on(table.userId, table.digitalBookId),
  index("digitalBookDownloads_createdAt_idx").on(table.createdAt),
]);

export const digitalBookReviews = mysqlTable("digitalBookReviews", {
  id: int("id").autoincrement().primaryKey(),
  digitalBookId: int("digitalBookId").notNull().references(() => digitalBooks.id),
  userId: int("userId").notNull().references(() => users.id),
  rating: int("rating").notNull(),
  title: varchar("title", { length: 160 }).notNull().default(""),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("digitalBookReviews_user_book_unique").on(table.userId, table.digitalBookId)]);

export const readingProgress = mysqlTable("readingProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  digitalBookId: int("digitalBookId").notNull().references(() => digitalBooks.id),
  lastPage: int("lastPage").notNull().default(1),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("readingProgress_user_book_unique").on(table.userId, table.digitalBookId)]);

export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
