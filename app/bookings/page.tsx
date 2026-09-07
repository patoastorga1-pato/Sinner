import { CalendarDays } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireUser } from "@/lib/auth/server";

export default async function BookingsPage() {
  await requireUser("/bookings");
  return <AccountShell title="Bookings" copy="Track upcoming and past reservations."><EmptyState icon={CalendarDays} title="Your next experience starts here." copy="No bookings have been created yet. Payments and confirmed reservation creation arrive in Phase 3." actionLabel="Explore spaces" actionHref="/spaces" /></AccountShell>;
}
