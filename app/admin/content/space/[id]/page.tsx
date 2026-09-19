import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, CircleAlert, ExternalLink, MapPin, Users } from "lucide-react";
import { updatePublicationStatusAction } from "@/app/actions/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSpaceReview } from "@/lib/data-access/admin";
import { formatMoney } from "@/lib/marketplace/pricing";

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><dt className="text-xs uppercase text-sinner-mist/60">{label}</dt><dd className="mt-1 text-sm leading-6 text-white">{value || "Not provided"}</dd></div>;
}

export default async function AdminSpaceReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const space = await getAdminSpaceReview(id);
  if (!space) notFound();
  const checklist = [
    ["Photos", space.photos.length > 0], ["Location", Boolean(space.exactAddress && space.city && space.state)],
    ["Price", space.price !== null], ["Description", Boolean(space.description || space.shortDescription)],
    ["Amenities", space.amenities.length > 0], ["Allowed uses", space.allowedUses.length > 0],
    ["House rules", space.houseRules.length > 0],
  ] as const;

  return <AdminShell title={space.name} copy={`Review submitted space by ${space.hostName}.`}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <Link href="/admin/host-requests" className="text-sm text-sinner-mist hover:text-white">← Back to approval queues</Link>
      {space.slug ? <Link href={`/spaces/${space.slug}`} target="_blank" className="inline-flex items-center gap-2 rounded-md border hairline px-4 py-2 text-sm text-sinner-goldSoft">Preview listing <ExternalLink size={15} /></Link> : null}
    </div>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-md border hairline bg-white/[0.02]">
          {space.photos.length ? <div className="grid gap-1 sm:grid-cols-2"><div className="aspect-[4/3] bg-cover bg-center sm:row-span-2" style={{ backgroundImage: `url(${space.photos[0].url})` }} />{space.photos.slice(1, 3).map((photo) => <div key={photo.id} className="aspect-[2/1] bg-cover bg-center" style={{ backgroundImage: `url(${photo.url})` }} />)}</div> : <div className="grid aspect-[16/7] place-items-center bg-white/[0.02] text-sm text-sinner-mist">No photos uploaded</div>}
          <div className="p-5"><p className="text-sm leading-7 text-sinner-mist">{space.description || space.shortDescription || "No description provided."}</p></div>
        </section>

        <section className="rounded-md border hairline bg-white/[0.02] p-5"><h2 className="font-display text-2xl text-white">Listing information</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Type" value={space.spaceType} /><Detail label="Host" value={space.hostName} /><Detail label="Capacity" value={<span className="inline-flex items-center gap-2"><Users size={15} />{space.maxGuests} guests</span>} />
          <Detail label="Public location" value={`${space.locality ? `${space.locality}, ` : ""}${space.city}, ${space.state}`} /><Detail label="Exact address" value={<span className="inline-flex gap-2"><MapPin size={15} className="mt-1 shrink-0" />{space.exactAddress}</span>} /><Detail label="Postal code" value={space.postalCode} />
          <Detail label="Starting price" value={space.price === null ? "Not provided" : `${formatMoney(space.price, space.currency)} ${space.currency}`} /><Detail label="Cleaning fee" value={`${formatMoney(space.cleaningFee, space.currency)} ${space.currency}`} /><Detail label="Minimum" value={`${space.minimumHours} hours`} />
        </dl></section>

        <section className="grid gap-5 md:grid-cols-3">
          {[['Amenities', space.amenities], ['Allowed uses', space.allowedUses], ['House rules', space.houseRules]].map(([title, items]) => <div key={title as string} className="rounded-md border hairline bg-white/[0.02] p-5"><h2 className="font-semibold text-white">{title as string}</h2><ul className="mt-4 space-y-2 text-sm text-sinner-mist">{(items as string[]).map((item) => <li key={item}>• {item}</li>)}{!(items as string[]).length ? <li>Not provided</li> : null}</ul></div>)}
        </section>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-20 xl:h-fit">
        <section className="rounded-md border hairline bg-white/[0.025] p-5"><div className="flex items-center justify-between"><h2 className="font-display text-2xl">Review checklist</h2><span className="rounded-full border border-sinner-gold/25 px-3 py-1 text-xs capitalize text-sinner-goldSoft">{space.status.replace(/_/g, " ")}</span></div><div className="mt-5 space-y-3">{checklist.map(([label, complete]) => <div key={label} className="flex items-center justify-between text-sm"><span className="text-sinner-mist">{label}</span>{complete ? <CheckCircle2 size={17} className="text-emerald-300" /> : <CircleAlert size={17} className="text-amber-300" />}</div>)}</div></section>
        <form action={updatePublicationStatusAction} className="rounded-md border hairline bg-white/[0.025] p-5">
          <input type="hidden" name="publication_id" value={space.id} /><input type="hidden" name="kind" value="space" /><input type="hidden" name="return_path" value="/admin/host-requests" />
          <label className="text-sm font-semibold text-white" htmlFor="status">Decision</label><select id="status" name="status" defaultValue={space.status === "pending_review" ? "approved" : space.status} className="mt-2 h-11 w-full rounded-md border hairline bg-black/40 px-3 text-sm text-white"><option value="approved">Approve publication</option><option value="rejected">Reject publication</option><option value="suspended">Suspend publication</option><option value="draft">Return to draft</option></select>
          <label className="mt-4 block text-sm font-semibold text-white" htmlFor="reason">Reason / internal note</label><textarea id="reason" name="reason" required rows={4} placeholder="Explain the decision" className="mt-2 w-full rounded-md border hairline bg-black/40 px-3 py-3 text-sm text-white outline-none" />
          <button className="mt-4 min-h-11 w-full rounded-md bg-sinner-gold px-4 text-sm font-semibold text-black">Apply decision</button>
          <p className="mt-3 text-xs leading-5 text-sinner-mist">The listing status changes only after this decision is submitted.</p>
        </form>
      </aside>
    </div>
  </AdminShell>;
}
