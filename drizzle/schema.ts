import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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

export const paymentMethods = ["فودافون كاش", "فوري", "إنستا باي", "فيزا/ماستركارد", "PayPal"] as const;
export const orderStatuses = ["معلق", "مؤكد", "مشحون", "مكتمل"] as const;

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
  fileName: varchar("fileName", { length: 255 }).notNull(),
  pdfKey: varchar("pdfKey", { length: 512 }).notNull(),
  pdfUrl: text("pdfUrl").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const digitalEntitlements = mysqlTable("digitalEntitlements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  digitalBookId: int("digitalBookId").notNull().references(() => digitalBooks.id),
  orderId: int("orderId").notNull().references(() => orders.id),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
}, table => [uniqueIndex("digitalEntitlements_orderId_book_unique").on(table.orderId, table.digitalBookId)]);

export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
