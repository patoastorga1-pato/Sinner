import { AccountShell } from "@/components/account/AccountShell";
import { SettingsForm } from "@/components/account/SettingsForm";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { requireUser } from "@/lib/auth/server";
import { getCurrentProfile, getCurrentUserPreferences } from "@/lib/data-access/account";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requireUser("/settings");
  const [params, profile, preferences] = await Promise.all([
    searchParams,
    getCurrentProfile(),
    getCurrentUserPreferences(),
  ]);

  return (
    <AccountShell title="Settings" copy="Manage your profile, preferences and account privacy.">
      <StatusMessage error={params.error} success={params.success} />
      <SettingsForm profile={profile} preferences={preferences} />
    </AccountShell>
  );
}
