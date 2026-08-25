import { and, desc, eq, gt, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { digitalBookDownloads, digitalBookEvents, digitalBookReviews, digitalBooks, digitalEntitlements, InsertUser, localProducts, orderItems, orders, Order, orderStatuses, paymentMethods, paymentProofs, paymentSettings, readingProgress, storeSettings, users, wishlistItems } from "../drizzle/schema";
import type { Cart } from "../shared/commerce/types";
import { ENV } from './_core/env';
import { remainingDownloads } from "./digitalDownloadLimits";

let _db: ReturnType<typeof drizzle> | null = null;

/** مخصص لاختبارات التكامل المعزولة فقط؛ لا يُستدعى في وقت تشغيل التطبيق. */
export function setDbForTesting(instance: ReturnType<typeof drizzle> | null) {
  _db = instance;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    // The account configured as the project owner is the only possible admin.
    // This runs on every authentication sync, so stale or manually altered roles
    // cannot grant administration access to a different account.
    const role = user.openId === ENV.ownerOpenId ? 'admin' : 'user';
    values.role = role;
    updateSet.role = role;

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

type OrderDraft = {
  userId: number;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  country: string;
  city: string;
  paymentMethod: (typeof orders.$inferInsert)["paymentMethod"];
};

function createOrderNumber() {
  return `SA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function createPaymentReference(method: string, orderNumber: string) {
  const prefix = method === "فودافون كاش" ? "VC" : method === "فوري" ? "FW" : method === "واتساب" ? "WA" : "PAY";
  return `${prefix}-${orderNumber}`;
}

export async function createOrderFromCart(draft: OrderDraft, cart: Cart): Promise<Order> {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  if (!cart.items.length) throw new Error("لا يمكن إنشاء طلب من سلة فارغة.");

  const total = Number.parseFloat(cart.total.amount);
  if (!Number.isFinite(total) || total <= 0) throw new Error("إجمالي الطلب غير صالح.");

  return db.transaction(async tx => {
    const orderNumber = createOrderNumber();
    const inserted = await tx.insert(orders).values({
      orderNumber,
      userId: draft.userId,
      sourceCartId: cart.id,
      customerName: draft.customerName,
      customerPhone: draft.customerPhone,
      shippingAddress: draft.shippingAddress,
      country: draft.country,
      city: draft.city,
      paymentMethod: draft.paymentMethod,
      paymentReference: createPaymentReference(draft.paymentMethod ?? "", orderNumber),
      total: total.toFixed(2),
      currencyCode: cart.total.currencyCode,
      checkoutUrl: cart.checkoutUrl,
    });
    const orderId = Number(inserted[0].insertId);

    await tx.insert(orderItems).values(
      cart.items.map(item => ({
        orderId,
        variantId: item.variantId,
        productHandle: item.productHandle,
        productTitle: item.productTitle,
        variantTitle: item.variantTitle === "Default Title" ? null : item.variantTitle,
        imageUrl: item.image?.url ?? null,
        unitPrice: Number.parseFloat(item.unitPrice.amount).toFixed(2),
        quantity: item.quantity,
        lineTotal: Number.parseFloat(item.lineTotal.amount).toFixed(2),
      }))
    );

    const created = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!created[0]) throw new Error("تعذر استرجاع الطلب بعد إنشائه.");
    return created[0];
  });
}

export async function listOrdersForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function createLocalDigitalBookOrder(input: { userId: number; bookId: number; customerName: string; customerPhone: string; paymentMethod: (typeof paymentMethods)[number] }): Promise<Order> {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const books = await db.select().from(digitalBooks).where(and(eq(digitalBooks.id, input.bookId), eq(digitalBooks.isAvailable, 1))).limit(1);
  const book = books[0];
  if (!book || Number(book.price) < 0) throw new Error("هذا الكتاب غير متاح للشراء حاليًا.");
  return db.transaction(async tx => {
    const orderNumber = createOrderNumber();
    const isFree = Number(book.price) === 0;
    const inserted = await tx.insert(orders).values({
      orderNumber,
      userId: input.userId,
      sourceCartId: `digital-book-${book.id}-${Date.now()}`,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      shippingAddress: "كتاب رقمي — لا يحتاج إلى شحن",
      country: "رقمي",
      city: "رقمي",
      paymentMethod: input.paymentMethod,
      paymentReference: isFree ? `FREE-${orderNumber}` : createPaymentReference(input.paymentMethod, orderNumber),
      total: Number(book.price).toFixed(2),
      currencyCode: book.currencyCode,
      checkoutUrl: "",
      paymentStatus: isFree ? "مدفوع" : "بانتظار الدفع",
      // الكتاب الرقمي لا يحتاج إلى شحن أو تنفيذ يدوي؛ تبقى مراجعة السداد منفصلة في paymentStatus.
      status: "مكتمل",
    });
    const orderId = Number(inserted[0].insertId);
    await tx.insert(orderItems).values({
      orderId,
      variantId: `local-digital-book-${book.id}`,
      productHandle: book.productHandle,
      productTitle: book.title,
      variantTitle: "كتاب PDF رقمي",
      imageUrl: null,
      unitPrice: Number(book.price).toFixed(2),
      quantity: 1,
      lineTotal: Number(book.price).toFixed(2),
    });
    if (isFree) {
      await tx.insert(digitalEntitlements).values({ userId: input.userId, digitalBookId: book.id, orderId }).onDuplicateKeyUpdate({ set: { userId: input.userId } });
      await tx.insert(digitalBookEvents).values({ digitalBookId: book.id, userId: input.userId, eventType: "سداد معتمد" });
    }
    const created = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!created[0]) throw new Error("تعذر إنشاء طلب الكتاب الرقمي.");
    return created[0];
  });
}

export async function listOrderTrackingForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const [userOrders, proofs, grantedBooks] = await Promise.all([
    db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)),
    db.select().from(paymentProofs).where(eq(paymentProofs.userId, userId)),
    db.select({ entitlement: digitalEntitlements, book: digitalBooks }).from(digitalEntitlements).innerJoin(digitalBooks, eq(digitalEntitlements.digitalBookId, digitalBooks.id)).where(eq(digitalEntitlements.userId, userId)),
  ]);
  const proofsByOrder = new Map(proofs.map(proof => [proof.orderId, proof]));
  const booksByOrder = new Map<number, typeof grantedBooks>();
  grantedBooks.forEach(item => {
    const current = booksByOrder.get(item.entitlement.orderId) ?? [];
    current.push(item);
    booksByOrder.set(item.entitlement.orderId, current);
  });
  return userOrders.map(order => ({ order, proof: proofsByOrder.get(order.id) ?? null, books: booksByOrder.get(order.id) ?? [] }));
}

export async function listAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(orderId: number, status: (typeof orderStatuses)[number]) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
}

export async function markOwnerNotified(orderId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ ownerNotified: 1 }).where(eq(orders.id, orderId));
}

type PaymentSettingsInput = {
  vodafoneCashNumber: string;
  vodafoneCashRecipient: string;
  fawryMode: "معطّل" | "إثبات يدوي" | "تكامل فوري";
  fawryMerchantLabel: string;
  fawryServiceCode: string;
  fawryInstructions: string;
  whatsappNumber: string;
};

export async function getPaymentSettings() {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const existing = await db.select().from(paymentSettings).where(eq(paymentSettings.id, 1)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(paymentSettings).values({
    id: 1,
    vodafoneCashNumber: "",
    vodafoneCashRecipient: "",
    fawryMode: "معطّل",
    fawryMerchantLabel: "",
    fawryServiceCode: "",
    fawryInstructions: "",
    whatsappNumber: "201554586850",
  });
  const created = await db.select().from(paymentSettings).where(eq(paymentSettings.id, 1)).limit(1);
  if (!created[0]) throw new Error("تعذر إعداد وسائل الدفع.");
  return created[0];
}

export async function updatePaymentSettings(values: PaymentSettingsInput) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  await db.insert(paymentSettings).values({ ...values, id: 1 }).onDuplicateKeyUpdate({ set: values });
  return getPaymentSettings();
}

export async function getOrderForUser(orderId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.userId, userId))).limit(1);
  return rows[0];
}

export async function upsertPaymentProof(input: typeof paymentProofs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  await db.insert(paymentProofs).values(input).onDuplicateKeyUpdate({
    set: {
      transactionReference: input.transactionReference,
      paidAmount: input.paidAmount,
      note: input.note,
      imageKey: input.imageKey,
      imageUrl: input.imageUrl,
      status: "قيد المراجعة",
      reviewNote: null,
      reviewedAt: null,
    },
  });
}

export async function listPendingPaymentProofs() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ proof: paymentProofs, order: orders }).from(paymentProofs).innerJoin(orders, eq(paymentProofs.orderId, orders.id)).orderBy(desc(paymentProofs.createdAt));
}

export async function reviewPaymentProof(proofId: number, accepted: boolean, reviewNote: string) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const proofs = await db.select().from(paymentProofs).where(eq(paymentProofs.id, proofId)).limit(1);
  const proof = proofs[0];
  if (!proof) throw new Error("لم يتم العثور على إثبات السداد.");
  await db.transaction(async tx => {
    const orderedBooks = await tx.select({ bookId: digitalBooks.id }).from(orderItems).innerJoin(digitalBooks, eq(orderItems.productHandle, digitalBooks.productHandle)).where(eq(orderItems.orderId, proof.orderId));
    await tx.update(paymentProofs).set({ status: accepted ? "مقبول" : "مرفوض", reviewNote: reviewNote || null, reviewedAt: new Date() }).where(eq(paymentProofs.id, proofId));
    await tx.update(orders).set({ paymentStatus: accepted ? "مدفوع" : "فشل", status: orderedBooks.length ? "مكتمل" : accepted ? "مؤكد" : "معلق" }).where(eq(orders.id, proof.orderId));
    if (!accepted) return;
    if (orderedBooks.length) {
      await tx.insert(digitalEntitlements).values(orderedBooks.map(book => ({ userId: proof.userId, digitalBookId: book.bookId, orderId: proof.orderId }))).onDuplicateKeyUpdate({ set: { userId: proof.userId } });
      await tx.insert(digitalBookEvents).values(orderedBooks.map(book => ({ digitalBookId: book.bookId, userId: proof.userId, eventType: "سداد معتمد" as const })));
    }
  });
}

export type DigitalBookInput = {
  productHandle: string;
  title: string;
  description: string;
  shortDescription: string;
  author: string;
  language: string;
  pageCount: number;
  category: string;
  tags: string;
  tableOfContents?: string | null;
  price: string;
  currencyCode: string;
  isAvailable: number;
  fileName: string;
  pdfKey: string;
  pdfUrl: string;
  sampleKey?: string | null;
  sampleUrl?: string | null;
  coverKey?: string | null;
  coverUrl?: string | null;
  maxDownloads?: number;
};

export async function upsertDigitalBook(input: DigitalBookInput) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const updates = {
    title: input.title, description: input.description, shortDescription: input.shortDescription, author: input.author,
    language: input.language, pageCount: input.pageCount, category: input.category, tags: input.tags,
    tableOfContents: input.tableOfContents ?? null, price: input.price, currencyCode: input.currencyCode,
    isAvailable: input.isAvailable, fileName: input.fileName, pdfKey: input.pdfKey, pdfUrl: input.pdfUrl,
    ...(input.sampleKey !== undefined ? { sampleKey: input.sampleKey, sampleUrl: input.sampleUrl ?? null } : {}),
    ...(input.coverKey !== undefined ? { coverKey: input.coverKey, coverUrl: input.coverUrl ?? null } : {}),
    ...(input.maxDownloads !== undefined ? { maxDownloads: input.maxDownloads } : {}),
  };
  await db.insert(digitalBooks).values(input).onDuplicateKeyUpdate({ set: updates });
  const saved = await db.select().from(digitalBooks).where(eq(digitalBooks.productHandle, input.productHandle)).limit(1);
  if (!saved[0]) throw new Error("تعذر تأكيد حفظ الكتاب الرقمي.");
  return saved[0];
}

export async function updateDigitalBookDetails(bookId: number, input: Pick<DigitalBookInput, "title" | "description" | "shortDescription" | "author" | "language" | "pageCount" | "category" | "tags" | "tableOfContents" | "price" | "currencyCode" | "isAvailable" | "maxDownloads">) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  await db.update(digitalBooks).set(input).where(eq(digitalBooks.id, bookId));
}

export async function updateDigitalBookCover(bookId: number, cover: { coverKey: string | null; coverUrl: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  await db.update(digitalBooks).set(cover).where(eq(digitalBooks.id, bookId));
}

export async function updateDigitalBookSample(bookId: number, sample: { sampleKey: string | null; sampleUrl: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  await db.update(digitalBooks).set(sample).where(eq(digitalBooks.id, bookId));
}

export async function listAvailableDigitalBooks() {
  const db = await getDb();
  if (!db) return [];
  const [books, ratings] = await Promise.all([
    db.select().from(digitalBooks).where(eq(digitalBooks.isAvailable, 1)).orderBy(desc(digitalBooks.updatedAt)),
    db.select({ digitalBookId: digitalBookReviews.digitalBookId, rating: digitalBookReviews.rating }).from(digitalBookReviews),
  ]);
  const ratingsByBook = new Map<number, { total: number; sum: number }>();
  ratings.forEach(rating => {
    const current = ratingsByBook.get(rating.digitalBookId) ?? { total: 0, sum: 0 };
    ratingsByBook.set(rating.digitalBookId, { total: current.total + 1, sum: current.sum + rating.rating });
  });
  return books.map(book => {
    const summary = ratingsByBook.get(book.id);
    return { ...book, reviewCount: summary?.total ?? 0, averageRating: summary ? Number((summary.sum / summary.total).toFixed(1)) : 0 };
  });
}

export async function getAvailableDigitalBookByHandle(productHandle: string) {
  const db = await getDb();
  if (!db) return undefined;
  const books = await db.select().from(digitalBooks).where(and(eq(digitalBooks.productHandle, productHandle), eq(digitalBooks.isAvailable, 1))).limit(1);
  return books[0];
}

export async function listRelatedDigitalBooks(bookId: number, category: string) {
  const db = await getDb();
  if (!db) return [];
  const books = await db.select().from(digitalBooks).where(and(eq(digitalBooks.category, category), eq(digitalBooks.isAvailable, 1))).orderBy(desc(digitalBooks.updatedAt)).limit(5);
  return books.filter(book => book.id !== bookId).slice(0, 3);
}

export async function recordDigitalBookEvent(input: { digitalBookId: number; userId?: number; eventType: "عرض" | "بدء طلب" | "سداد معتمد" }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(digitalBookEvents).values({ digitalBookId: input.digitalBookId, userId: input.userId ?? null, eventType: input.eventType });
}

export type DigitalBookReviewInput = {
  digitalBookId: number;
  rating: number;
  title: string;
  body: string;
};

export async function canUserReviewDigitalBook(userId: number, digitalBookId: number) {
  const db = await getDb();
  if (!db) return false;
  const entitlement = await db.select({ id: digitalEntitlements.id }).from(digitalEntitlements)
    .where(and(eq(digitalEntitlements.userId, userId), eq(digitalEntitlements.digitalBookId, digitalBookId))).limit(1);
  return Boolean(entitlement[0]);
}

export async function getDigitalBookReviewSummary(digitalBookId: number) {
  const db = await getDb();
  if (!db) return { reviews: [], total: 0, averageRating: 0 };
  const reviews = await db.select({
    id: digitalBookReviews.id,
    rating: digitalBookReviews.rating,
    title: digitalBookReviews.title,
    body: digitalBookReviews.body,
    createdAt: digitalBookReviews.createdAt,
    updatedAt: digitalBookReviews.updatedAt,
  }).from(digitalBookReviews).where(eq(digitalBookReviews.digitalBookId, digitalBookId)).orderBy(desc(digitalBookReviews.updatedAt));
  const total = reviews.length;
  const averageRating = total ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / total).toFixed(1)) : 0;
  return { reviews: reviews.map(review => ({ ...review, readerLabel: "قارئ موثّق" })), total, averageRating };
}

export async function getUserDigitalBookReview(userId: number, digitalBookId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(digitalBookReviews)
    .where(and(eq(digitalBookReviews.userId, userId), eq(digitalBookReviews.digitalBookId, digitalBookId))).limit(1);
  return rows[0];
}

export async function upsertDigitalBookReview(userId: number, input: DigitalBookReviewInput) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  if (!(await canUserReviewDigitalBook(userId, input.digitalBookId))) throw new Error("لا يمكنك مراجعة هذا الكتاب قبل امتلاك صلاحية قراءته.");
  await db.insert(digitalBookReviews).values({ userId, ...input }).onDuplicateKeyUpdate({ set: { rating: input.rating, title: input.title, body: input.body } });
  return getUserDigitalBookReview(userId, input.digitalBookId);
}

export type LocalProductInput = {
  handle: string;
  title: string;
  description: string;
  category: "كتب" | "ملابس" | "أجهزة" | "متنوعة";
  tags: string;
  price: string;
  currencyCode: string;
  inventory: number;
  isAvailable: number;
  imageKey?: string | null;
  imageUrl?: string | null;
};

export async function listLocalProducts(onlyAvailable = false) {
  const db = await getDb();
  if (!db) return [];
  return onlyAvailable ? db.select().from(localProducts).where(eq(localProducts.isAvailable, 1)).orderBy(desc(localProducts.updatedAt)) : db.select().from(localProducts).orderBy(desc(localProducts.updatedAt));
}

export async function createLocalProduct(input: LocalProductInput) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  await db.insert(localProducts).values(input);
}

export async function updateLocalProduct(productId: number, input: LocalProductInput) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  await db.update(localProducts).set(input).where(eq(localProducts.id, productId));
}

export async function removeLocalProduct(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  await db.delete(localProducts).where(eq(localProducts.id, productId));
}

export type WishlistItemInput = {
  itemType: "منتج" | "كتاب رقمي";
  itemId: number;
  title: string;
  subtitle: string;
  price: string;
  currencyCode: string;
  imageUrl?: string | null;
  targetPath: string;
};

export async function listWishlistItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wishlistItems).where(eq(wishlistItems.userId, userId)).orderBy(desc(wishlistItems.createdAt));
}

export async function saveWishlistItem(userId: number, item: WishlistItemInput) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  await db.insert(wishlistItems).values({ userId, ...item }).onDuplicateKeyUpdate({ set: { title: item.title, subtitle: item.subtitle, price: item.price, currencyCode: item.currencyCode, imageUrl: item.imageUrl, targetPath: item.targetPath } });
}

export async function removeWishlistItem(userId: number, itemType: WishlistItemInput["itemType"], itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  await db.delete(wishlistItems).where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.itemType, itemType), eq(wishlistItems.itemId, itemId)));
}

export async function createLocalProductOrder(input: { productId: number; userId: number; customerName: string; customerPhone: string; shippingAddress: string; country: string; city: string; paymentMethod: (typeof paymentMethods)[number] }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const product = (await tx.select().from(localProducts).where(eq(localProducts.id, input.productId)).limit(1))[0];
    if (!product || !product.isAvailable || product.inventory < 1) throw new Error("هذا المنتج غير متاح للطلب حاليًا.");
    const suffix = `${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const orderNumber = `LP-${suffix}`;
    const paymentReference = `PAY-${suffix}`;
    const total = Number(product.price).toFixed(2);
    const inserted = await tx.insert(orders).values({ orderNumber, userId: input.userId, sourceCartId: `local-product-${product.id}-${suffix}`, customerName: input.customerName, customerPhone: input.customerPhone, shippingAddress: input.shippingAddress, country: input.country, city: input.city, paymentMethod: input.paymentMethod, total, currencyCode: product.currencyCode, paymentReference, checkoutUrl: "" });
    const orderId = Number(inserted[0].insertId);
    await tx.insert(orderItems).values({ orderId, variantId: `local-product-${product.id}`, productHandle: product.handle, productTitle: product.title, variantTitle: product.category, imageUrl: product.imageUrl, unitPrice: total, quantity: 1, lineTotal: total });
    const stockUpdate = await tx.update(localProducts).set({ inventory: product.inventory - 1 }).where(and(eq(localProducts.id, product.id), gt(localProducts.inventory, 0)));
    if (!stockUpdate[0].affectedRows) throw new Error("نفد مخزون المنتج أثناء تسجيل الطلب. حدّث الصفحة وحاول مجددًا.");
    return { orderId, orderNumber, paymentReference, total, currencyCode: product.currencyCode };
  });
}

export async function listAllDigitalBooks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(digitalBooks).orderBy(desc(digitalBooks.updatedAt));
}

