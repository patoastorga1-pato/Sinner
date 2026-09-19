import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminBookingDetail } from "@/lib/data-access/admin";
import { formatMoney } from "@/lib/marketplace/pricing";

export default async function AdminBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAdminBookingDetail(id);
  if (!detail) notFound();
  const { booking, events } = detail;
  return <AdminShell title={booking.bookingReference} copy={`${booking.spaceName} · booking detail`}>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-md border hairline bg-white/[0.025] p-5"><h2 className="font-display text-2xl">Booking overview</h2><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="text-sinner-mist">Status</dt><dd className="mt-1 capitalize text-white">{booking.status.replace(/_/g, " ")}</dd></div><div><dt className="text-sinner-mist">Total</dt><dd className="mt-1 text-white">{formatMoney(booking.totalAmount, booking.currency)} {booking.currency}</dd></div><div><dt className="text-sinner-mist">Guest</dt><dd className="mt-1 text-white">{booking.guestName}</dd></div><div><dt className="text-sinner-mist">Host</dt><dd className="mt-1 text-white">{booking.hostName}</dd></div><div><dt className="text-sinner-mist">Start</dt><dd className="mt-1 text-white">{new Date(booking.startDatetime).toLocaleString()}</dd></div><div><dt className="text-sinner-mist">Guests / duration</dt><dd className="mt-1 text-white">{booking.guestCount} · {booking.durationHours} hours</dd></div>
      </dl></section>
      <aside className="rounded-md border hairline bg-white/[0.025] p-5"><h2 className="font-display text-2xl">Timeline</h2><div className="mt-4 space-y-4">{events.map((event, index) => <div key={String(event.id ?? index)} className="border-l border-sinner-gold/30 pl-4"><p className="text-sm capitalize text-white">{String(event.event_type ?? event.type ?? "booking event").replace(/_/g, " ")}</p><p className="mt-1 text-xs text-sinner-mist">{new Date(String(event.created_at)).toLocaleString()}</p></div>)}{!events.length ? <p className="text-sm text-sinner-mist">No booking events recorded yet.</p> : null}</div></aside>
    </div>
  </AdminShell>;
}
