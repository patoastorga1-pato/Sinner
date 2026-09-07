import { notFound } from "next/navigation";
import { Banknote, Building2, CalendarDays, LayoutDashboard, MessageCircle, NotebookTabs } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireRole } from "@/lib/auth/server";

const sections = {
  dashboard: { title: "Host Dashboard", copy: "A private overview of your hosting activity.", empty: "Your host workspace is ready.", detail: "Create your first listing in Phase 2 to begin receiving booking requests.", icon: LayoutDashboard },
  listings: { title: "Host Listings", copy: "Manage draft, pending and approved spaces.", empty: "List your first space.", detail: "The listing editor and media upload flow arrive in Phase 2.", icon: Building2 },
  bookings: { title: "Host Bookings", copy: "Review requests associated with spaces you own.", empty: "No booking requests yet.", detail: "Requests will appear here after booking functionality is enabled.", icon: NotebookTabs },
  calendar: { title: "Host Calendar", copy: "Hourly availability and reservation blocks.", empty: "No availability configured.", detail: "The hourly availability engine is planned for Phase 2.", icon: CalendarDays },
  messages: { title: "Host Messages", copy: "Private conversations linked to listings and bookings.", empty: "No host conversations yet.", detail: "Only conversation participants will be able to access messages.", icon: MessageCircle },
  earnings: { title: "Host Earnings", copy: "Future payouts and earning summaries.", empty: "Payments are not enabled.", detail: "SINNER does not process payments or payouts in this phase.", icon: Banknote },
} as const;

export default async function HostSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section: sectionKey } = await params;
  const section = sections[sectionKey as keyof typeof sections];
  if (!section) notFound();
  await requireRole("host", `/host/${sectionKey}`);
  return <AccountShell eyebrow="Host tools" title={section.title} copy={section.copy}><EmptyState icon={section.icon} title={section.empty} copy={section.detail} /></AccountShell>;
}
