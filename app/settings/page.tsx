import { LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { updatePasswordAction, updateProfileAction } from "@/app/actions/auth";
import { AccountShell } from "@/components/account/AccountShell";
import { FormField } from "@/components/auth/FormField";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth/server";
import { getCurrentProfile } from "@/lib/data-access/account";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requireUser("/settings");
  const params = await searchParams;
  const profile = await getCurrentProfile();

  return (
    <AccountShell title="Settings" copy="Manage your private profile, password and communication preferences.">
      <StatusMessage error={params.error} success={params.success} />
      <div className="grid gap-6 lg:grid-cols-2">
        <form action={updateProfileAction} className="premium-panel p-6 sm:p-8">
          <div className="flex items-center gap-3"><UserRound size={19} className="text-sinner-goldSoft" /><h2 className="font-display text-3xl text-sinner-ivory">Profile</h2></div>
          <div className="mt-6 grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="First name" name="firstName" defaultValue={profile?.first_name} />
              <FormField label="Last name" name="lastName" defaultValue={profile?.last_name} />
            </div>
            <FormField label="Display name" name="displayName" required={false} defaultValue={profile?.display_name} />
            <label className="grid gap-2 text-sm text-sinner-ivory"><span className="font-medium">Bio</span><textarea name="bio" defaultValue={profile?.bio ?? ""} maxLength={500} rows={5} className="rounded-lg border hairline bg-black/35 px-4 py-3 text-white outline-none focus:border-sinner-gold/45" /></label>
            <SubmitButton>Save profile</SubmitButton>
          </div>
        </form>

        <div className="grid gap-6">
          <form action={updatePasswordAction} className="premium-panel p-6 sm:p-8">
            <div className="flex items-center gap-3"><LockKeyhole size={19} className="text-sinner-goldSoft" /><h2 className="font-display text-3xl text-sinner-ivory">Password</h2></div>
            <div className="mt-6 grid gap-5">
              <FormField label="New password" name="password" type="password" autoComplete="new-password" />
              <FormField label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" />
              <SubmitButton>Update password</SubmitButton>
            </div>
          </form>
          <section className="premium-panel p-6 sm:p-8">
            <div className="flex items-center gap-3"><ShieldCheck size={19} className="text-sinner-goldSoft" /><h2 className="font-display text-3xl text-sinner-ivory">Privacy & notifications</h2></div>
            <p className="mt-4 text-sm leading-6 text-sinner-mist">Private account fields are visible only to you. Booking and message notification controls are prepared for Phase 2.</p>
            <div className="mt-5 grid gap-3 text-sm text-sinner-mist"><div className="rounded-lg border hairline px-4 py-3">Verification provider: not connected</div><div className="rounded-lg border hairline px-4 py-3">Payments: not enabled</div></div>
          </section>
        </div>
      </div>
    </AccountShell>
  );
}
