import { LifeBuoy } from "lucide-react";
import { createSupportTicketAction } from "@/app/actions/support";
import { AccountShell } from "@/components/account/AccountShell";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth/server";
import { getSupportTickets } from "@/lib/data-access/support";

const categories = [
  ["account", "Account"],
  ["booking", "Booking"],
  ["host", "Host"],
  ["payment", "Payment"],
  ["safety", "Safety"],
  ["technical", "Technical"],
  ["other", "Other"],
] as const;

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const [, params, tickets] = await Promise.all([requireUser("/support"), searchParams, getSupportTickets()]);

  return (
    <AccountShell title="Support" copy="Private support requests tied to your SINNER account.">
      <StatusMessage error={params.error} success={params.success} />
      <div className="grid gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
        <form action={createSupportTicketAction} className="premium-panel p-6 sm:p-8">
          <div className="flex items-center gap-3"><LifeBuoy size={19} className="text-sinner-goldSoft" /><h2 className="font-display text-3xl text-sinner-ivory">New request</h2></div>
          <input type="hidden" name="return_path" value="/support" />
          <div className="mt-6 grid gap-5">
            <label className="grid gap-2 text-sm text-sinner-ivory">
              <span className="font-medium">Subject</span>
              <input name="subject" required minLength={3} maxLength={140} className="h-12 rounded-lg border hairline bg-black/35 px-4 text-white outline-none focus:border-sinner-gold/45" />
            </label>
            <label className="grid gap-2 text-sm text-sinner-ivory">
              <span className="font-medium">Category</span>
              <select name="category" className="h-12 rounded-lg border hairline bg-black/35 px-4 text-white outline-none focus:border-sinner-gold/45">
                {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-sinner-ivory">
              <span className="font-medium">Description</span>
              <textarea name="description" required minLength={10} rows={7} className="rounded-lg border hairline bg-black/35 px-4 py-3 text-white outline-none focus:border-sinner-gold/45" />
            </label>
            <SubmitButton>Create ticket</SubmitButton>
          </div>
        </form>

        <section>
          <h2 className="font-display text-3xl text-sinner-ivory">Your tickets</h2>
          <div className="mt-5 grid gap-4">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="rounded-xl border hairline bg-white/[0.025] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-sinner-goldSoft">{ticket.category}</p>
                    <h3 className="mt-1 font-display text-2xl text-sinner-ivory">{ticket.subject}</h3>
                  </div>
                  <span className="rounded-full border border-sinner-gold/20 px-3 py-1 text-xs font-semibold capitalize text-sinner-goldSoft">{ticket.status.replace(/_/g, " ")}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-sinner-mist">{ticket.description}</p>
                {ticket.admin_response ? <p className="mt-4 rounded-lg border hairline bg-black/20 p-4 text-sm leading-6 text-sinner-ivory">Admin response: {ticket.admin_response}</p> : null}
                <p className="mt-4 text-xs text-sinner-mist/70">{new Date(ticket.created_at).toLocaleString()}</p>
              </article>
            ))}
            {!tickets.length ? <div className="rounded-xl border hairline bg-white/[0.025] p-8 text-sm text-sinner-mist">No support requests yet.</div> : null}
          </div>
        </section>
      </div>
    </AccountShell>
  );
}
