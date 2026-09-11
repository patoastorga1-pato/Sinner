import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, ReceiptText, ShieldCheck, Star, UserRound, Users } from "lucide-react";
import { createReviewAction } from "@/app/actions/reviews";
import { notFound } from "next/navigation";
import { AccountShell } from "@/components/account/AccountShell";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { CancelBookingForm } from "@/components/booking/BookingActionForm";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { requireUser } from "@/lib/auth/server";
import { canGuestCancel } from "@/lib/bookings/constants";
import { formatBookingDate, formatBookingRange, formatBookingTime, minutesUntil } from "@/lib/bookings/time";
import { getBookingDetail, getUserReviewForBooking } from "@/lib/data-access/bookings";
import { formatMoney } from "@/lib/marketplace/pricing";
import type { RawSearchParams } from "@/lib/types/marketplace";

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams & { error?: string; success?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const auth = await requireUser(`/bookings/${id}`);
  const [booking, userReview] = await Promise.all([getBookingDetail(id), getUserReviewForBooking(id, auth.user.id)]);
  if (!booking) notFound();
  const holdMinutes = minutesUntil(booking.holdExpiresAt);

  return (
    <AccountShell title={booking.bookingReference} copy="Booking status, pricing snapshot and audit history.">
      <Link href="/bookings" className="inline-flex items-center gap-2 text-sm text-sinner-goldSoft"><ArrowLeft size={16} />Back to bookings</Link>
      <StatusMessage error={query.error as string | undefined} success={query.success as string | undefined} />
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <section className="overflow-hidden rounded-xl border hairline bg-white/[0.025]">
            <div className="relative aspect-[16/9] min-h-56">
              <Image src={booking.space.coverPhoto} alt={booking.space.name} fill sizes="(max-width: 1024px) 100vw, 700px" className="object-cover" />
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-sinner-goldSoft">{booking.bookingType === "instant" ? "Instant booking" : "Request to book"}</p>
                  <h2 className="mt-2 font-display text-4xl text-sinner-ivory">{booking.space.name}</h2>
                  <p className="mt-3 text-sm text-sinner-mist">{booking.space.approximateLocation}</p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-x-8 sm:grid-cols-2">
            {[{ icon: CalendarDays, label: "Date", value: formatBookingDate(booking.startDatetime, booking.timezone) }, { icon: Clock, label: "Time", value: `${formatBookingTime(booking.startDatetime, booking.timezone)}-${formatBookingTime(booking.endDatetime, booking.timezone)} · ${booking.timezone}` }, { icon: Users, label: "Guests", value: String(booking.guestCount) }, { icon: ShieldCheck, label: "Duration", value: `${booking.durationHours} hours` }].map((item) => { const Icon = item.icon; return <div key={item.label} className="flex gap-3 border-b hairline py-5"><Icon size={18} className="mt-0.5 shrink-0 text-sinner-goldSoft" /><div><p className="text-xs uppercase text-sinner-mist/60">{item.label}</p><p className="mt-1 text-sm text-sinner-ivory">{item.value}</p></div></div>; })}
          </section>

          {booking.status === "payment_pending" ? <div className="mt-8 rounded-xl border border-sinner-gold/25 bg-sinner-gold/5 p-5 text-sm leading-6 text-sinner-goldSoft">Reservation temporarily held. Payment will be required to confirm this reservation{holdMinutes !== null ? ` within ${holdMinutes} min` : ""}.</div> : null}
          {booking.status === "pending" ? <div className="mt-8 rounded-xl border border-amber-300/25 bg-amber-400/5 p-5 text-sm leading-6 text-amber-100">Request sent. Your host will review your request.</div> : null}

          <section className="mt-10 border-t hairline pt-8">
            <h2 className="font-display text-4xl text-sinner-ivory">Audit history</h2>
            <div className="mt-5 divide-y hairline border-y hairline">
              {booking.events.length ? booking.events.map((event) => <div key={event.id} className="py-4 text-sm"><p className="font-medium text-sinner-ivory">{event.eventType.replace(/_/g, " ")}</p><p className="mt-1 text-sinner-mist">{event.fromStatus ? `${event.fromStatus} -> ${event.toStatus}` : event.toStatus ?? "Recorded"} · {formatBookingRange(event.createdAt, event.createdAt, booking.timezone)}</p></div>) : <p className="py-4 text-sm text-sinner-mist">No audit events are visible yet.</p>}
            </div>
          </section>

          {booking.status === "completed" ? (
            <section className="mt-10 border-t hairline pt-8">
              <div className="flex items-center gap-3"><Star size={19} className="text-sinner-goldSoft" /><h2 className="font-display text-4xl text-sinner-ivory">Review this space</h2></div>
              {userReview ? (
                <div className="mt-5 rounded-xl border hairline bg-white/[0.025] p-5">
                  <p className="font-medium text-sinner-ivory">{userReview.overallRating}/5 overall</p>
                  {userReview.comment ? <p className="mt-3 text-sm leading-6 text-sinner-mist">{userReview.comment}</p> : null}
                  <p className="mt-4 text-xs text-sinner-mist/70">Published {new Date(userReview.createdAt).toLocaleDateString()}</p>
                </div>
              ) : (
                <form action={createReviewAction} className="mt-5 grid gap-5 rounded-xl border hairline bg-white/[0.025] p-5">
                  <input type="hidden" name="booking_id" value={booking.id} />
                  <input type="hidden" name="return_path" value={`/bookings/${booking.id}`} />
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      ["overall_rating", "Overall"],
                      ["cleanliness_rating", "Cleanliness"],
                      ["privacy_rating", "Privacy"],
                      ["accuracy_rating", "Accuracy"],
                      ["host_rating", "Host"],
                      ["discretion_rating", "Discretion"],
                    ].map(([name, label]) => (
                      <label key={name} className="grid gap-2 text-sm text-sinner-ivory">
                        <span>{label}</span>
                        <select name={name} required={name === "overall_rating"} defaultValue="" className="h-11 rounded-lg border hairline bg-black/35 px-3 text-white outline-none">
                          <option value="" disabled>Rating</option>
                          {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}</option>)}
                        </select>
                      </label>
                    ))}
                  </div>
                  <label className="grid gap-2 text-sm text-sinner-ivory">
                    <span>Comment</span>
                    <textarea name="comment" rows={4} maxLength={3000} className="rounded-lg border hairline bg-black/35 px-4 py-3 text-white outline-none" />
                  </label>
                  <button type="submit" className="min-h-11 w-fit rounded-lg bg-sinner-gold px-5 text-sm font-semibold text-black transition hover:bg-sinner-goldSoft">Publish review</button>
                </form>
              )}
            </section>
          ) : null}
        </div>

        <aside className="premium-panel h-fit p-6 lg:sticky lg:top-24">
          <div className="flex items-center gap-3"><ReceiptText size={20} className="text-sinner-goldSoft" /><h2 className="font-semibold text-sinner-ivory">Price snapshot</h2></div>
          <div className="mt-5 space-y-3 text-sm text-sinner-mist">
            <div className="flex justify-between gap-4"><span>Rate snapshot</span><span>{formatMoney(booking.hourlyRateSnapshot, booking.currency)} {booking.currency}</span></div>
            <div className="flex justify-between gap-4"><span>Base amount</span><span>{formatMoney(booking.baseAmount, booking.currency)} {booking.currency}</span></div>
            <div className="flex justify-between gap-4"><span>Cleaning fee</span><span>{formatMoney(booking.cleaningFee, booking.currency)} {booking.currency}</span></div>
            <div className="flex justify-between gap-4"><span>Service fee</span><span>{formatMoney(booking.serviceFee, booking.currency)} {booking.currency}</span></div>
            <div className="flex justify-between border-t hairline pt-4 font-semibold text-sinner-ivory"><span>Total</span><span>{formatMoney(booking.totalAmount, booking.currency)} {booking.currency}</span></div>
          </div>
          <div className="mt-7 border-t hairline pt-6">
            <div className="flex gap-3 text-sm text-sinner-mist"><UserRound size={18} className="shrink-0 text-sinner-goldSoft" /><span>{booking.space.hostName}</span></div>
            <p className="mt-4 text-xs leading-5 text-sinner-mist/70">Exact address is still protected in Phase 3 and is not exposed for pending or payment-pending bookings.</p>
          </div>
          {canGuestCancel(booking.status) ? <div className="mt-6 border-t hairline pt-6"><CancelBookingForm bookingId={booking.id} returnPath={`/bookings/${booking.id}`} label={booking.status === "pending" ? "Cancel request" : "Cancel temporary hold"} /></div> : null}
        </aside>
      </div>
    </AccountShell>
  );
}
