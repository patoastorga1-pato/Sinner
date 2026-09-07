import { MessageCircle } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireUser } from "@/lib/auth/server";

export default async function MessagesPage() {
  await requireUser("/messages");
  return <AccountShell title="Messages" copy="Private conversations with hosts and event organizers."><EmptyState icon={MessageCircle} title="No conversations yet." copy="Messaging tables and access rules are ready; the complete messaging interface belongs to Phase 2." /></AccountShell>;
}

