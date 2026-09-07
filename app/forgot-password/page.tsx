import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const params = await searchParams;
  return (
    <AuthShell eyebrow="Account recovery" title="Reset your password" copy="We will send a secure recovery link to your verified email address.">
      <StatusMessage error={params.error} success={params.success} />
      <form action={forgotPasswordAction} className="grid gap-5">
        <FormField label="Email" name="email" type="email" autoComplete="email" />
        <SubmitButton>Send reset link</SubmitButton>
        <Link href="/login" className="text-center text-sm text-sinner-mist hover:text-white">Back to login</Link>
      </form>
    </AuthShell>
  );
}
