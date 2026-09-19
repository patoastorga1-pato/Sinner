import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenCheck, Building2, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminUserDetail } from "@/lib/data-access/admin";
import { formatMoney } from "@/lib/marketplace/pricing";

function Status({ value }: { value: string }) {
  return <span className="inline-flex rounded-full border border-sinner-gold/20 px-3 py-1 text-xs font-semibold capitalize text-sinner-goldSoft">{value.replace(/_/g, " ")}</span>;
}

export default async function AdminHostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  if (!detail || !detail.user.roles.includes("host")) notFound();
  const { user, publications, bookings } = detail;
  const name = user.display_name || `${user.first_name} ${user.last_name}`.trim() || "SINNER host";
  const published = publications.filter((item) => item.status === "approved").length;
  const pending = publications.filter((item) => item.status === "pending_review").length;
  const activeBookings = bookings.filter((item) => ["pending", "payment_pending", "confirmed"].includes(item.status)).length;
  const completedBookings = bookings.filter((item) => item.status === "completed").length;

  return <AdminShell title={name} copy={`Host operations · ${user.id}`}>
    <Link href="/admin/hosts" className="text-sm text-sinner-mist hover:text-white">← Back to hosts</Link>
    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[{ label: "Publications", value: publications.length, Icon: Building2 }, { label: "Published", value: published, Icon: ShieldCheck }, { label: "Pending review", value: pending, Icon: BookOpenCheck }, { label: "Active bookings", value: activeBookings, Icon: BookOpenCheck }].map(({ label, value, Icon }) => <article key={label} className="rounded-md border hairline bg-white/[0.025] p-5"><div className="flex items-center justify-between"><p className="text-sm text-sinner-mist">{label}</p><Icon size={18} className="text-sinner-goldSoft" /></div><p className="mt-3 font-display text-3xl text-white">{value}</p></article>)}
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <section className="rounded-md border hairline bg-white/[0.02]">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b hairline p-5"><div><h2 className="font-display text-3xl text-white">Host publications</h2><p className="mt-1 text-sm text-sinner-mist">Every space, experience or event owned by this host.</p></div><span className="text-sm text-sinner-mist">{publications.length} total</span></div>
          <div className="divide-y hairline">
            {publications.map((publication) => {
              const adminHref = publication.kind === "space" ? `/admin/content/space/${publication.id}` : publication.href;
              return <article key={`${publication.kind}-${publication.id}`} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-3"><h3 className="text-base font-semibold text-white">{publication.name}</h3><Status value={publication.status} /></div><p className="mt-2 flex items-center gap-2 text-sm text-sinner-mist"><MapPin size={14} /> {publication.city}, {publication.state}</p><p className="mt-2 text-xs capitalize text-sinner-mist/70">{publication.kind} · {publication.price === null ? "Price not provided" : `${formatMoney(publication.price, publication.currency)} ${publication.currency}`}</p></div><div className="flex flex-wrap gap-2">{publication.href ? <Link href={publication.href} target="_blank" className="inline-flex min-h-10 items-center gap-2 rounded-md border hairline px-4 text-sm text-sinner-mist hover:text-white">Public preview <ExternalLink size={14} /></Link> : null}{adminHref ? <Link href={adminHref} className="inline-flex min-h-10 items-center rounded-md bg-sinner-gold px-4 text-sm font-semibold text-black">View publication</Link> : null}</div></article>;
            })}
            {!publications.length ? <p className="p-6 text-sm text-sinner-mist">This host has not created any publications yet.</p> : null}
          </div>
        </section>
        <section className="rounded-md border hairline bg-white/[0.02]">
          <div className="border-b hairline p-5"><h2 className="font-display text-3xl text-white">Received bookings</h2><p className="mt-1 text-sm text-sinner-mist">{activeBookings} active · {completedBookings} completed</p></div>
          <div className="divide-y hairline">{bookings.map((booking) => <Link key={booking.id} href={`/admin/bookings/${booking.id}`} className="grid gap-2 p-5 transition hover:bg-white/[0.025] sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-semibold text-white">{booking.bookingReference} · {booking.spaceName}</p><p className="mt-1 text-sm text-sinner-mist">{booking.guestName} · {new Date(booking.startDatetime).toLocaleString()}</p></div><Status value={booking.status} /></Link>)}{!bookings.length ? <p className="p-6 text-sm text-sinner-mist">No bookings received yet.</p> : null}</div>
        </section>
      </div>
      <aside className="h-fit rounded-md border hairline bg-white/[0.025] p-5 xl:sticky xl:top-20"><h2 className="font-display text-2xl text-white">Host verification</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-sinner-mist">Age verification</dt><dd className="mt-1"><Status value={user.ageStatus} /></dd></div><div><dt className="text-sinner-mist">Identity verification</dt><dd className="mt-1"><Status value={user.identityStatus} /></dd></div><div><dt className="text-sinner-mist">Member since</dt><dd className="mt-1 text-white">{new Date(user.created_at).toLocaleDateString()}</dd></div><div><dt className="text-sinner-mist">Reports</dt><dd className="mt-1 text-white">{detail.reports.length}</dd></div></dl><Link href={`/admin/users/${user.id}`} className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-md border hairline px-4 text-sm text-sinner-goldSoft">View complete user record</Link></aside>
    </div>
  </AdminShell>;
}
