import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { BookingCard } from "@/components/booking/BookingCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { requireUser } from "@/lib/auth/server";
import type { AppBookingStatus } from "@/lib/bookings/constants";
import { getGuestBookings } from "@/lib/data-access/bookings";
import type { RawSearchParams } from "@/lib/types/marketplace";

const tabs: Array<{ key: string; label: string; statuses: AppBookingStatus[] }> = [
  { key: "pending", label: "Pending", statuses: ["pending", "payment_pending"] },
  { key: "upcoming", label: "Upcoming", statuses: ["confirmed"] },
  { key: "completed", label: "Completed", statuses: ["completed"] },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled", "declined", "expired", "refunded"] },
] as const;

export default async function BookingsPage({ searchParams }: { searchParams: Promise<RawSearchParams & { error?: string; success?: string; tab?: string }> }) {
  const [auth, params] = await Promise.all([requireUser("/bookings"), searchParams]);
  const bookings = await getGuestBookings(auth.user.id);
  const selected = tabs.find((tab) => tab.key === params.tab) ?? tabs[0];
  const visible = bookings.filter((booking) => selected.statuses.includes(booking.status));

  return (
    <AccountShell title="Bookings" copy="Track requests, temporary holds and future confirmed reservations.">
      <StatusMessage error={params.error as string | undefined} success={params.success as string | undefined} />
      <nav className="soft-scrollbar flex gap-2 overflow-x-auto">
        {tabs.map((tab) => <Link key={tab.key} href={`/bookings?tab=${tab.key}`} className={`min-w-fit rounded-lg px-4 py-2 text-sm ${selected.key === tab.key ? "bg-sinner-gold text-black" : "border hairline text-sinner-mist hover:text-white"}`}>{tab.label}</Link>)}
      </nav>
      <div className="mt-7 grid gap-5">
        {visible.length ? visible.map((booking) => <BookingCard key={booking.id} booking={booking} />) : <EmptyState icon={CalendarDays} title="No bookings in this tab." copy={bookings.length ? "Try another status tab to see the rest of your reservations." : "Your next request or temporary hold will appear here."} actionLabel="Explore spaces" actionHref="/spaces" />}
      </div>
    </AccountShell>
  );
}
