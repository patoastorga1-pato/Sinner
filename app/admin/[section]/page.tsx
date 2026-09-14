import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Settings, ShieldAlert, UserRound } from "lucide-react";
import { approveHostRequestAction, rejectHostRequestAction, updateProfileVerificationAction, updatePublicationStatusAction, updateReportStatusAction, updateSupportTicketAction } from "@/app/actions/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { requireRole } from "@/lib/auth/server";
import { formatBookingRange } from "@/lib/bookings/time";
import {
  getAdminBookings,
  getAdminConversations,
  getAdminHostApplications,
  getAdminPayments,
  getAdminPayouts,
  getAdminPublications,
  getAdminReports,
  getAdminReviews,
  getAdminSettings,
  getAdminSupportTickets,
  getAdminUsers,
  getHostApplicationCounts,
  type AdminHostApplication,
  type AdminUser,
  type AdminPublication,
} from "@/lib/data-access/admin";
import { formatMoney } from "@/lib/marketplace/pricing";
import type { HostApplicationStatus, ListingStatus, SpaceStatus } from "@/lib/types/database";

const sections = {
  profiles: { title: "Profiles", copy: "User profiles, roles, verification state and activity signals." },
  users: { title: "Profiles", copy: "User profiles, roles, verification state and activity signals." },
  "host-requests": { title: "Host Requests", copy: "Approve or reject users who ask to publish spaces as hosts." },
  "host-approvals": { title: "Host Requests", copy: "Approve or reject users who ask to publish spaces as hosts." },
  hosts: { title: "Hosts", copy: "Host accounts, listing volume and current moderation signals." },
  listings: { title: "Publications", copy: "Spaces, experiences and events that can be reviewed or moderated." },
  bookings: { title: "Bookings", copy: "Reservation requests and booking state across the platform." },
  reports: { title: "Reports", copy: "User-generated moderation reports and review state." },
  support: { title: "Support", copy: "Account support requests and admin responses." },
  reviews: { title: "Reviews", copy: "Public guest reviews visible on listings." },
  payments: { title: "Payments", copy: "Payment-provider-ready records and commission snapshots." },
  payouts: { title: "Payouts", copy: "Host payout ledgers prepared for the future provider connection." },
  messages: { title: "Messages", copy: "Conversation oversight for safety and support investigations." },
  settings: { title: "Settings", copy: "Platform settings stored in Supabase." },
} as const;

const publicationStatuses: Array<SpaceStatus | ListingStatus> = ["draft", "pending_review", "approved", "rejected", "suspended"];
const hostApplicationStatuses: HostApplicationStatus[] = ["pending", "approved", "rejected", "suspended"];

