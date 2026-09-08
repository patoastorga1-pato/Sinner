import { notFound } from "next/navigation";
import Link from "next/link";
import { Banknote, Building2, CalendarDays, LayoutDashboard, MessageCircle, NotebookTabs } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { ApproveBookingForm, DeclineBookingForm } from "@/components/booking/BookingActionForm";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { requireRole } from "@/lib/auth/server";
import { canHostApprove, canHostDecline, type AppBookingStatus } from "@/lib/bookings/constants";
import { formatBookingRange } from "@/lib/bookings/time";
import { getHostAvailabilityBlocks, getHostBookings } from "@/lib/data-access/bookings";
import { formatMoney } from "@/lib/marketplace/pricing";
import type { RawSearchParams } from "@/lib/types/marketplace";

const sections = {
  dashboard: { title: "Host Dashboard", copy: "A private overview of your hosting activity.", empty: "Your host workspace is ready.", detail: "Create your first listing in Phase 2 to begin receiving booking requests.", icon: LayoutDashboard },
  listings: { title: "Host Listings", copy: "Manage draft, pending and approved spaces.", empty: "List your first space.", detail: "The listing editor and media upload flow arrive in Phase 2.", icon: Building2 },
  bookings: { title: "Host Bookings", copy: "Review requests associated with spaces you own.", empty: "No booking requests yet.", detail: "Requests will appear here after booking functionality is enabled.", icon: NotebookTabs },
  calendar: { title: "Host Calendar", copy: "Hourly availability and reservation blocks.", empty: "No availability configured.", detail: "The hourly availability engine is planned for Phase 2.", icon: CalendarDays },
  messages: { title: "Host Messages", copy: "Private conversations linked to listings and bookings.", empty: "No host conversations yet.", detail: "Only conversation participants will be able to access messages.", icon: MessageCircle },
  earnings: { title: "Host Earnings", copy: "Future payouts and earning summaries.", empty: "Payments are not enabled.", detail: "SINNER does not process payments or payouts in this phase.", icon: Banknote },
} as const;

