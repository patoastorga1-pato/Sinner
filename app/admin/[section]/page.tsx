import Link from "next/link";
import { notFound } from "next/navigation";
import { updateReportStatusAction, updateSpaceStatusAction, updateSupportTicketAction } from "@/app/actions/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { requireRole } from "@/lib/auth/server";
import {
  getAdminBookings,
  getAdminPayments,
  getAdminReports,
  getAdminReviews,
  getAdminSpaces,
  getAdminSupportTickets,
  getAdminUsers,
  type AdminSpace,
} from "@/lib/data-access/admin";
import { formatMoney } from "@/lib/marketplace/pricing";
import type { SpaceStatus } from "@/lib/types/database";

const sections = {
  users: { title: "Users", copy: "User profiles and assigned roles." },
  hosts: { title: "Hosts", copy: "Approved host accounts and their role status." },
  listings: { title: "Listings", copy: "Moderate spaces before they become public." },
  bookings: { title: "Bookings", copy: "Reservation requests and booking state across the platform." },
  reports: { title: "Reports", copy: "User-generated moderation reports." },
  support: { title: "Support", copy: "Account support requests and admin responses." },
  reviews: { title: "Reviews", copy: "Public guest reviews visible on listings." },
  payments: { title: "Payments", copy: "Payment-provider-ready records and commission snapshots." },
} as const;

const spaceStatuses: SpaceStatus[] = ["draft", "pending_review", "approved", "rejected", "suspended"];

