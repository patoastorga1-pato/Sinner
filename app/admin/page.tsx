import { CheckCircle2, Clock3, ShieldAlert, UserRound, XCircle } from "lucide-react";
import { approveHostRequestAction, rejectHostRequestAction } from "@/app/actions/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { requireRole } from "@/lib/auth/server";
import { getAdminDashboard, getAdminHostApplications, getHostApplicationCounts, type AdminHostApplication } from "@/lib/data-access/admin";
import type { HostApplicationStatus } from "@/lib/types/database";

const statusStyles: Record<HostApplicationStatus, string> = {
  pending: "border-amber-300/25 bg-amber-400/5 text-amber-100",
  approved: "border-emerald-300/25 bg-emerald-500/5 text-emerald-200",
  rejected: "border-rose-300/25 bg-rose-500/5 text-rose-200",
  suspended: "border-white/10 bg-white/[0.03] text-sinner-mist",
};

function applicantName(application: AdminHostApplication) {
  const profile = application.profile;
  return profile?.display_name || `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "SINNER member";
}

function StatusBadge({ status }: { status: HostApplicationStatus }) {
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}>{status}</span>;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requireRole("admin", "/admin");
  const [params, applications, counts, dashboard] = await Promise.all([
    searchParams,
    getAdminHostApplications(),
    getHostApplicationCounts(),
    getAdminDashboard(),
  ]);
  const pendingApplications = applications.filter((application) => application.status === "pending");

  return (
    <AdminShell title="Security Dashboard" copy="Moderation, host access and platform health overview.">
      <StatusMessage error={params.error} success={params.success} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Users", dashboard.users],
          ["Hosts", dashboard.hosts],
          ["Approved listings", dashboard.spaces.approved],
          ["Open support", dashboard.supportOpen],
        ].map(([label, value]) => (
          <article key={label} className="rounded-xl border hairline bg-white/[0.025] p-5">
            <p className="text-sm text-sinner-mist">{label}</p>
            <p className="mt-4 font-display text-4xl text-sinner-ivory">{value}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {([
          ["pending", "Pending host requests", Clock3],
          ["approved", "Approved hosts", CheckCircle2],
          ["rejected", "Rejected requests", XCircle],
          ["suspended", "Suspended hosts", ShieldAlert],
        ] as const).map(([status, label, Icon]) => (
          <article key={status} className="rounded-xl border hairline bg-white/[0.025] p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-sinner-mist">{label}</p>
              <Icon size={18} className="text-sinner-goldSoft" />
            </div>
            <p className="mt-4 font-display text-4xl text-sinner-ivory">{counts[status]}</p>
          </article>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-sinner-goldSoft">Host access</p>
            <h2 className="mt-2 font-display text-4xl text-sinner-ivory">Requests to review</h2>
          </div>
          <p className="text-sm text-sinner-mist">{pendingApplications.length} pending</p>
        </div>

        <div className="mt-6 grid gap-5">
          {applications.length ? applications.map((application) => (
            <article key={application.id} className="rounded-xl border hairline bg-white/[0.025] p-5">
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
                <StatusBadge status={application.status} />
              </div>

              {application.status === "pending" ? (
                <div className="mt-5 grid gap-3 border-t hairline pt-5 lg:grid-cols-2">
                  <form action={approveHostRequestAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input type="hidden" name="request_id" value={application.id} />
                    <input type="hidden" name="return_path" value="/admin" />
                    <input name="decision_note" placeholder="Optional approval note" className="h-11 rounded-lg border hairline bg-black/30 px-3 text-sm text-sinner-ivory outline-none placeholder:text-sinner-mist/60" />
                    <button type="submit" className="min-h-11 rounded-lg bg-sinner-gold px-4 text-sm font-semibold text-black transition hover:bg-sinner-goldSoft">Approve</button>
                  </form>
                  <form action={rejectHostRequestAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input type="hidden" name="request_id" value={application.id} />
                    <input type="hidden" name="return_path" value="/admin" />
                    <input name="decision_note" placeholder="Reason for rejection" className="h-11 rounded-lg border hairline bg-black/30 px-3 text-sm text-sinner-ivory outline-none placeholder:text-sinner-mist/60" />
                    <button type="submit" className="min-h-11 rounded-lg border border-rose-300/30 px-4 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/10">Reject</button>
                  </form>
                </div>
              ) : null}
            </article>
          )) : (
            <div className="grid min-h-72 place-items-center rounded-xl border hairline bg-white/[0.025] p-8 text-center">
              <div className="max-w-md">
                <ShieldAlert className="mx-auto text-sinner-goldSoft" size={28} />
                <h2 className="mt-4 font-display text-3xl text-sinner-ivory">No host requests yet.</h2>
                <p className="mt-2 text-sm leading-6 text-sinner-mist">New host access requests will appear here after users submit onboarding.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
