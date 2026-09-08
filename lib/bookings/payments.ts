import "server-only";

export type PaymentSession = {
  provider: "pending_provider";
  bookingId: string;
  redirectUrl: string | null;
};

export async function createPaymentSession(bookingId: string): Promise<PaymentSession> {
  return { provider: "pending_provider", bookingId, redirectUrl: null };
}

export async function finalizeBookingAfterPayment(_bookingId: string) {
  throw new Error("Payment finalization is reserved for a future provider webhook.");
}

export async function handlePaymentFailure(_bookingId: string) {
  return { status: "payment_failed_deferred" as const };
}

export async function handlePaymentExpiration(_bookingId: string) {
  return { status: "payment_expiration_deferred" as const };
}
