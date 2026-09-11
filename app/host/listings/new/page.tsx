import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createHostListingAction } from "@/app/actions/host";
import { AccountShell } from "@/components/account/AccountShell";
import { HostListingForm } from "@/components/host/HostListingForm";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { requireRole } from "@/lib/auth/server";
import { getHostListingCatalog } from "@/lib/data-access/host";

export default async function NewHostListingPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const [, params, catalog] = await Promise.all([requireRole("host", "/host/listings/new"), searchParams, getHostListingCatalog()]);

  return (
    <AccountShell eyebrow="Host tools" title="New Listing" copy="Create a private space and submit it for admin review.">
      <Link href="/host/listings" className="inline-flex items-center gap-2 text-sm text-sinner-goldSoft"><ArrowLeft size={16} />Back to listings</Link>
      <div className="mt-6">
        <StatusMessage error={params.error} success={params.success} />
      </div>
      <div className="mt-8">
        <HostListingForm action={createHostListingAction} amenities={catalog.amenities} allowedUses={catalog.allowedUses} returnPath="/host/listings/new" />
      </div>
    </AccountShell>
  );
}
