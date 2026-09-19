import { LogOut, MonitorSmartphone, ShieldAlert, ShieldCheck } from "lucide-react";
import { logoutAction, updatePasswordAction } from "@/app/actions/auth";
import { AccountShell } from "@/components/account/AccountShell";
import { FormField } from "@/components/auth/FormField";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth/server";

export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requireUser("/security");
  const params = await searchParams;

  return (
    <AccountShell title="Security" copy="Manage password, sessions and account safety controls.">
      <StatusMessage error={params.error} success={params.success} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form action={updatePasswordAction} className="premium-panel p-6 sm:p-8">
          <input type="hidden" name="return_path" value="/security" />
          <div className="flex items-center gap-3"><ShieldCheck size={19} className="text-sinner-goldSoft" /><h2 className="font-display text-3xl text-sinner-ivory">Change password</h2></div>
          <div className="mt-6 grid gap-5">
            <FormField label="New password" name="password" type="password" autoComplete="new-password" />
            <FormField label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" />
            <SubmitButton>Update password</SubmitButton>
          </div>
        </form>

        <aside className="grid gap-6">
          <section className="premium-panel p-6">
            <div className="flex items-center gap-3"><LogOut size={18} className="text-sinner-goldSoft" /><h2 className="font-semibold text-sinner-ivory">Sign out</h2></div>
            <p className="mt-3 text-sm leading-6 text-sinner-mist">End this browser session securely.</p>
            <form action={logoutAction} className="mt-5">
              <button type="submit" className="min-h-11 rounded-lg border border-sinner-gold/25 px-4 text-sm font-semibold text-sinner-goldSoft transition hover:bg-sinner-gold/10">Log out</button>
            </form>
          </section>

          <section className="premium-panel p-6">
            <div className="flex items-center gap-3"><MonitorSmartphone size={18} className="text-sinner-goldSoft" /><h2 className="font-semibold text-sinner-ivory">Sessions</h2></div>
            <p className="mt-3 text-sm leading-6 text-sinner-mist">You can securely end the current session. Managing other signed-in devices is not available yet.</p>
          </section>
        </aside>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border hairline bg-white/[0.018] p-5">
          <ShieldAlert size={19} className="text-sinner-goldSoft" />
          <h2 className="mt-4 font-semibold text-sinner-ivory">Two-factor authentication</h2>
          <p className="mt-2 text-sm leading-6 text-sinner-mist">Two-factor authentication is not available yet.</p>
        </section>
        <section className="rounded-2xl border hairline bg-white/[0.018] p-5">
          <ShieldCheck size={19} className="text-sinner-goldSoft" />
          <h2 className="mt-4 font-semibold text-sinner-ivory">Security activity</h2>
          <p className="mt-2 text-sm leading-6 text-sinner-mist">Security activity history is not available yet.</p>
        </section>
      </div>
    </AccountShell>
  );
}
