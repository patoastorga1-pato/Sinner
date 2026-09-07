import { resetPasswordAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <AuthShell eyebrow="Secure account" title="Choose a new password" copy="Use at least eight characters and keep this password unique to SINNER.">
      <StatusMessage error={params.error} />
      <form action={resetPasswordAction} className="grid gap-5">
        <FormField label="New password" name="password" type="password" autoComplete="new-password" />
        <FormField label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" />
        <SubmitButton>Update password</SubmitButton>
      </form>
    </AuthShell>
  );
}
