import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Banknote, Building2, CalendarDays, Edit3, LayoutDashboard, MessageCircle, NotebookTabs, Plus, Send, Trash2 } from "lucide-react";
import { sendMessageAction } from "@/app/actions/messages";
import { updateHostListingStatusAction } from "@/app/actions/host";
import { AccountShell } from "@/components/account/AccountShell";
import { ApproveBookingForm, DeclineBookingForm } from "@/components/booking/BookingActionForm";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { requireRole } from "@/lib/auth/server";
import { canHostApprove, canHostDecline, type AppBookingStatus } from "@/lib/bookings/constants";
import { formatBookingRange } from "@/lib/bookings/time";
import { getHostAvailabilityBlocks, getHostBookings } from "@/lib/data-access/bookings";
import { getHostEarnings, getHostListings, listingStatusLabel, type HostListing } from "@/lib/data-access/host";
import { getConversationMessages, getConversations, type ConversationMessage, type ConversationSummary } from "@/lib/data-access/messages";
import { formatMoney } from "@/lib/marketplace/pricing";
import type { RawSearchParams } from "@/lib/types/marketplace";

const sections = {
  dashboard: { title: "Host Dashboard", copy: "A private overview of your hosting activity.", empty: "Your host workspace is ready.", detail: "Create your first listing to begin receiving booking requests.", icon: LayoutDashboard },
  listings: { title: "Host Listings", copy: "Manage draft, pending and approved spaces.", empty: "List your first space.", detail: "Create spaces, upload photos and submit them for review.", icon: Building2 },
  bookings: { title: "Host Bookings", copy: "Review requests associated with spaces you own.", empty: "No booking requests yet.", detail: "Requests will appear here after booking functionality is enabled.", icon: NotebookTabs },
  calendar: { title: "Host Calendar", copy: "Hourly availability and reservation blocks.", empty: "No availability configured.", detail: "The hourly availability engine is planned for Phase 2.", icon: CalendarDays },
  messages: { title: "Host Messages", copy: "Private conversations linked to listings and bookings.", empty: "No host conversations yet.", detail: "Only conversation participants can access messages.", icon: MessageCircle },
  earnings: { title: "Host Earnings", copy: "Payout-ready records for approved payments.", empty: "No payout records yet.", detail: "PandaBlue is not connected yet, but the ledger is prepared.", icon: Banknote },
} as const;

const listingStatusStyles: Record<string, string> = {
  draft: "border-white/10 bg-white/[0.03] text-sinner-mist",
  pending_review: "border-amber-300/25 bg-amber-400/5 text-amber-100",
  approved: "border-emerald-300/25 bg-emerald-500/5 text-emerald-200",
  rejected: "border-rose-300/25 bg-rose-500/5 text-rose-200",
  suspended: "border-white/10 bg-white/[0.03] text-sinner-mist",
};

