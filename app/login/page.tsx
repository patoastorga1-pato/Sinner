import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { safeRedirectPath } from "@/lib/auth/redirect";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string; error?: string; success?: string }> }) {
  const params = await searchParams;
  const redirectPath = safeRedirectPath(params.redirect, "/");

  return (
    <AuthShell eyebrow="Welcome back" title="Log in" copy="Access your saved spaces, bookings and private account.">
      <StatusMessage error={params.error} success={params.success} />
      <form action={loginAction} className="grid gap-5">
        <input type="hidden" name="redirect" value={redirectPath} />
        <FormField label="Email" name="email" type="email" autoComplete="email" />
        <FormField label="Password" name="password" type="password" autoComplete="current-password" />
        <div className="flex items-center justify-between gap-4 text-sm">
          <Link href="/forgot-password" className="text-sinner-goldSoft hover:text-sinner-gold">Forgot password?</Link>
          <Link href="/signup" className="text-sinner-mist hover:text-white">Create account</Link>
        </div>
        <SubmitButton>Log in</SubmitButton>
      </form>
    </AuthShell>
  );
}
