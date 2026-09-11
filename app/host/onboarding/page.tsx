import { Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { becomeHostAction } from "@/app/actions/auth";
import { AccountShell } from "@/components/account/AccountShell";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth/server";
import { getCurrentHostApplication } from "@/lib/data-access/account";

export default async function HostOnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const auth = await requireUser("/host/onboarding");
  const params = await searchParams;
  const isHost = auth.roles.includes("host");
  const application = isHost ? null : await getCurrentHostApplication(auth.user.id);
  const statusCopy = {
    pending: "Your request is pending admin review. Host tools stay locked until approval.",
    rejected: "Your last host request was not approved. You can submit a new request for another review.",
    suspended: "Host access is suspended. Contact SINNER support before submitting another request.",
    approved: "Your host access is approved.",
  } as const;

  return (
    <AccountShell eyebrow="Hosting" title="Become a Host" copy="Start the protected host setup for private spaces, experiences and authorized events.">
      <StatusMessage error={params.error} success={params.success} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="premium-panel p-6 sm:p-8"><Building2 size={24} className="text-sinner-goldSoft" /><h2 className="mt-5 font-display text-4xl text-sinner-ivory">Host foundation</h2><p className="mt-4 leading-7 text-sinner-mist">This phase no longer grants host access instantly. A request is stored in Supabase, reviewed by an admin, and only approved accounts receive the host role.</p><div className="mt-7 grid gap-3 text-sm text-sinner-mist">{["Multiple roles remain attached to one account","Host approval is enforced by server logic and RLS","Draft spaces remain private until approved"].map((item) => <div key={item} className="flex items-center gap-3"><CheckCircle2 size={17} className="text-sinner-goldSoft" />{item}</div>)}</div></section>
        <aside className="premium-panel h-fit p-6"><ShieldCheck size={22} className="text-sinner-goldSoft" /><h2 className="mt-4 font-semibold text-sinner-ivory">Host access</h2><p className="mt-3 text-sm leading-6 text-sinner-mist">{isHost ? "Your account has approved host access." : application ? statusCopy[application.status] : "Submit a request so an admin can review host access before tools are unlocked."}</p>{application?.decision_note ? <p className="mt-4 rounded-lg border hairline bg-black/25 p-3 text-sm leading-6 text-sinner-mist">{application.decision_note}</p> : null}{isHost ? <Link href="/host/dashboard" className="mt-6 flex h-12 items-center justify-center rounded-lg bg-sinner-gold font-semibold text-black">Open dashboard</Link> : application?.status === "pending" || application?.status === "suspended" ? <div className="mt-6 rounded-lg border hairline px-4 py-3 text-sm text-sinner-mist">{application.status === "pending" ? "Waiting for admin review." : "Host access is currently suspended."}</div> : <form action={becomeHostAction} className="mt-6"><SubmitButton className="w-full">{application?.status === "rejected" ? "Submit new request" : "Request host access"}</SubmitButton></form>}</aside>
      </div>
    </AccountShell>
  );
}
