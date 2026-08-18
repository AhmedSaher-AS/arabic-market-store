export const CHECKOUT_PROFILE_STORAGE_KEY = "arabic-market-checkout-profile-v1";

export type CheckoutProfile = {
  customerName: string;
  customerPhone: string;
};

export function parseCheckoutProfile(raw: string | null): CheckoutProfile | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const candidate = value as Partial<CheckoutProfile>;
    if (typeof candidate.customerName !== "string" || typeof candidate.customerPhone !== "string") return null;
    const customerName = candidate.customerName.trim();
    const customerPhone = candidate.customerPhone.trim();
    if (!customerName || !customerPhone) return null;
    return { customerName, customerPhone };
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
