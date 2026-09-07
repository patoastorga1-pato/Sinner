import Link from "next/link";
import { signupAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";

function adultBirthDateLimit() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().slice(0, 10);
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <AuthShell eyebrow="Adults only" title="Create your account" copy="Join the private marketplace for spaces, experiences and authorized adult events.">
      <StatusMessage error={params.error} />
      <form action={signupAction} className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="First name" name="firstName" autoComplete="given-name" />
          <FormField label="Last name" name="lastName" autoComplete="family-name" />
        </div>
        <FormField label="Email" name="email" type="email" autoComplete="email" />
        <FormField label="Date of birth" name="dateOfBirth" type="date" autoComplete="bday" max={adultBirthDateLimit()} />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Password" name="password" type="password" autoComplete="new-password" />
          <FormField label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" />
        </div>
        <label className="flex items-start gap-3 text-sm leading-6 text-sinner-mist">
          <input required type="checkbox" name="adultConfirmation" className="mt-1 h-4 w-4 accent-sinner-gold" />
          <span>I confirm that I am at least 18 years old.</span>
        </label>
        <label className="flex items-start gap-3 text-sm leading-6 text-sinner-mist">
          <input required type="checkbox" name="legalAcceptance" className="mt-1 h-4 w-4 accent-sinner-gold" />
          <span>I agree to SINNER&apos;s <Link href="/terms" className="text-sinner-goldSoft">Terms</Link> and <Link href="/privacy" className="text-sinner-goldSoft">Privacy Policy</Link>.</span>
        </label>
        <SubmitButton>Create account</SubmitButton>
        <p className="text-center text-sm text-sinner-mist">Already registered? <Link href="/login" className="text-sinner-goldSoft">Log in</Link></p>
      </form>
    </AuthShell>
  );
}
