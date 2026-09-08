import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock, MessageCircle, Users } from "lucide-react";
import { canGuestCancel } from "@/lib/bookings/constants";
import { formatBookingRange, minutesUntil } from "@/lib/bookings/time";
import { formatMoney } from "@/lib/marketplace/pricing";
import type { BookingCard as BookingCardData } from "@/lib/data-access/bookings";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { CancelBookingForm } from "@/components/booking/BookingActionForm";

export function BookingCard({ booking }: { booking: BookingCardData }) {
  const remaining = minutesUntil(booking.holdExpiresAt);

  return (
    <article className="grid gap-5 rounded-xl border hairline bg-white/[0.025] p-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:p-5">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-sinner-coal sm:aspect-auto sm:min-h-32">
        <Image src={booking.space.coverPhoto} alt={booking.space.name} fill sizes="150px" className="object-cover" />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-sinner-goldSoft">{booking.bookingReference}</p>
            <h2 className="mt-1 font-display text-3xl text-sinner-ivory">{booking.space.name}</h2>
            <p className="mt-2 text-sm text-sinner-mist">{booking.space.approximateLocation}</p>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>
        <div className="mt-5 grid gap-3 text-sm text-sinner-mist sm:grid-cols-2">
          <span className="flex items-center gap-2"><CalendarDays size={16} />{formatBookingRange(booking.startDatetime, booking.endDatetime, booking.timezone)}</span>
          <span className="flex items-center gap-2"><Clock size={16} />{booking.durationHours} hours · {booking.timezone}</span>
          <span className="flex items-center gap-2"><Users size={16} />{booking.guestCount} guests</span>
          <span className="font-semibold text-sinner-ivory">{formatMoney(booking.totalAmount, booking.currency)} {booking.currency}</span>
        </div>
        {booking.status === "payment_pending" && remaining !== null ? <p className="mt-4 text-sm text-sinner-goldSoft">Temporary hold expires in {remaining} min.</p> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/bookings/${booking.id}`} className="flex min-h-11 items-center rounded-lg border border-sinner-gold/25 px-4 text-sm font-semibold text-sinner-goldSoft hover:bg-sinner-gold/10">View booking</Link>
          <Link href="/messages" className="flex min-h-11 items-center gap-2 rounded-lg border hairline px-4 text-sm text-sinner-mist hover:text-white"><MessageCircle size={16} />Message host</Link>
        </div>
        {canGuestCancel(booking.status) ? <div className="mt-4"><CancelBookingForm bookingId={booking.id} returnPath="/bookings" label={booking.status === "pending" ? "Cancel request" : "Cancel hold"} /></div> : null}
      </div>
    </article>
  );
}
