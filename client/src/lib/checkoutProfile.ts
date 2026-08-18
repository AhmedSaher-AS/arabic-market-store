export const CHECKOUT_PROFILE_STORAGE_KEY = "arabic-market-checkout-profile-v1";
export const paymentMethods = ["فودافون كاش", "فوري", "واتساب", "إنستا باي", "فيزا/ماستركارد", "PayPal"] as const;

export type PaymentMethod = (typeof paymentMethods)[number];

export type CheckoutProfile = {
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
};

const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

export function normalizeEgyptianMobile(value: string): string | null {
  const digits = value.replace(/[٠-٩]/g, digit => String(arabicDigits.indexOf(digit))).replace(/\D/g, "");
  const local = digits.startsWith("0020") ? `0${digits.slice(4)}` : digits.startsWith("20") ? `0${digits.slice(2)}` : digits;
  return /^01[0125]\d{8}$/.test(local) ? local : null;
}

export function parseCheckoutProfile(raw: string | null): CheckoutProfile | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const candidate = value as Partial<CheckoutProfile>;
    if (typeof candidate.customerName !== "string" || typeof candidate.customerPhone !== "string") return null;
    const customerName = candidate.customerName.trim();
    const customerPhone = normalizeEgyptianMobile(candidate.customerPhone);
    if (!customerName || !customerPhone) return null;
    const paymentMethod = typeof candidate.paymentMethod === "string" && paymentMethods.includes(candidate.paymentMethod as PaymentMethod) ? candidate.paymentMethod as PaymentMethod : "فودافون كاش";
    return { customerName, customerPhone, paymentMethod };
  } catch {
    return null;
  }
}

export function loadCheckoutProfile(): CheckoutProfile | null {
  if (typeof window === "undefined") return null;
  try {
    return parseCheckoutProfile(window.localStorage.getItem(CHECKOUT_PROFILE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveCheckoutProfile(profile: CheckoutProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHECKOUT_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function clearCheckoutProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHECKOUT_PROFILE_STORAGE_KEY);
}
