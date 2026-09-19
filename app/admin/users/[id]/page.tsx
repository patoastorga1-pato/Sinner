import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminUserDetail } from "@/lib/data-access/admin";

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  if (!detail) notFound();
  const { user } = detail;
  const name = user.display_name || `${user.first_name} ${user.last_name}`.trim() || "SINNER member";
  return <AdminShell title={name} copy={`User record · ${user.id}`}>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <section className="rounded-md border hairline bg-white/[0.025] p-5"><h2 className="font-display text-2xl">Overview</h2><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-sinner-mist">Roles</dt><dd className="mt-1 text-white">{user.roles.join(", ") || "Member"}</dd></div><div><dt className="text-sinner-mist">Age verification</dt><dd className="mt-1 capitalize text-white">{user.ageStatus}</dd></div><div><dt className="text-sinner-mist">Identity</dt><dd className="mt-1 capitalize text-white">{user.identityStatus}</dd></div><div><dt className="text-sinner-mist">Created</dt><dd className="mt-1 text-white">{new Date(user.created_at).toLocaleString()}</dd></div><div><dt className="text-sinner-mist">Bookings</dt><dd className="mt-1 text-white">{detail.bookings.length}</dd></div><div><dt className="text-sinner-mist">Listings</dt><dd className="mt-1 text-white">{detail.publications.length}</dd></div>
        </dl></section>
        {[['Bookings', detail.bookings.map((item) => `${item.bookingReference} · ${item.spaceName} · ${item.status}`)], ['Listings', detail.publications.map((item) => `${item.name} · ${item.kind} · ${item.status}`)], ['Reports', detail.reports.map((item) => `${item.reason} · ${item.status}`)], ['Support', detail.support.map((item) => `${item.subject} · ${item.status}`)]].map(([title, rows]) => <section key={title as string} className="rounded-md border hairline bg-white/[0.025] p-5"><h2 className="font-display text-2xl">{title as string}</h2><div className="mt-4 divide-y hairline">{(rows as string[]).map((row) => <p key={row} className="py-3 text-sm text-sinner-mist">{row}</p>)}{!(rows as string[]).length ? <p className="py-4 text-sm text-sinner-mist">No records yet.</p> : null}</div></section>)}
      </div>
      <aside className="h-fit rounded-md border hairline bg-white/[0.025] p-5"><h2 className="text-sm font-semibold text-white">Sensitive controls</h2><p className="mt-3 text-sm leading-6 text-sinner-mist">Suspension, role removal, reverification and identity-document access require the granular permissions and audited-action backend. They are intentionally unavailable until that migration is active.</p>{user.ageDocumentPath ? <p className="mt-4 rounded-md border hairline p-3 text-xs text-sinner-mist">Identity document stored. No URL was generated.</p> : null}</aside>
    </div>
  </AdminShell>;
}
