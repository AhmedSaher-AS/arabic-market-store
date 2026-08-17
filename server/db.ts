import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { digitalBooks, digitalEntitlements, InsertUser, orderItems, orders, Order, orderStatuses, paymentProofs, paymentSettings, users } from "../drizzle/schema";
import type { Cart } from "../shared/commerce/types";
import { ENV } from './_core/env';

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
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

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
  const prefix = method === "فودافون كاش" ? "VC" : method === "فوري" ? "FW" : "PAY";
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
    await tx.update(paymentProofs).set({ status: accepted ? "مقبول" : "مرفوض", reviewNote: reviewNote || null, reviewedAt: new Date() }).where(eq(paymentProofs.id, proofId));
    await tx.update(orders).set({ paymentStatus: accepted ? "مدفوع" : "فشل", status: accepted ? "مؤكد" : "معلق" }).where(eq(orders.id, proof.orderId));
    if (!accepted) return;
    const orderedBooks = await tx.select({ bookId: digitalBooks.id }).from(orderItems).innerJoin(digitalBooks, eq(orderItems.productHandle, digitalBooks.productHandle)).where(eq(orderItems.orderId, proof.orderId));
    if (orderedBooks.length) {
      await tx.insert(digitalEntitlements).values(orderedBooks.map(book => ({ userId: proof.userId, digitalBookId: book.bookId, orderId: proof.orderId }))).onDuplicateKeyUpdate({ set: { userId: proof.userId } });
    }
  });
}

export async function upsertDigitalBook(input: typeof digitalBooks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  await db.insert(digitalBooks).values(input).onDuplicateKeyUpdate({ set: { title: input.title, fileName: input.fileName, pdfKey: input.pdfKey, pdfUrl: input.pdfUrl } });
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
