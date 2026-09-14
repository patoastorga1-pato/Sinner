import { Bell, Download, Globe2, Trash2, UserRound } from "lucide-react";
import { updateProfileAction } from "@/app/actions/auth";
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
    <AccountShell title="Settings" copy="Manage your private profile, preferences and account privacy.">
      <StatusMessage error={params.error} success={params.success} />
      <div className="grid gap-6">
        <form action={updateProfileAction} className="premium-panel p-6 sm:p-8">
          <input type="hidden" name="return_path" value="/settings" />
          <div className="flex items-center gap-3"><UserRound size={19} className="text-sinner-goldSoft" /><h2 className="font-display text-3xl text-sinner-ivory">Profile</h2></div>
          <div className="mt-6 grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="First name" name="firstName" defaultValue={profile?.first_name} />
              <FormField label="Last name" name="lastName" defaultValue={profile?.last_name} />
            </div>
            <FormField label="Display name" name="displayName" required={false} defaultValue={profile?.display_name} />
            <FormField label="Avatar URL" name="avatarUrl" type="url" required={false} defaultValue={profile?.avatar_url} />
            <label className="grid gap-2 text-sm text-sinner-ivory">
              <span className="font-medium">Bio</span>
              <textarea name="bio" defaultValue={profile?.bio ?? ""} maxLength={500} rows={5} className="rounded-lg border hairline bg-black/35 px-4 py-3 text-white outline-none focus:border-sinner-gold/45" />
            </label>
            <SubmitButton>Save profile</SubmitButton>
          </div>
        </form>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="premium-panel p-6 sm:p-8">
            <div className="flex items-center gap-3"><Globe2 size={19} className="text-sinner-goldSoft" /><h2 className="font-display text-3xl text-sinner-ivory">Preferences</h2></div>
            <div className="mt-6 grid gap-4 text-sm text-sinner-mist">
              <div className="rounded-xl border hairline bg-black/20 p-4">
                <p className="font-medium text-sinner-ivory">Language</p>
                <p className="mt-2">English is active. Language storage can be connected when preference columns are added.</p>
              </div>
              <div className="rounded-xl border hairline bg-black/20 p-4">
                <p className="font-medium text-sinner-ivory">Marketplace preferences</p>
                <p className="mt-2">Search and booking preferences are not stored yet.</p>
              </div>
            </div>
          </section>

          <section className="premium-panel p-6 sm:p-8">
            <div className="flex items-center gap-3"><Bell size={19} className="text-sinner-goldSoft" /><h2 className="font-display text-3xl text-sinner-ivory">Notification preferences</h2></div>
            <div className="mt-6 grid gap-3 text-sm text-sinner-mist">
              {["Reservations", "Messages", "Verification", "Payments", "Security updates"].map((label) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-xl border hairline bg-black/20 p-4">
                  <span>{label}</span>
                  <span className="rounded-full border border-sinner-gold/20 px-3 py-1 text-xs text-sinner-goldSoft">Prepared</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="premium-panel p-6 sm:p-8">
          <h2 className="font-display text-3xl text-sinner-ivory">Account & privacy</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border hairline bg-black/20 p-5">
              <Download size={19} className="text-sinner-goldSoft" />
              <h3 className="mt-4 font-semibold text-sinner-ivory">Download data</h3>
              <p className="mt-2 text-sm leading-6 text-sinner-mist">Prepared for a future export workflow.</p>
              <button type="button" disabled className="mt-4 min-h-10 cursor-not-allowed rounded-lg border hairline px-4 text-sm text-sinner-mist/60">Not available yet</button>
            </div>
            <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.03] p-5">
              <Trash2 size={19} className="text-rose-200" />
              <h3 className="mt-4 font-semibold text-sinner-ivory">Delete account</h3>
              <p className="mt-2 text-sm leading-6 text-sinner-mist">This requires a dedicated backend flow so bookings, payments and legal records are handled safely.</p>
              <button type="button" disabled className="mt-4 min-h-10 cursor-not-allowed rounded-lg border border-rose-400/20 px-4 text-sm text-rose-100/60">Prepared</button>
            </div>
          </div>
        </section>
      </div>
    </AccountShell>
  );
}
