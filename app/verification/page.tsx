import { FileCheck2, ShieldCheck } from "lucide-react";
import { updateVerificationAction } from "@/app/actions/auth";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountVerificationPanel } from "@/components/account/AccountVerificationPanel";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth/server";
import { getCurrentProfile } from "@/lib/data-access/account";

function genderLabel(gender?: string | null) {
  if (gender === "male") return "Hombre";
  if (gender === "female") return "Mujer";
  return "Not selected";
}

export default async function VerificationPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requireUser("/verification");
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const mustUploadDocument = !profile?.age_verification_document_path || profile.age_verification_status === "rejected";

  return (
    <AccountShell title="Verification" copy="Manage age and identity verification for your private SINNER account.">
      <StatusMessage error={params.error} success={params.success} />
      <div className="grid gap-6">
        <AccountVerificationPanel profile={profile} />

        <section className="premium-panel p-6 sm:p-8">
          <div className="flex items-center gap-3"><ShieldCheck size={19} className="text-sinner-goldSoft" /><h2 className="font-display text-3xl text-sinner-ivory">Verification details</h2></div>
          <p className="mt-4 text-sm leading-6 text-sinner-mist">Your exact identity document is stored privately and only used for age verification review. Public listings and public profiles never expose this document.</p>
          <form action={updateVerificationAction} encType="multipart/form-data" className="mt-6 grid gap-5">
            <input type="hidden" name="return_path" value="/verification" />
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

            <div className="grid gap-3 text-sm text-sinner-mist md:grid-cols-3">
              <div className="rounded-lg border hairline px-4 py-3">Identity: {genderLabel(profile?.gender)}</div>
              <div className="rounded-lg border hairline px-4 py-3">Age verification: <span className="capitalize text-sinner-goldSoft">{profile?.age_verification_status ?? "unverified"}</span></div>
              {profile?.age_verification_submitted_at ? <div className="rounded-lg border hairline px-4 py-3">Submitted: {new Date(profile.age_verification_submitted_at).toLocaleDateString()}</div> : null}
            </div>

            <SubmitButton>Save verification</SubmitButton>
          </form>
        </section>

        <section className="rounded-2xl border hairline bg-white/[0.018] p-5">
          <div className="flex gap-3 text-sm leading-6 text-sinner-mist">
            <FileCheck2 size={18} className="mt-0.5 shrink-0 text-sinner-goldSoft" />
            <p>Admin review is required before age verification becomes verified. Uploading a document sets the age verification state to pending.</p>
          </div>
        </section>
      </div>
    </AccountShell>
  );
}
