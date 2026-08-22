export function paymentProofTolerance(expectedAmount: number) {
  return Math.max(5, expectedAmount * 0.01);
}

export function isPaymentProofAmountAccepted(expectedAmount: number, paidAmount: number) {
  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) return false;
  if (!Number.isFinite(paidAmount) || paidAmount <= 0) return false;
  return Math.abs(expectedAmount - paidAmount) <= paymentProofTolerance(expectedAmount);
}