function ListingStatusBadge({ status }: { status: HostListing["status"] }) {
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${listingStatusStyles[status]}`}>{listingStatusLabel(status)}</span>;
}

function HostDashboard({ listings, bookings, earnings }: { listings: HostListing[]; bookings: Awaited<ReturnType<typeof getHostBookings>>; earnings: Awaited<ReturnType<typeof getHostEarnings>> }) {
  const activeListings = listings.filter((listing) => listing.status === "approved").length;
  const pendingBookings = bookings.filter((booking) => booking.status === "pending").length;
  const upcomingBookings = bookings.filter((booking) => booking.status === "confirmed").length;

  return (
    <div className="grid gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Approved listings", activeListings],
          ["Pending review", listings.filter((listing) => listing.status === "pending_review").length],
          ["Booking requests", pendingBookings],
          ["Upcoming bookings", upcomingBookings],
        ].map(([label, value]) => (
          <article key={label} className="rounded-xl border hairline bg-white/[0.025] p-5">
            <p className="text-sm text-sinner-mist">{label}</p>
            <p className="mt-4 font-display text-4xl text-sinner-ivory">{value}</p>
          </article>
        ))}
      </div>
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="premium-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-3xl text-sinner-ivory">Recent listings</h2>
            <Link href="/host/listings/new" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-sinner-gold px-4 text-sm font-semibold text-black"><Plus size={16} />New listing</Link>
          </div>
          <div className="mt-5 grid gap-3">
            {listings.slice(0, 4).map((listing) => (
              <Link key={listing.id} href={`/host/listings/${listing.id}/edit`} className="flex items-center justify-between gap-4 rounded-lg border hairline bg-black/20 p-4 transition hover:border-sinner-gold/30">
                <div className="min-w-0">
                  <p className="truncate font-medium text-sinner-ivory">{listing.name}</p>
                  <p className="mt-1 text-sm text-sinner-mist">{listing.city}, {listing.state}</p>
                </div>
                <ListingStatusBadge status={listing.status} />
              </Link>
            ))}
            {!listings.length ? <p className="text-sm text-sinner-mist">No listings yet.</p> : null}
          </div>
        </div>
        <aside className="premium-panel p-6">
          <h2 className="font-display text-3xl text-sinner-ivory">Earnings</h2>
          <p className="mt-4 text-sm text-sinner-mist">Available ledger total</p>
          <p className="mt-2 font-display text-4xl text-sinner-ivory">{formatMoney(earnings.available, earnings.currency)} {earnings.currency}</p>
          <Link href="/host/earnings" className="mt-6 inline-flex min-h-11 items-center rounded-lg border border-sinner-gold/25 px-4 text-sm font-semibold text-sinner-goldSoft">View ledger</Link>
        </aside>
      </section>
    </div>
  );
}

function HostListingsPanel({ listings, error, success }: { listings: HostListing[]; error?: string; success?: string }) {
  return (
    <>
      <StatusMessage error={error} success={success} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-sinner-mist">{listings.length} listings in your host account</p>
        <Link href="/host/listings/new" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sinner-gold px-4 text-sm font-semibold text-black transition hover:bg-sinner-goldSoft"><Plus size={16} />New listing</Link>
      </div>
      <div className="mt-6 grid gap-5">
        {listings.map((listing) => (
          <article key={listing.id} className="grid gap-5 rounded-xl border hairline bg-white/[0.025] p-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:p-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-sinner-coal">
              <Image src={listing.coverPhoto} alt={listing.name} fill sizes="180px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-3xl text-sinner-ivory">{listing.name}</h2>
                  <p className="mt-2 text-sm text-sinner-mist">{listing.locality ? `${listing.locality}, ` : ""}{listing.city}, {listing.state}</p>
                </div>
                <ListingStatusBadge status={listing.status} />
              </div>
              <p className="mt-4 line-clamp-2 text-sm leading-6 text-sinner-mist">{listing.shortDescription || listing.description || "No description yet."}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/host/listings/${listing.id}/edit`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-sinner-gold/25 px-4 text-sm font-semibold text-sinner-goldSoft transition hover:bg-sinner-gold/10"><Edit3 size={16} />Edit</Link>
                <form action={updateHostListingStatusAction}>
                  <input type="hidden" name="listing_id" value={listing.id} />
                  <input type="hidden" name="return_path" value="/host/listings" />
                  <button name="intent" value="submit" type="submit" className="min-h-11 rounded-lg border hairline px-4 text-sm text-sinner-mist transition hover:text-white">Submit review</button>
                </form>
                {listing.status !== "draft" ? (
                  <form action={updateHostListingStatusAction}>
                    <input type="hidden" name="listing_id" value={listing.id} />
                    <input type="hidden" name="return_path" value="/host/listings" />
                    <button name="intent" value="draft" type="submit" className="min-h-11 rounded-lg border hairline px-4 text-sm text-sinner-mist transition hover:text-white">Move to draft</button>
                  </form>
                ) : (
                  <form action={updateHostListingStatusAction}>
                    <input type="hidden" name="listing_id" value={listing.id} />
                    <input type="hidden" name="return_path" value="/host/listings" />
                    <button name="intent" value="delete" type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-rose-300/25 px-4 text-sm text-rose-200 transition hover:bg-rose-500/10"><Trash2 size={16} />Delete draft</button>
                  </form>
                )}
              </div>
            </div>
          </article>
        ))}
        {!listings.length ? <EmptyState icon={Building2} title="List your first space." copy="Create a draft, upload photos and submit it for admin review." actionLabel="New listing" actionHref="/host/listings/new" /> : null}
      </div>
    </>
  );
}

function HostMessagesPanel({ conversations, selectedId, messages, error, success }: { conversations: ConversationSummary[]; selectedId: string | null; messages: ConversationMessage[]; error?: string; success?: string }) {
  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0];

  return (
    <>
      <StatusMessage error={error} success={success} />
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="premium-panel max-h-[680px] overflow-y-auto p-3">
          {conversations.map((conversation) => (
            <Link key={conversation.id} href={`/host/messages?conversation=${conversation.id}`} className={`block rounded-lg p-4 transition ${selected?.id === conversation.id ? "bg-sinner-gold/10 text-sinner-ivory" : "text-sinner-mist hover:bg-white/[0.04]"}`}>
              <p className="truncate font-medium">{conversation.participantName}</p>
              <p className="mt-1 truncate text-xs">{conversation.spaceName}</p>
              <p className="mt-2 line-clamp-2 text-sm">{conversation.lastMessage || "No messages yet."}</p>
            </Link>
          ))}
          {!conversations.length ? <p className="p-4 text-sm text-sinner-mist">No conversations yet.</p> : null}
        </aside>
        <section className="premium-panel min-h-[520px] p-5">
          {selected ? (
            <>
              <div className="border-b hairline pb-4">
                <p className="text-xs font-semibold uppercase text-sinner-goldSoft">{selected.spaceName}</p>
                <h2 className="mt-1 font-display text-3xl text-sinner-ivory">{selected.participantName}</h2>
              </div>
              <div className="mt-5 grid gap-3">
                {messages.map((message) => (
                  <div key={message.id} className={`max-w-[82%] rounded-xl border hairline p-4 text-sm leading-6 ${message.mine ? "ml-auto bg-sinner-gold/10 text-sinner-ivory" : "bg-black/25 text-sinner-mist"}`}>
                    <p>{message.body}</p>
                    <p className="mt-2 text-xs text-sinner-mist/60">{new Date(message.createdAt).toLocaleString()}</p>
                  </div>
                ))}
                {!messages.length ? <p className="text-sm text-sinner-mist">No visible messages in this conversation.</p> : null}
              </div>
              <form action={sendMessageAction} className="mt-6 grid gap-3 border-t hairline pt-5">
                <input type="hidden" name="conversation_id" value={selected.id} />
                <input type="hidden" name="return_path" value={`/host/messages?conversation=${selected.id}`} />
                <textarea name="body" rows={4} required placeholder="Write a discreet reply..." className="rounded-lg border hairline bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-sinner-mist/50 focus:border-sinner-gold/45" />
                <button type="submit" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-sinner-gold px-4 text-sm font-semibold text-black transition hover:bg-sinner-goldSoft"><Send size={16} />Send</button>
              </form>
            </>
          ) : <EmptyState icon={MessageCircle} title="No conversations yet." copy="Guest messages about your spaces will appear here." />}
        </section>
      </div>
    </>
  );
}