function AdminTable({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-xl border hairline bg-white/[0.025]"><div className="soft-scrollbar overflow-x-auto">{children}</div></div>;
}

function Cell({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return <td className={`whitespace-nowrap px-4 py-3 text-sm ${muted ? "text-sinner-mist" : "text-sinner-ivory"}`}>{children}</td>;
}

function StatusPill({ value }: { value: string }) {
  return <span className="rounded-full border border-sinner-gold/20 px-3 py-1 text-xs font-semibold capitalize text-sinner-goldSoft">{value.replace(/_/g, " ")}</span>;
}

function SpaceStatusForm({ space }: { space: AdminSpace }) {
  return (
    <form action={updateSpaceStatusAction} className="flex min-w-72 gap-2">
      <input type="hidden" name="space_id" value={space.id} />
      <input type="hidden" name="return_path" value="/admin/listings" />
      <select name="status" defaultValue={space.status} className="h-10 rounded-lg border hairline bg-black/35 px-3 text-sm text-white outline-none">
        {spaceStatuses.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
      </select>
      <button type="submit" className="rounded-lg bg-sinner-gold px-3 text-sm font-semibold text-black">Update</button>
    </form>
  );
}

export default async function AdminSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ section: key }, query] = await Promise.all([params, searchParams]);
  const section = sections[key as keyof typeof sections];
  if (!section) notFound();
  await requireRole("admin", `/admin/${key}`);

  if (key === "users" || key === "hosts") {
    const users = await getAdminUsers();
    const visible = key === "hosts" ? users.filter((user) => user.roles.includes("host")) : users;
    return (
      <AdminShell title={section.title} copy={section.copy}>
        <StatusMessage error={query.error} success={query.success} />
        <AdminTable>
          <table className="w-full min-w-[760px] border-collapse">
            <thead className="text-left text-xs uppercase text-sinner-mist/70"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Roles</th><th className="px-4 py-3">Identity</th><th className="px-4 py-3">Age</th><th className="px-4 py-3">Created</th></tr></thead>
            <tbody className="divide-y hairline">
              {visible.map((user) => (
                <tr key={user.id}>
                  <Cell>{user.display_name || `${user.first_name} ${user.last_name}`.trim() || "SINNER member"}</Cell>
                  <Cell muted>{user.roles.join(", ") || "none"}</Cell>
                  <Cell><StatusPill value={user.identityStatus} /></Cell>
                  <Cell><StatusPill value={user.ageStatus} /></Cell>
                  <Cell muted>{new Date(user.created_at).toLocaleDateString()}</Cell>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTable>
      </AdminShell>
    );
  }

  if (key === "listings") {
    const spaces = await getAdminSpaces();
    return (
      <AdminShell title={section.title} copy={section.copy}>
        <StatusMessage error={query.error} success={query.success} />
        <AdminTable>
          <table className="w-full min-w-[980px] border-collapse">
            <thead className="text-left text-xs uppercase text-sinner-mist/70"><tr><th className="px-4 py-3">Listing</th><th className="px-4 py-3">Host</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Action</th></tr></thead>
            <tbody className="divide-y hairline">
              {spaces.map((space) => (
                <tr key={space.id}>
                  <Cell><Link href={`/spaces/${space.slug}`} className="hover:text-sinner-goldSoft">{space.name}</Link></Cell>
                  <Cell muted>{space.hostName}</Cell>
                  <Cell muted>{space.city}, {space.state}</Cell>
                  <Cell><StatusPill value={space.status} /></Cell>
                  <Cell muted>{space.price === null ? "Quote" : `${formatMoney(space.price, "MXN")} MXN`}</Cell>
                  <Cell><SpaceStatusForm space={space} /></Cell>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTable>
      </AdminShell>
    );
  }

  if (key === "bookings") {
    const bookings = await getAdminBookings();
    return (
      <AdminShell title={section.title} copy={section.copy}>
        <AdminTable>
          <table className="w-full min-w-[900px] border-collapse">
            <thead className="text-left text-xs uppercase text-sinner-mist/70"><tr><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Space</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Start</th><th className="px-4 py-3">Total</th></tr></thead>
            <tbody className="divide-y hairline">
              {bookings.map((booking) => <tr key={booking.id}><Cell>{booking.bookingReference}</Cell><Cell muted>{booking.spaceName}</Cell><Cell><StatusPill value={booking.status} /></Cell><Cell muted>{new Date(booking.startDatetime).toLocaleString()}</Cell><Cell>{formatMoney(booking.totalAmount, booking.currency)} {booking.currency}</Cell></tr>)}
            </tbody>
          </table>
        </AdminTable>
      </AdminShell>
    );
  }

  if (key === "reports") {
    const reports = await getAdminReports();
    return (
      <AdminShell title={section.title} copy={section.copy}>
        <StatusMessage error={query.error} success={query.success} />
        <div className="grid gap-4">
          {reports.map((report) => (
            <article key={report.id} className="rounded-xl border hairline bg-white/[0.025] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-xs font-semibold uppercase text-sinner-goldSoft">{report.targetType}</p><h2 className="mt-1 font-display text-2xl text-sinner-ivory">{report.reason}</h2><p className="mt-2 text-sm text-sinner-mist">{report.description || "No description provided."}</p></div>
                <StatusPill value={report.status} />
              </div>
              <form action={updateReportStatusAction} className="mt-5 flex flex-wrap gap-2 border-t hairline pt-5">
                <input type="hidden" name="report_id" value={report.id} />
                <input type="hidden" name="return_path" value="/admin/reports" />
                <select name="status" defaultValue={report.status} className="h-10 rounded-lg border hairline bg-black/35 px-3 text-sm text-white outline-none">
                  {["open", "reviewing", "resolved", "dismissed"].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <button type="submit" className="rounded-lg bg-sinner-gold px-4 text-sm font-semibold text-black">Update report</button>
              </form>
            </article>
          ))}
          {!reports.length ? <p className="rounded-xl border hairline bg-white/[0.025] p-6 text-sm text-sinner-mist">No reports yet.</p> : null}
        </div>
      </AdminShell>
    );
  }

  if (key === "support") {
    const tickets = await getAdminSupportTickets();
    return (
      <AdminShell title={section.title} copy={section.copy}>
        <StatusMessage error={query.error} success={query.success} />
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-xl border hairline bg-white/[0.025] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-xs font-semibold uppercase text-sinner-goldSoft">{ticket.category}</p><h2 className="mt-1 font-display text-2xl text-sinner-ivory">{ticket.subject}</h2><p className="mt-2 text-sm leading-6 text-sinner-mist">{ticket.description}</p></div>
                <StatusPill value={ticket.status} />
              </div>
              <form action={updateSupportTicketAction} className="mt-5 grid gap-3 border-t hairline pt-5">
                <input type="hidden" name="ticket_id" value={ticket.id} />
                <input type="hidden" name="return_path" value="/admin/support" />
                <div className="flex flex-wrap gap-2">
                  <select name="status" defaultValue={ticket.status} className="h-10 rounded-lg border hairline bg-black/35 px-3 text-sm text-white outline-none">
                    {["open", "in_progress", "resolved", "closed"].map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
                  </select>
                  <button type="submit" className="rounded-lg bg-sinner-gold px-4 text-sm font-semibold text-black">Update ticket</button>
                </div>
                <textarea name="admin_response" defaultValue={ticket.admin_response ?? ""} rows={3} placeholder="Admin response" className="rounded-lg border hairline bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-sinner-mist/60" />
              </form>
            </article>
          ))}
          {!tickets.length ? <p className="rounded-xl border hairline bg-white/[0.025] p-6 text-sm text-sinner-mist">No support tickets yet.</p> : null}
        </div>
      </AdminShell>
    );
  }

  if (key === "reviews") {
    const reviews = await getAdminReviews();
    return (
      <AdminShell title={section.title} copy={section.copy}>
        <AdminTable>
          <table className="w-full min-w-[760px] border-collapse">
            <thead className="text-left text-xs uppercase text-sinner-mist/70"><tr><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Comment</th><th className="px-4 py-3">Space</th><th className="px-4 py-3">Created</th></tr></thead>
            <tbody className="divide-y hairline">
              {reviews.map((review) => <tr key={review.id}><Cell>{review.rating}/5</Cell><Cell muted>{review.comment || "No comment"}</Cell><Cell muted>{review.spaceId}</Cell><Cell muted>{new Date(review.createdAt).toLocaleDateString()}</Cell></tr>)}
            </tbody>
          </table>
        </AdminTable>
      </AdminShell>
    );
  }

  if (key === "payments") {
    const payments = await getAdminPayments();
    return (
      <AdminShell title={section.title} copy={section.copy}>
        <AdminTable>
          <table className="w-full min-w-[900px] border-collapse">
            <thead className="text-left text-xs uppercase text-sinner-mist/70"><tr><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Gross</th><th className="px-4 py-3">Fee</th><th className="px-4 py-3">Host net</th><th className="px-4 py-3">Created</th></tr></thead>
            <tbody className="divide-y hairline">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <Cell>{payment.provider}</Cell>
                  <Cell><StatusPill value={payment.status} /></Cell>
                  <Cell>{formatMoney(Number(payment.gross_amount), payment.currency)} {payment.currency}</Cell>
                  <Cell muted>{formatMoney(Number(payment.platform_fee), payment.currency)} {payment.currency}</Cell>
                  <Cell>{formatMoney(Number(payment.host_net_amount), payment.currency)} {payment.currency}</Cell>
                  <Cell muted>{new Date(payment.created_at).toLocaleDateString()}</Cell>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTable>
      </AdminShell>
    );
  }

  notFound();
}
