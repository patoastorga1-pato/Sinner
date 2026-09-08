import type { BookingStatus } from "@/lib/types/database";

export const bookingStatuses = [
  "draft",
  "pending",
  "payment_pending",
  "confirmed",
  "completed",
  "declined",
  "cancelled",
  "expired",
  "refunded",
  "disputed",
] as const;

export type AppBookingStatus = (typeof bookingStatuses)[number];
export type BookingType = "instant" | "request";

export const blockingBookingStatuses: AppBookingStatus[] = ["payment_pending", "confirmed"];

export const bookingStatusLabels: Record<AppBookingStatus, string> = {
  draft: "Draft",
  pending: "Pending request",
  payment_pending: "Payment pending",
  confirmed: "Confirmed",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
  expired: "Expired",
  refunded: "Refunded",
  disputed: "Disputed",
};

export const allowedBookingTransitions: Record<AppBookingStatus, AppBookingStatus[]> = {
  draft: ["pending", "payment_pending"],
  pending: ["payment_pending", "declined", "cancelled"],
  payment_pending: ["confirmed", "expired", "cancelled"],
  confirmed: ["completed", "cancelled", "refunded", "disputed"],
  completed: [],
  declined: [],
  cancelled: [],
  expired: [],
  refunded: [],
  disputed: [],
};

export const HOLD_MINUTES = {
  instant: 15,
  hostApproval: 30,
} as const;

export function toAppBookingStatus(status: BookingStatus | string): AppBookingStatus {
  return bookingStatuses.includes(status as AppBookingStatus) ? (status as AppBookingStatus) : "draft";
}

export function canTransitionBooking(from: AppBookingStatus, to: AppBookingStatus) {
  return allowedBookingTransitions[from].includes(to);
}

export function canGuestCancel(status: AppBookingStatus) {
  return status === "pending" || status === "payment_pending";
}

export function canHostApprove(status: AppBookingStatus) {
  return status === "pending";
}

export function canHostDecline(status: AppBookingStatus) {
  return status === "pending";
}