function HostEarningsPanel({ earnings }: { earnings: Awaited<ReturnType<typeof getHostEarnings>> }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Pending", earnings.pending],
          ["Available", earnings.available],
          ["Paid", earnings.paid],
        ].map(([label, value]) => (
          <article key={label} className="rounded-xl border hairline bg-white/[0.025] p-5">
            <p className="text-sm text-sinner-mist">{label}</p>
            <p className="mt-4 font-display text-4xl text-sinner-ivory">{formatMoney(Number(value), earnings.currency)} {earnings.currency}</p>
          </article>
        ))}
      </div>
      <section className="premium-panel p-6">
        <h2 className="font-display text-3xl text-sinner-ivory">Payout ledger</h2>
        <div className="mt-5 grid gap-3">
          {earnings.payouts.map((payout) => (
            <article key={payout.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border hairline bg-black/20 p-4">
              <div>
                <p className="font-medium capitalize text-sinner-ivory">{payout.status}</p>
                <p className="mt-1 text-sm text-sinner-mist">{new Date(payout.created_at).toLocaleDateString()}</p>
              </div>
              <p className="font-semibold text-sinner-ivory">{formatMoney(Number(payout.net_amount), payout.currency)} {payout.currency}</p>
            </article>
          ))}
          {!earnings.payouts.length ? <p className="text-sm text-sinner-mist">No payout records yet. They will populate after payment provider approval and integration.</p> : null}
        </div>
      </section>
    </div>
  );
}

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
  if (sectionKey === "dashboard") {
    const [listings, bookings, earnings] = await Promise.all([getHostListings(), getHostBookings(), getHostEarnings()]);
    return <AccountShell eyebrow="Host tools" title={section.title} copy={section.copy}><HostDashboard listings={listings} bookings={bookings} earnings={earnings} /></AccountShell>;
  }
  if (sectionKey === "listings") {
    const listings = await getHostListings();
    return <AccountShell eyebrow="Host tools" title={section.title} copy={section.copy}><HostListingsPanel listings={listings} error={query.error as string | undefined} success={query.success as string | undefined} /></AccountShell>;
  }
  if (sectionKey === "bookings") {
    const bookings = await getHostBookings();
    return <AccountShell eyebrow="Host tools" title={section.title} copy={section.copy}><HostBookingDashboard bookings={bookings} error={query.error as string | undefined} success={query.success as string | undefined} /></AccountShell>;
  }
  if (sectionKey === "calendar") {
    const [bookings, blocks] = await Promise.all([getHostBookings(), getHostAvailabilityBlocks()]);
    return <AccountShell eyebrow="Host tools" title={section.title} copy={section.copy}><HostCalendarPrep bookings={bookings} blocks={blocks} /></AccountShell>;
  }
  if (sectionKey === "messages") {
    const conversationsResult = await getConversations();
    const selectedId = typeof query.conversation === "string" ? query.conversation : conversationsResult.selected;
    const messages = selectedId ? await getConversationMessages(selectedId) : [];
    return <AccountShell eyebrow="Host tools" title={section.title} copy={section.copy}><HostMessagesPanel conversations={conversationsResult.conversations} selectedId={selectedId} messages={messages} error={query.error as string | undefined} success={query.success as string | undefined} /></AccountShell>;
  }
  if (sectionKey === "earnings") {
    const earnings = await getHostEarnings();
    return <AccountShell eyebrow="Host tools" title={section.title} copy={section.copy}><HostEarningsPanel earnings={earnings} /></AccountShell>;
  }
  return <AccountShell eyebrow="Host tools" title={section.title} copy={section.copy}><EmptyState icon={section.icon} title={section.empty} copy={section.detail} /></AccountShell>;
}
