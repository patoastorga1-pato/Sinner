import { bookingStatusLabels, type AppBookingStatus } from "@/lib/bookings/constants";

const toneByStatus: Record<AppBookingStatus, string> = {
  draft: "border-sinner-mist/20 text-sinner-mist",
  pending: "border-amber-300/25 text-amber-200",
  payment_pending: "border-sinner-gold/30 text-sinner-goldSoft",
  confirmed: "border-emerald-300/25 text-emerald-200",
  completed: "border-sinner-mist/20 text-sinner-mist",
  declined: "border-rose-300/25 text-rose-200",
  cancelled: "border-sinner-mist/20 text-sinner-mist",
  expired: "border-sinner-mist/20 text-sinner-mist",
  refunded: "border-sinner-mist/20 text-sinner-mist",
  disputed: "border-rose-300/25 text-rose-200",
};

export function BookingStatusBadge({ status }: { status: AppBookingStatus }) {
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-3 text-xs font-semibold uppercase ${toneByStatus[status]}`}>
      {bookingStatusLabels[status]}
    </span>
  );
}
