import { ShieldAlert } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireRole } from "@/lib/auth/server";

export default async function AdminPage() {
  await requireRole("admin", "/admin");
  return <AccountShell eyebrow="Administration" title="Moderation" copy="Protected tools for listings, reports and account safety."><EmptyState icon={ShieldAlert} title="Moderation foundation ready." copy="RLS and report models are prepared. The complete admin panel belongs to a later phase." /></AccountShell>;
}

