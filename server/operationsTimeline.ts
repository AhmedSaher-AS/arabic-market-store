type RevenueOrder = { createdAt: Date; total: string | number; paymentStatus: string; status: string };

function dayKey(date: Date) { return date.toISOString().slice(0, 10); }

export function buildRevenueTimeline(orders: RevenueOrder[], now = new Date(), days = 7) {
  const rows = Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1 - index)));
    return { date: dayKey(date), label: new Intl.DateTimeFormat("ar-EG", { weekday: "short", timeZone: "UTC" }).format(date), revenue: 0, orders: 0 };
  });
  const byDate = new Map(rows.map(row => [row.date, row]));
  orders.filter(order => order.paymentStatus === "مدفوع" || order.status === "مكتمل").forEach(order => {
    const row = byDate.get(dayKey(order.createdAt));
    if (!row) return;
    row.revenue += Number(order.total) || 0;
    row.orders += 1;
  });
  return rows.map(row => ({ ...row, revenue: Number(row.revenue.toFixed(2)) }));
}