/** يحذف سجل الكتاب وكل صلاحياته ومواضع القراءة؛ يصبح ملف التخزين غير مرجعي وغير قابل للوصول من التطبيق. */
export async function removeDigitalBook(bookId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  await db.transaction(async tx => {
    const existing = await tx.select().from(digitalBooks).where(eq(digitalBooks.id, bookId)).limit(1);
    if (!existing[0]) throw new Error("لم يتم العثور على ملف الكتاب.");
    await tx.delete(readingProgress).where(eq(readingProgress.digitalBookId, bookId));
    await tx.delete(digitalBookReviews).where(eq(digitalBookReviews.digitalBookId, bookId));
    await tx.delete(digitalBookEvents).where(eq(digitalBookEvents.digitalBookId, bookId));
    await tx.delete(digitalBookDownloads).where(eq(digitalBookDownloads.digitalBookId, bookId));
    await tx.delete(digitalEntitlements).where(eq(digitalEntitlements.digitalBookId, bookId));
    await tx.delete(digitalBooks).where(eq(digitalBooks.id, bookId));
  });
}

export async function listDigitalBooksForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ book: digitalBooks, entitlement: digitalEntitlements }).from(digitalEntitlements).innerJoin(digitalBooks, eq(digitalEntitlements.digitalBookId, digitalBooks.id)).where(eq(digitalEntitlements.userId, userId)).orderBy(desc(digitalEntitlements.grantedAt));
}

