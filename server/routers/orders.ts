import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { orderStatuses, paymentMethods } from "../../drizzle/schema";
import { createOrderFromCart, listAllOrders, listOrdersForUser, markOwnerNotified, updateOrderStatus } from "../db";
import { notifyOwner } from "../_core/notification";
import { getCart } from "../_core/shopify";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

export const orderDraftSchema = z.object({
  cartId: z.string().min(1),
  customerName: z.string().trim().min(3).max(160),
  customerPhone: z.string().trim().min(7).max(32),
  shippingAddress: z.string().trim().min(8).max(1200),
  country: z.string().trim().min(2).max(96),
  city: z.string().trim().min(2).max(96),
  paymentMethod: z.enum(paymentMethods),
});

export const ordersRouter = router({
  create: protectedProcedure.input(orderDraftSchema).mutation(async ({ ctx, input }) => {
    const cart = await getCart(input.cartId);
    if (!cart || cart.items.length === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "السلة فارغة أو انتهت صلاحيتها." });
    }

    const order = await createOrderFromCart({ ...input, userId: ctx.user.id }, cart);
    try {
      const notified = await notifyOwner({
        title: `طلب جديد ${order.orderNumber}`,
        content: `ورد طلب جديد بحالة معلق بقيمة ${order.total} ${order.currencyCode}. العميل: ${order.customerName}. طريقة الدفع: ${order.paymentMethod}.`,
      });
      if (notified) await markOwnerNotified(order.id);
    } catch (error) {
      console.warn("[Orders] Owner notification failed after order creation", error);
    }
    return order;
  }),
  mine: protectedProcedure.query(({ ctx }) => listOrdersForUser(ctx.user.id)),
  list: adminProcedure.query(() => listAllOrders()),
  updateStatus: adminProcedure
    .input(z.object({ orderId: z.number().int().positive(), status: z.enum(orderStatuses) }))
    .mutation(async ({ input }) => {
      await updateOrderStatus(input.orderId, input.status);
      return { success: true } as const;
    }),
});
