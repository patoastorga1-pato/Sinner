import { LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { updatePasswordAction, updateProfileAction, updateVerificationAction } from "@/app/actions/auth";
import { AccountShell } from "@/components/account/AccountShell";
import { FormField } from "@/components/auth/FormField";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth/server";
import { getCurrentProfile } from "@/lib/data-access/account";

function genderLabel(gender?: string | null) {
  if (gender === "male") return "Hombre";
  if (gender === "female") return "Mujer";
  return "Not selected";
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requireUser("/settings");
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const mustUploadDocument = !profile?.age_verification_document_path || profile.age_verification_status === "rejected";

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
            <div className="flex items-center gap-3"><ShieldCheck size={19} className="text-sinner-goldSoft" /><h2 className="font-display text-3xl text-sinner-ivory">Verification</h2></div>
            <p className="mt-4 text-sm leading-6 text-sinner-mist">Your exact identity document is stored privately and only used for age verification review.</p>
            <form action={updateVerificationAction} encType="multipart/form-data" className="mt-6 grid gap-5">
              <label className="grid gap-2 text-sm text-sinner-ivory">
                <span className="font-medium">Identity</span>
                <select name="gender" required defaultValue={profile?.gender ?? ""} className="h-12 rounded-lg border hairline bg-black/35 px-4 text-white outline-none transition focus:border-sinner-gold/45 focus:ring-2 focus:ring-sinner-purple/25">
                  <option value="" disabled>Choose hombre or mujer</option>
                  <option value="male">Hombre</option>
                  <option value="female">Mujer</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm text-sinner-ivory">
                <span className="font-medium">Age verification ID photo</span>
                <input
                  name="ageDocument"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required={mustUploadDocument}
                  className="rounded-lg border hairline bg-black/35 px-4 py-3 text-sm text-sinner-mist outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-sinner-gold file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-sinner-goldSoft focus:border-sinner-gold/45 focus:ring-2 focus:ring-sinner-purple/25"
                />
                <span className="text-xs leading-5 text-sinner-mist/70">JPG, PNG or WEBP. Max 8 MB.</span>
              </label>

              <div className="grid gap-3 text-sm text-sinner-mist">
                <div className="rounded-lg border hairline px-4 py-3">Identity: {genderLabel(profile?.gender)}</div>
                <div className="rounded-lg border hairline px-4 py-3">Age verification: <span className="capitalize text-sinner-goldSoft">{profile?.age_verification_status ?? "unverified"}</span></div>
                {profile?.age_verification_submitted_at ? <div className="rounded-lg border hairline px-4 py-3">Submitted: {new Date(profile.age_verification_submitted_at).toLocaleDateString()}</div> : null}
              </div>

              <SubmitButton>Save verification</SubmitButton>
            </form>
          </section>
        </div>
      </div>
    </AccountShell>
  );
}