export async function getReadableBook(productHandle: string, userId: number, isAdmin: boolean) {
  const db = await getDb();
  if (!db) return undefined;
  if (isAdmin) {
    const books = await db.select().from(digitalBooks).where(eq(digitalBooks.productHandle, productHandle)).limit(1);
    return books[0];
  }
  const books = await db.select({ book: digitalBooks }).from(digitalEntitlements).innerJoin(digitalBooks, eq(digitalEntitlements.digitalBookId, digitalBooks.id)).where(and(eq(digitalEntitlements.userId, userId), eq(digitalBooks.productHandle, productHandle))).limit(1);
  return books[0]?.book;
}

export async function getDigitalBookDownloadInfo(userId: number, digitalBookId: number, isAdmin: boolean) {
  if (isAdmin) return { downloadCount: 0, maxDownloads: 0, remainingDownloads: null as number | null };
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const rows = await db.select({ downloadCount: digitalEntitlements.downloadCount, maxDownloads: digitalBooks.maxDownloads })
    .from(digitalEntitlements).innerJoin(digitalBooks, eq(digitalEntitlements.digitalBookId, digitalBooks.id))
    .where(and(eq(digitalEntitlements.userId, userId), eq(digitalEntitlements.digitalBookId, digitalBookId))).limit(1);
  const info = rows[0];
  if (!info) throw new Error("لا تملك صلاحية تنزيل هذا الكتاب.");
  return { downloadCount: info.downloadCount, maxDownloads: info.maxDownloads, remainingDownloads: remainingDownloads(info.maxDownloads, info.downloadCount) };
}