function AdminTable({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-xl border hairline bg-white/[0.025]"><div className="soft-scrollbar overflow-x-auto">{children}</div></div>;
}

function Cell({ children, muted = false, className = "" }: { children: React.ReactNode; muted?: boolean; className?: string }) {
  return <td className={`px-4 py-3 text-sm ${muted ? "text-sinner-mist" : "text-sinner-ivory"} ${className}`}>{children}</td>;
}

function StatusPill({ value }: { value: string }) {
  return <span className="inline-flex rounded-full border border-sinner-gold/20 px-3 py-1 text-xs font-semibold capitalize text-sinner-goldSoft">{value.replace(/_/g, " ")}</span>;
}

function EmptyPanel({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-xl border hairline bg-white/[0.025] p-8 text-center">
      <div className="max-w-md">
        <ShieldAlert className="mx-auto text-sinner-goldSoft" size={26} />
        <h2 className="mt-4 font-display text-3xl text-sinner-ivory">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-sinner-mist">{copy}</p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <article className="rounded-xl border hairline bg-white/[0.025] p-5">
      <p className="text-sm text-sinner-mist">{label}</p>
      <p className="mt-4 font-display text-4xl text-sinner-ivory">{value}</p>
      <p className="mt-2 text-xs leading-5 text-sinner-mist/70">{detail}</p>
    </article>
  );
}

function PublicationStatusForm({ publication }: { publication: AdminPublication }) {
  return (
    <form action={updatePublicationStatusAction} className="flex min-w-72 gap-2">
      <input type="hidden" name="publication_id" value={publication.id} />
      <input type="hidden" name="kind" value={publication.kind} />
      <input type="hidden" name="return_path" value="/admin/listings" />
      <select name="status" defaultValue={publication.status} className="h-10 rounded-lg border hairline bg-black/35 px-3 text-sm text-white outline-none">
        {publicationStatuses.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
      </select>
      <button type="submit" className="rounded-lg bg-sinner-gold px-3 text-sm font-semibold text-black transition hover:bg-sinner-goldSoft">Update</button>
    </form>
  );
}

function applicantName(application: AdminHostApplication) {
  const profile = application.profile;
  return profile?.display_name || `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "SINNER member";
}

function HostRequestCard({ application, returnPath }: { application: AdminHostApplication; returnPath: string }) {
  return (
    <article className="rounded-xl border hairline bg-white/[0.025] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-sinner-gold/25 text-sinner-goldSoft"><UserRound size={18} /></span>
            <div className="min-w-0">
              <h3 className="truncate font-display text-3xl text-sinner-ivory">{applicantName(application)}</h3>
              <p className="mt-1 truncate text-sm text-sinner-mist">{application.applicant_email ?? application.user_id}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-sinner-mist/70">Requested {new Date(application.requested_at).toLocaleString()}</p>
          {application.request_note ? <p className="mt-4 rounded-lg border hairline bg-black/20 p-3 text-sm leading-6 text-sinner-mist">{application.request_note}</p> : null}
          {application.decision_note ? <p className="mt-4 text-sm leading-6 text-sinner-mist">Decision note: {application.decision_note}</p> : null}
        </div>
        <StatusPill value={application.status} />
      </div>

      {application.status === "pending" ? (
        <div className="mt-5 grid gap-3 border-t hairline pt-5 lg:grid-cols-2">
          <form action={approveHostRequestAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input type="hidden" name="request_id" value={application.id} />
            <input type="hidden" name="return_path" value={returnPath} />
            <input name="decision_note" placeholder="Optional approval note" className="h-11 rounded-lg border hairline bg-black/30 px-3 text-sm text-sinner-ivory outline-none placeholder:text-sinner-mist/60" />
            <button type="submit" className="min-h-11 rounded-lg bg-sinner-gold px-4 text-sm font-semibold text-black transition hover:bg-sinner-goldSoft">Approve host</button>
          </form>
          <form action={rejectHostRequestAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input type="hidden" name="request_id" value={application.id} />
            <input type="hidden" name="return_path" value={returnPath} />
            <input name="decision_note" placeholder="Reason for rejection" className="h-11 rounded-lg border hairline bg-black/30 px-3 text-sm text-sinner-ivory outline-none placeholder:text-sinner-mist/60" />
            <button type="submit" className="min-h-11 rounded-lg border border-rose-300/30 px-4 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/10">Reject</button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

function ProfileVerificationForm({ user, returnPath }: { user: AdminUser; returnPath: string }) {
  return (
    <form action={updateProfileVerificationAction} className="grid min-w-72 gap-2">
      <input type="hidden" name="profile_id" value={user.id} />
      <input type="hidden" name="return_path" value={returnPath} />
      <select name="age_status" defaultValue={user.ageStatus} className="h-10 rounded-lg border hairline bg-black/35 px-3 text-sm text-white outline-none">
        {["pending", "verified", "rejected", "unverified"].map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
      </select>
      <input
        name="rejection_reason"
        placeholder="Rejection note"
        className="h-10 rounded-lg border hairline bg-black/35 px-3 text-sm text-white outline-none placeholder:text-sinner-mist/45"
      />
      <button type="submit" className="h-10 rounded-lg bg-sinner-gold px-3 text-sm font-semibold text-black transition hover:bg-sinner-goldSoft">Save verification</button>
    </form>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function genderLabel(gender?: string | null) {
  if (gender === "male") return "Hombre";
  if (gender === "female") return "Mujer";
  return "Not selected";
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

  if (key === "host-requests" || key === "host-approvals") {
    const [applications, counts] = await Promise.all([getAdminHostApplications(), getHostApplicationCounts()]);
    const pendingApplications = applications.filter((application) => application.status === "pending");

    return (
      <AdminShell title={section.title} copy={section.copy}>
        <StatusMessage error={query.error} success={query.success} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hostApplicationStatuses.map((status) => (
            <SummaryCard
              key={status}
              label={`${status.replace(/_/g, " ")} requests`}
              value={counts[status]}
              detail={status === "pending" ? "Need admin approval before the user can publish." : "Host onboarding application status."}
            />
          ))}
        </div>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-sinner-goldSoft">Host access</p>
              <h2 className="mt-2 font-display text-4xl text-sinner-ivory">Requests to review</h2>
            </div>
            <p className="text-sm text-sinner-mist">{pendingApplications.length} pending</p>
          </div>

          <div className="mt-6 grid gap-5">
            {applications.length ? applications.map((application) => (
              <HostRequestCard key={application.id} application={application} returnPath={`/admin/${key}`} />
            )) : (
              <EmptyPanel title="No host requests yet." copy="New host access requests will appear here after users submit onboarding." />
            )}
          </div>
        </section>
      </AdminShell>
    );
  }

  if (key === "profiles" || key === "users" || key === "hosts") {
    const users = await getAdminUsers();
    const visible = key === "hosts" ? users.filter((user) => user.roles.includes("host")) : users;
    const verifiedAdults = visible.filter((user) => user.ageStatus === "verified").length;
    const pendingAgeReviews = visible.filter((user) => user.ageStatus === "pending" && user.ageDocumentPath).length;
    const admins = visible.filter((user) => user.roles.includes("admin")).length;

    return (
      <AdminShell title={section.title} copy={section.copy}>
        <StatusMessage error={query.error} success={query.success} />
        <div className="grid gap-4 sm:grid-cols-4">
          <SummaryCard label="Visible profiles" value={visible.length} detail="Loaded from Supabase profiles." />
          <SummaryCard label="Verified adults" value={verifiedAdults} detail="Profiles marked age verified." />
          <SummaryCard label="Pending reviews" value={pendingAgeReviews} detail="Uploaded IDs waiting for admin verification." />
          <SummaryCard label="Admins" value={admins} detail="Profiles with admin role." />
        </div>
        <div className="mt-6">
          <AdminTable>
            <table className="w-full min-w-[1520px] border-collapse">
              <thead className="text-left text-xs uppercase text-sinner-mist/70">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Roles</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Identity</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Listings</th>
                  <th className="px-4 py-3">Bookings</th>
                  <th className="px-4 py-3">Flags</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Verification action</th>
                </tr>
              </thead>
              <tbody className="divide-y hairline">
                {visible.map((user) => (
                  <tr key={user.id}>
                    <Cell>
                      <p className="font-medium">{user.display_name || `${user.first_name} ${user.last_name}`.trim() || "SINNER member"}</p>
                      <p className="mt-1 text-xs text-sinner-mist/60">{user.id.slice(0, 8)}</p>
                    </Cell>
                    <Cell muted>{user.roles.join(", ") || "none"}</Cell>
                    <Cell muted>{genderLabel(user.gender)}</Cell>
                    <Cell><StatusPill value={user.identityStatus} /></Cell>
                    <Cell>
                      <StatusPill value={user.ageStatus} />
                      {user.ageSubmittedAt ? <p className="mt-2 text-xs text-sinner-mist/60">Submitted {formatDate(user.ageSubmittedAt)}</p> : null}
                      {user.ageDocumentUrl ? <a href={user.ageDocumentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-sinner-goldSoft hover:text-sinner-gold">View ID</a> : user.ageDocumentPath ? <p className="mt-2 text-xs text-sinner-mist/60">Document stored</p> : null}
                    </Cell>
                    <Cell muted>{user.approvedListingCount}/{user.listingCount} approved</Cell>
                    <Cell muted>{user.bookingCount}</Cell>
                    <Cell muted>{user.openReports} reports · {user.openSupportTickets} support · {user.reviewCount} reviews</Cell>
                    <Cell muted>{formatDate(user.created_at)}</Cell>
                    <Cell><ProfileVerificationForm user={user} returnPath={`/admin/${key}`} /></Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>
        </div>
        {!visible.length ? <div className="mt-6"><EmptyPanel title="No profiles found." copy="Profiles will appear here as users register." /></div> : null}
      </AdminShell>
    );
  }

  if (key === "listings") {
    const publications = await getAdminPublications();
    const pending = publications.filter((publication) => publication.status === "pending_review").length;
    const approved = publications.filter((publication) => publication.status === "approved").length;
    const suspended = publications.filter((publication) => publication.status === "suspended").length;

    return (
      <AdminShell title={section.title} copy={section.copy}>
        <StatusMessage error={query.error} success={query.success} />
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Pending review" value={pending} detail="Spaces, experiences or events awaiting moderation." />
          <SummaryCard label="Approved" value={approved} detail="Visible or eligible for public discovery." />
          <SummaryCard label="Suspended" value={suspended} detail="Hidden by moderation." />
        </div>
        <div className="mt-6">
          <AdminTable>
            <table className="w-full min-w-[1180px] border-collapse">
              <thead className="text-left text-xs uppercase text-sinner-mist/70">
                <tr><th className="px-4 py-3">Publication</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Action</th></tr>
              </thead>
              <tbody className="divide-y hairline">
                {publications.map((publication) => (
                  <tr key={`${publication.kind}-${publication.id}`}>
                    <Cell>
                      {publication.href ? <Link href={publication.href} className="font-medium hover:text-sinner-goldSoft">{publication.name}</Link> : <span className="font-medium">{publication.name}</span>}
                      <p className="mt-1 text-xs text-sinner-mist/60">{publication.detail}</p>
                    </Cell>
                    <Cell muted className="capitalize">{publication.kind}</Cell>
                    <Cell muted>{publication.ownerName}</Cell>
                    <Cell muted>{publication.city}, {publication.state}</Cell>
                    <Cell><StatusPill value={publication.status} /></Cell>
                    <Cell muted>{publication.price === null ? "Quote" : `${formatMoney(publication.price, publication.currency)} ${publication.currency}`}</Cell>
                    <Cell><PublicationStatusForm publication={publication} /></Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>
        </div>
        {!publications.length ? <div className="mt-6"><EmptyPanel title="No publications yet." copy="Host spaces, experiences and events will appear here." /></div> : null}
      </AdminShell>
    );
  }

  if (key === "bookings") {
    const bookings = await getAdminBookings();
    const gross = bookings.reduce((total, booking) => total + booking.totalAmount, 0);
    return (
      <AdminShell title={section.title} copy={section.copy}>
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Bookings" value={bookings.length} detail="Loaded reservation records." />
          <SummaryCard label="Gross amount" value={`${formatMoney(gross, "MXN")} MXN`} detail="Sum of visible booking totals." />
          <SummaryCard label="Confirmed" value={bookings.filter((booking) => booking.status === "confirmed").length} detail="Reservations currently confirmed." />
        </div>
        <div className="mt-6">
          <AdminTable>
            <table className="w-full min-w-[1180px] border-collapse">
              <thead className="text-left text-xs uppercase text-sinner-mist/70"><tr><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Space</th><th className="px-4 py-3">Guest</th><th className="px-4 py-3">Host</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">When</th><th className="px-4 py-3">Total</th></tr></thead>
              <tbody className="divide-y hairline">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <Cell><Link href={`/bookings/${booking.id}`} className="font-medium hover:text-sinner-goldSoft">{booking.bookingReference}</Link><p className="mt-1 text-xs text-sinner-mist/60">{booking.bookingType} · {booking.guestCount} guests</p></Cell>
                    <Cell muted>{booking.spaceName}</Cell>
                    <Cell muted>{booking.guestName}</Cell>
                    <Cell muted>{booking.hostName}</Cell>
                    <Cell><StatusPill value={booking.status} /></Cell>
                    <Cell muted>{formatBookingRange(booking.startDatetime, booking.endDatetime, booking.timezone)}<p className="mt-1 text-xs">{booking.durationHours} hours</p></Cell>
                    <Cell>{formatMoney(booking.totalAmount, booking.currency)} {booking.currency}</Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>
        </div>
        {!bookings.length ? <div className="mt-6"><EmptyPanel title="No bookings yet." copy="Reservation requests will appear here when users book spaces." /></div> : null}
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
                <div>
                  <p className="text-xs font-semibold uppercase text-sinner-goldSoft">{report.targetLabel}</p>
                  <h2 className="mt-1 font-display text-2xl text-sinner-ivory">{report.reason}</h2>
                  <p className="mt-2 text-sm text-sinner-mist">Reporter: {report.reporterName}</p>
                  <p className="mt-3 text-sm leading-6 text-sinner-mist">{report.description || "No description provided."}</p>
                </div>
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
          {!reports.length ? <EmptyPanel title="No reports yet." copy="Moderation reports will appear here." /> : null}
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
                <div>
                  <p className="text-xs font-semibold uppercase text-sinner-goldSoft">{ticket.category} · {ticket.userName}</p>
                  <h2 className="mt-1 font-display text-2xl text-sinner-ivory">{ticket.subject}</h2>
                  <p className="mt-2 text-sm leading-6 text-sinner-mist">{ticket.description}</p>
                </div>
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
          {!tickets.length ? <EmptyPanel title="No support tickets yet." copy="User support requests will appear here." /> : null}
        </div>
      </AdminShell>
    );
  }

  if (key === "reviews") {
    const reviews = await getAdminReviews();
    return (
      <AdminShell title={section.title} copy={section.copy}>
        <AdminTable>
          <table className="w-full min-w-[980px] border-collapse">
            <thead className="text-left text-xs uppercase text-sinner-mist/70"><tr><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Space</th><th className="px-4 py-3">Author</th><th className="px-4 py-3">Comment</th><th className="px-4 py-3">Created</th></tr></thead>
            <tbody className="divide-y hairline">
              {reviews.map((review) => <tr key={review.id}><Cell>{review.rating}/5<p className="mt-1 text-xs text-sinner-mist/60">Privacy {review.privacyRating ?? "-"} · Discretion {review.discretionRating ?? "-"}</p></Cell><Cell muted>{review.spaceName}</Cell><Cell muted>{review.authorName}</Cell><Cell muted className="max-w-xl whitespace-normal">{review.comment || "No comment"}</Cell><Cell muted>{formatDate(review.createdAt)}</Cell></tr>)}
            </tbody>
          </table>
        </AdminTable>
        {!reviews.length ? <div className="mt-6"><EmptyPanel title="No reviews yet." copy="Guest reviews will appear here after completed bookings." /></div> : null}
      </AdminShell>
    );
  }

  if (key === "payments") {
    const payments = await getAdminPayments();
    const gross = payments.reduce((total, payment) => total + Number(payment.gross_amount), 0);
    const fees = payments.reduce((total, payment) => total + Number(payment.platform_fee), 0);
    return (
      <AdminShell title={section.title} copy={section.copy}>
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Gross" value={`${formatMoney(gross, "MXN")} MXN`} detail="Total visible payment records." />
          <SummaryCard label="Platform fees" value={`${formatMoney(fees, "MXN")} MXN`} detail="Commission snapshots." />
          <SummaryCard label="Pending" value={payments.filter((payment) => payment.status === "pending").length} detail="Awaiting provider state." />
        </div>
        <div className="mt-6">
          <AdminTable>
            <table className="w-full min-w-[1040px] border-collapse">
              <thead className="text-left text-xs uppercase text-sinner-mist/70"><tr><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Space</th><th className="px-4 py-3">Guest</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Gross</th><th className="px-4 py-3">Fee</th><th className="px-4 py-3">Host net</th><th className="px-4 py-3">Created</th></tr></thead>
              <tbody className="divide-y hairline">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <Cell>{payment.provider}<p className="mt-1 text-xs text-sinner-mist/60">{payment.provider_reference ?? "No reference"}</p></Cell>
                    <Cell muted>{payment.spaceName}</Cell>
                    <Cell muted>{payment.guestName}</Cell>
                    <Cell><StatusPill value={payment.status} /></Cell>
                    <Cell>{formatMoney(Number(payment.gross_amount), payment.currency)} {payment.currency}</Cell>
                    <Cell muted>{formatMoney(Number(payment.platform_fee), payment.currency)} {payment.currency}</Cell>
                    <Cell>{formatMoney(Number(payment.host_net_amount), payment.currency)} {payment.currency}</Cell>
                    <Cell muted>{formatDate(payment.created_at)}</Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>
        </div>
        {!payments.length ? <div className="mt-6"><EmptyPanel title="No payment records yet." copy="Payment rows will populate when PandaBlue or another provider is connected." /></div> : null}
      </AdminShell>
    );
  }

  if (key === "payouts") {
    const payouts = await getAdminPayouts();
    return (
      <AdminShell title={section.title} copy={section.copy}>
        <AdminTable>
          <table className="w-full min-w-[940px] border-collapse">
            <thead className="text-left text-xs uppercase text-sinner-mist/70"><tr><th className="px-4 py-3">Host</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Gross</th><th className="px-4 py-3">Fee</th><th className="px-4 py-3">Net</th><th className="px-4 py-3">Paid</th><th className="px-4 py-3">Created</th></tr></thead>
            <tbody className="divide-y hairline">
              {payouts.map((payout) => <tr key={payout.id}><Cell>{payout.hostName}</Cell><Cell><StatusPill value={payout.status} /></Cell><Cell>{formatMoney(Number(payout.gross_amount), payout.currency)} {payout.currency}</Cell><Cell muted>{formatMoney(Number(payout.platform_fee), payout.currency)} {payout.currency}</Cell><Cell>{formatMoney(Number(payout.net_amount), payout.currency)} {payout.currency}</Cell><Cell muted>{payout.paid_at ? formatDate(payout.paid_at) : "Not paid"}</Cell><Cell muted>{formatDate(payout.created_at)}</Cell></tr>)}
            </tbody>
          </table>
        </AdminTable>
        {!payouts.length ? <div className="mt-6"><EmptyPanel title="No payout records yet." copy="Payout records are ready structurally and will populate once payment settlement is connected." /></div> : null}
      </AdminShell>
    );
  }

  if (key === "messages") {
    const conversations = await getAdminConversations();
    return (
      <AdminShell title={section.title} copy={section.copy}>
        <div className="grid gap-4">
          {conversations.map((conversation) => (
            <article key={conversation.id} className="rounded-xl border hairline bg-white/[0.025] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-sinner-goldSoft">{conversation.spaceName}</p>
                  <h2 className="mt-1 font-display text-2xl text-sinner-ivory">{conversation.participants.join(" · ") || "Private participants"}</h2>
                  <p className="mt-2 text-sm text-sinner-mist">{conversation.bookingReference ? `Booking ${conversation.bookingReference}` : "No booking linked"} · {conversation.messageCount} messages</p>
                </div>
                <MessageCircle size={20} className="text-sinner-goldSoft" />
              </div>
              <p className="mt-4 rounded-lg border hairline bg-black/20 p-4 text-sm leading-6 text-sinner-mist">{conversation.lastMessage || "No messages yet."}</p>
              <p className="mt-3 text-xs text-sinner-mist/60">Last activity {new Date(conversation.lastMessageAt).toLocaleString()}</p>
            </article>
          ))}
          {!conversations.length ? <EmptyPanel title="No conversations yet." copy="Guest-host conversations will appear here for admin safety review." /> : null}
        </div>
      </AdminShell>
    );
  }

  if (key === "settings") {
    const settings = await getAdminSettings();
    return (
      <AdminShell title={section.title} copy={section.copy}>
        <div className="grid gap-4">
          {settings.map((setting) => (
            <article key={setting.key} className="rounded-xl border hairline bg-white/[0.025] p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-sinner-goldSoft">App setting</p>
                  <h2 className="mt-1 font-display text-2xl text-sinner-ivory">{setting.key}</h2>
                </div>
                <Settings size={20} className="text-sinner-goldSoft" />
              </div>
              <pre className="mt-4 overflow-x-auto rounded-lg border hairline bg-black/30 p-4 text-sm text-sinner-mist">{JSON.stringify(setting.value, null, 2)}</pre>
              <p className="mt-3 text-xs text-sinner-mist/60">Updated {new Date(setting.updatedAt).toLocaleString()}</p>
            </article>
          ))}
          {!settings.length ? <EmptyPanel title="No app settings visible." copy="Platform settings will appear here after the booking engine settings table is available." /> : null}
        </div>
      </AdminShell>
    );
  }

  notFound();
}
