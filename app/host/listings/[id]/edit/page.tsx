import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { updateHostListingAction } from "@/app/actions/host";
import { AccountShell } from "@/components/account/AccountShell";
import { HostListingForm } from "@/components/host/HostListingForm";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { requireRole } from "@/lib/auth/server";
import { getHostListing, getHostListingCatalog } from "@/lib/data-access/host";

export default async function EditHostListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [, listing, catalog] = await Promise.all([requireRole("host", `/host/listings/${id}/edit`), getHostListing(id), getHostListingCatalog()]);
  if (!listing) notFound();

  return (
    <AccountShell eyebrow="Host tools" title="Edit Listing" copy="Update details and send changes to admin review.">
      <Link href="/host/listings" className="inline-flex items-center gap-2 text-sm text-sinner-goldSoft"><ArrowLeft size={16} />Back to listings</Link>
      <div className="mt-6">
        <StatusMessage error={query.error} success={query.success} />
      </div>
      <div className="mt-8">
        <HostListingForm action={updateHostListingAction} listing={listing} amenities={catalog.amenities} allowedUses={catalog.allowedUses} returnPath={`/host/listings/${listing.id}/edit`} />
      </div>
    </AccountShell>
  );
}
