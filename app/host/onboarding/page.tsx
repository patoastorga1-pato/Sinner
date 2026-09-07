import { Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { becomeHostAction } from "@/app/actions/auth";
import { AccountShell } from "@/components/account/AccountShell";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth/server";

export default async function HostOnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const auth = await requireUser("/host/onboarding");
  const params = await searchParams;
  const isHost = auth.roles.includes("host");

  return (
    <AccountShell eyebrow="Hosting" title="Become a Host" copy="Start the protected host setup for private spaces, experiences and authorized events.">
      <StatusMessage error={params.error} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="premium-panel p-6 sm:p-8"><Building2 size={24} className="text-sinner-goldSoft" /><h2 className="mt-5 font-display text-4xl text-sinner-ivory">Host foundation</h2><p className="mt-4 leading-7 text-sinner-mist">This phase activates the host role and protected dashboard. Listing creation, verification review and payouts remain intentionally outside this phase.</p><div className="mt-7 grid gap-3 text-sm text-sinner-mist">{["Multiple roles remain attached to one account","All listing ownership is enforced by RLS","Draft spaces remain private until approved"].map((item) => <div key={item} className="flex items-center gap-3"><CheckCircle2 size={17} className="text-sinner-goldSoft" />{item}</div>)}</div></section>
        <aside className="premium-panel h-fit p-6"><ShieldCheck size={22} className="text-sinner-goldSoft" /><h2 className="mt-4 font-semibold text-sinner-ivory">Host access</h2><p className="mt-3 text-sm leading-6 text-sinner-mist">Activating this role does not bypass listing review, identity verification or platform rules.</p>{isHost ? <Link href="/host/dashboard" className="mt-6 flex h-12 items-center justify-center rounded-lg bg-sinner-gold font-semibold text-black">Open dashboard</Link> : <form action={becomeHostAction} className="mt-6"><SubmitButton className="w-full">Activate host access</SubmitButton></form>}</aside>
      </div>
    </AccountShell>
  );
}