function HostBookingDashboard({ bookings, error, success }: { bookings: Awaited<ReturnType<typeof getHostBookings>>; error?: string; success?: string }) {
  const tabs: Array<{ key: string; label: string; statuses: AppBookingStatus[] }> = [
    { key: "requests", label: "Requests", statuses: ["pending"] },
    { key: "payment", label: "Payment Pending", statuses: ["payment_pending"] },
    { key: "upcoming", label: "Upcoming", statuses: ["confirmed"] },
    { key: "completed", label: "Completed", statuses: ["completed"] },
    { key: "cancelled", label: "Cancelled", statuses: ["cancelled", "declined", "expired", "refunded"] },
  ] as const;

  return (
    <>
      <StatusMessage error={error} success={success} />
      <div className="grid gap-8">
        {tabs.map((tab) => {
          const visible = bookings.filter((booking) => tab.statuses.includes(booking.status));
          if (!visible.length) return null;
          return (
            <section key={tab.key}>
              <h2 className="font-display text-3xl text-sinner-ivory">{tab.label}</h2>
              <div className="mt-4 grid gap-4">
                {visible.map((booking) => (
                  <article key={booking.id} className="rounded-xl border hairline bg-white/[0.025] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-sinner-goldSoft">{booking.bookingReference}</p>
                        <h3 className="mt-1 font-display text-3xl text-sinner-ivory">{booking.space.name}</h3>
                        <p className="mt-2 text-sm text-sinner-mist">{booking.guestDisplayName ?? "Verified guest"} · {booking.guestCount} guests</p>
                      </div>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <div className="mt-5 grid gap-3 text-sm text-sinner-mist md:grid-cols-3">
                      <span>{formatBookingRange(booking.startDatetime, booking.endDatetime, booking.timezone)}</span>
                      <span>{booking.durationHours} hours · {booking.timezone}</span>
                      <span className="font-semibold text-sinner-ivory">{formatMoney(booking.totalAmount, booking.currency)} {booking.currency}</span>
                    </div>
                    {booking.guestMessage ? <p className="mt-4 rounded-lg border hairline bg-black/20 p-4 text-sm leading-6 text-sinner-mist">{booking.guestMessage}</p> : null}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link href={`/bookings/${booking.id}`} className="flex min-h-11 items-center rounded-lg border hairline px-4 text-sm text-sinner-mist hover:text-white">View booking</Link>
                    </div>
                    {canHostApprove(booking.status) || canHostDecline(booking.status) ? (
                      <div className="mt-5 grid gap-3 border-t hairline pt-5 md:grid-cols-[auto_minmax(0,1fr)]">
                        {canHostApprove(booking.status) ? <ApproveBookingForm bookingId={booking.id} returnPath="/host/bookings" /> : null}
                        {canHostDecline(booking.status) ? <DeclineBookingForm bookingId={booking.id} returnPath="/host/bookings" /> : null}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
        {!bookings.length ? <EmptyState icon={NotebookTabs} title="No booking requests yet." copy="Requests and temporary holds for your spaces will appear here." /> : null}
      </div>
    </>
  );
}

function HostCalendarPrep({ bookings, blocks }: { bookings: Awaited<ReturnType<typeof getHostBookings>>; blocks: Awaited<ReturnType<typeof getHostAvailabilityBlocks>> }) {
  const visible = bookings.filter((booking) => ["pending", "payment_pending", "confirmed"].includes(booking.status)).slice(0, 12);
  return (
    <div className="grid gap-8">
      <section>
        <h2 className="font-display text-3xl text-sinner-ivory">Availability blocks</h2>
        <div className="mt-4 grid gap-3">
          {blocks.length ? blocks.map((block) => (
            <article key={block.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border hairline bg-white/[0.025] p-4">
              <div><p className="text-sm font-medium text-sinner-ivory">{block.spaceName}</p><p className="mt-1 text-sm text-sinner-mist">{block.date} · {block.startTime}-{block.endTime}</p></div>
              <span className="rounded-full border border-sinner-gold/25 px-3 py-1 text-xs font-semibold uppercase text-sinner-goldSoft">{block.status}</span>
            </article>
          )) : <p className="text-sm text-sinner-mist">No manual availability blocks are visible yet.</p>}
        </div>
      </section>
      <section>
      <h2 className="font-display text-3xl text-sinner-ivory">Reservations and requests</h2>
      <div className="mt-4 grid gap-4">
      {visible.length ? visible.map((booking) => (
        <article key={booking.id} className="rounded-xl border hairline bg-white/[0.025] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase text-sinner-goldSoft">{booking.space.name}</p><h2 className="mt-1 font-display text-3xl text-sinner-ivory">{formatBookingRange(booking.startDatetime, booking.endDatetime, booking.timezone)}</h2></div>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="mt-3 text-sm text-sinner-mist">{booking.bookingReference} · {booking.durationHours} hours · includes configured cleaning buffer in conflict checks.</p>
        </article>
      )) : <EmptyState icon={CalendarDays} title="No active calendar items." copy="Pending requests, payment holds and confirmed reservations will be visible here." />}
      </div>
      </section>
    </div>
  );
}

export default async function HostSectionPage({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<RawSearchParams & { error?: string; success?: string }> }) {
  const { section: sectionKey } = await params;
  const section = sections[sectionKey as keyof typeof sections];
  if (!section) notFound();
  const [, query] = await Promise.all([requireRole("host", `/host/${sectionKey}`), searchParams]);
  if (sectionKey === "bookings") {
    const bookings = await getHostBookings();
    return <AccountShell eyebrow="Host tools" title={section.title} copy={section.copy}><HostBookingDashboard bookings={bookings} error={query.error as string | undefined} success={query.success as string | undefined} /></AccountShell>;
  }
  if (sectionKey === "calendar") {
    const [bookings, blocks] = await Promise.all([getHostBookings(), getHostAvailabilityBlocks()]);
    return <AccountShell eyebrow="Host tools" title={section.title} copy={section.copy}><HostCalendarPrep bookings={bookings} blocks={blocks} /></AccountShell>;
  }
  return <AccountShell eyebrow="Host tools" title={section.title} copy={section.copy}><EmptyState icon={section.icon} title={section.empty} copy={section.detail} /></AccountShell>;
}