export async function registerDigitalBookDownload(userId: number, digitalBookId: number, isAdmin: boolean) {
  if (isAdmin) return { downloadCount: 0, maxDownloads: 0, remainingDownloads: null as number | null };
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db.transaction(async tx => {
    const rows = await tx.select({ downloadCount: digitalEntitlements.downloadCount, maxDownloads: digitalBooks.maxDownloads })
      .from(digitalEntitlements).innerJoin(digitalBooks, eq(digitalEntitlements.digitalBookId, digitalBooks.id))
      .where(and(eq(digitalEntitlements.userId, userId), eq(digitalEntitlements.digitalBookId, digitalBookId))).limit(1);
    const entitlement = rows[0];
    if (!entitlement) throw new Error("لا تملك صلاحية تنزيل هذا الكتاب.");
    const capped = entitlement.maxDownloads > 0;
    const condition = capped
      ? and(eq(digitalEntitlements.userId, userId), eq(digitalEntitlements.digitalBookId, digitalBookId), lt(digitalEntitlements.downloadCount, entitlement.maxDownloads))
      : and(eq(digitalEntitlements.userId, userId), eq(digitalEntitlements.digitalBookId, digitalBookId));
    const update = await tx.update(digitalEntitlements).set({ downloadCount: sql`${digitalEntitlements.downloadCount} + 1` }).where(condition);
    if (!update[0].affectedRows) throw new Error("تم بلوغ الحد المسموح لتنزيل هذا الكتاب.");
    await tx.insert(digitalBookDownloads).values({ digitalBookId, userId });
    const downloadCount = entitlement.downloadCount + 1;
    return { downloadCount, maxDownloads: entitlement.maxDownloads, remainingDownloads: remainingDownloads(entitlement.maxDownloads, downloadCount) };
  });
}

export async function getReadingProgress(userId: number, digitalBookId: number) {
  const db = await getDb();
  if (!db) return 1;
  const rows = await db.select().from(readingProgress).where(and(eq(readingProgress.userId, userId), eq(readingProgress.digitalBookId, digitalBookId))).limit(1);
  return rows[0]?.lastPage ?? 1;
}

export async function saveReadingProgress(userId: number, digitalBookId: number, lastPage: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  await db.insert(readingProgress).values({ userId, digitalBookId, lastPage }).onDuplicateKeyUpdate({ set: { lastPage } });
}

export type StoreSettingsInput = {
  storeName: string;
  heroEyebrow: string;
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  footerDescription: string;
};

const defaultStoreSettings: StoreSettingsInput = {
  storeName: "سوقك العربي",
  heroEyebrow: "اختيارات منتقاة لك",
  heroTitle: "كل ما تحتاجه،",
  heroHighlight: "في مكان عربي واحد.",
  heroDescription: "استكشف كتبًا ملهمة وملابس مختارة وأجهزة عملية عبر تجربة تسوق مصممة بوضوح وسهولة.",
  footerDescription: "وجهة عربية هادئة لاكتشاف الكتب والملابس والأجهزة، بتجربة تسوق واضحة من الاختيار حتى الدفع.",
};

export async function getStoreSettings() {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  const existing = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(storeSettings).values({ id: 1, ...defaultStoreSettings });
  const created = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
  if (!created[0]) throw new Error("تعذر إعداد محتوى المتجر.");
  return created[0];
}

export async function updateStoreSettings(values: StoreSettingsInput) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  await db.insert(storeSettings).values({ id: 1, ...values }).onDuplicateKeyUpdate({ set: values });
  return getStoreSettings();
}
