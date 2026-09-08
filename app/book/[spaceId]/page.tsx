import { randomUUID } from "node:crypto";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Check, Clock, MapPin, ShieldCheck, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { createBookingAction } from "@/app/actions/bookings";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth/server";
import { getSelectionEndLabel } from "@/lib/bookings/time";
import { getSpaceAvailability, getSpaceById } from "@/lib/data-access/marketplace";
import { calculatePriceEstimate, formatMoney } from "@/lib/marketplace/pricing";
import { parseReservationParams } from "@/lib/marketplace/search";
import type { RawSearchParams } from "@/lib/types/marketplace";

export default async function BookSpacePage({
  params,
  searchParams,
}: {
  params: Promise<{ spaceId: string }>;
  searchParams: Promise<RawSearchParams & { error?: string; success?: string }>;
}) {
  const [{ spaceId }, raw] = await Promise.all([params, searchParams]);
  const passthrough = new URLSearchParams();
  Object.entries(raw).forEach(([key, value]) => (Array.isArray(value) ? value : [value]).filter(Boolean).forEach((item) => passthrough.append(key, String(item))));
  await requireUser(`/book/${spaceId}?${passthrough.toString()}`);

  const space = await getSpaceById(spaceId);
  if (!space) notFound();

  const selection = parseReservationParams(raw, space.minimumHours);
  if (!selection.date) notFound();
  const estimate = calculatePriceEstimate(space, selection);
  if (!estimate) notFound();
  const availability = await getSpaceAvailability(space.id, selection);
  const bookingType = space.instantBooking ? "instant" : "request";
  const returnPath = `/book/${space.id}?${passthrough.toString()}`;
  const endLabel = getSelectionEndLabel(selection);

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <Link href={`/spaces/${space.slug}?${passthrough.toString()}`} className="inline-flex items-center gap-2 text-sm text-sinner-goldSoft"><ArrowLeft size={16} />Back to space</Link>
        <StatusMessage error={raw.error as string | undefined} success={raw.success as string | undefined} />
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-sinner-goldSoft">Booking review</p>
            <h1 className="mt-3 font-display text-5xl font-medium text-sinner-ivory sm:text-6xl">{space.instantBooking ? "Reserve this space" : "Request this space"}</h1>
            <p className="mt-4 max-w-2xl leading-7 text-sinner-mist">{space.instantBooking ? "A temporary payment hold will be created. This is not a confirmed booking until payment exists in a future phase." : "The host will review your request before a temporary payment hold can be created."}</p>

            <div className="mt-9 overflow-hidden rounded-xl border hairline bg-white/[0.025]">
              <div className="relative aspect-[16/9] min-h-60">
                <Image src={space.coverPhoto} alt={space.name} fill sizes="(max-width: 1024px) 100vw, 700px" className="object-cover" />
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase text-sinner-goldSoft">{space.spaceType}</p>
                <h2 className="mt-2 font-display text-4xl text-sinner-ivory">{space.name}</h2>
                <p className="mt-3 flex items-center gap-2 text-sm text-sinner-mist"><MapPin size={16} />{space.approximateLocation}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-x-8 sm:grid-cols-2">
              {[{ icon: CalendarDays, label: "Date", value: selection.date }, { icon: Clock, label: "Time", value: `${selection.start}-${endLabel} · ${space.timezone}` }, { icon: Users, label: "Guests", value: String(selection.guests) }, { icon: ShieldCheck, label: "Booking type", value: bookingType === "instant" ? "Instant booking" : "Request to book" }].map((item) => { const Icon = item.icon; return <div key={item.label} className="flex gap-3 border-b hairline py-5"><Icon size={18} className="mt-0.5 shrink-0 text-sinner-goldSoft" /><div><p className="text-xs uppercase text-sinner-mist/60">{item.label}</p><p className="mt-1 text-sm text-sinner-ivory">{item.value}</p></div></div>; })}
            </div>

            <section className="mt-10 border-t hairline pt-8">
              <h2 className="font-display text-4xl text-sinner-ivory">Rules and permissions</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {space.rules.map((rule) => <div key={rule.key} className="flex gap-3 rounded-lg border hairline bg-black/20 p-4"><Check size={17} className="mt-0.5 shrink-0 text-sinner-goldSoft" /><div><p className="text-sm font-medium text-sinner-ivory">{rule.label}</p><p className="mt-1 text-sm leading-6 text-sinner-mist">{rule.detail}</p></div></div>)}
              </div>
              <p className="mt-6 text-sm leading-6 text-sinner-mist">Allowed uses: {space.allowedUses.filter((use) => use.allowed).map((use) => use.name).join(", ") || "Confirm with host"}.</p>
              <p className="mt-3 text-sm leading-6 text-sinner-mist">Cancellation: {space.cancellationPolicy}</p>
            </section>
          </div>

          <aside className="premium-panel h-fit p-6 lg:sticky lg:top-24">
            <form action={createBookingAction}>
              <input type="hidden" name="space_id" value={space.id} />
              <input type="hidden" name="booking_type" value={bookingType} />
              <input type="hidden" name="date" value={selection.date} />
              <input type="hidden" name="start" value={selection.start} />
              <input type="hidden" name="duration" value={selection.duration} />
              <input type="hidden" name="guests" value={selection.guests} />
              <input type="hidden" name="idempotency_key" value={randomUUID()} />
              <input type="hidden" name="return_path" value={returnPath} />

              <p className="text-xs font-semibold uppercase text-sinner-goldSoft">Price snapshot</p>
              <div className="mt-5 space-y-3 text-sm text-sinner-mist">
                <div className="flex justify-between gap-4"><span>{selection.mode === "hourly" ? `${formatMoney(estimate.rate)} x ${selection.duration} hours` : `${selection.mode} rate`}</span><span>{formatMoney(estimate.baseAmount)} MXN</span></div>
                <div className="flex justify-between gap-4"><span>Cleaning fee</span><span>{formatMoney(estimate.cleaningFee)} MXN</span></div>
                <div className="flex justify-between gap-4"><span>SINNER service fee ({estimate.serviceFeePercent}%)</span><span>{formatMoney(estimate.serviceFee)} MXN</span></div>
                <div className="flex justify-between border-t hairline pt-4 font-semibold text-sinner-ivory"><span>Total</span><span>{formatMoney(estimate.total)} MXN</span></div>
              </div>

              <div className={`mt-6 rounded-lg border p-4 text-sm ${availability.available ? "border-emerald-300/25 bg-emerald-500/5 text-emerald-200" : "border-rose-300/25 bg-rose-500/5 text-rose-200"}`}>{availability.message}</div>
              <label className="mt-5 block text-sm text-sinner-mist"><span className="mb-2 block">Message to host</span><textarea name="guest_message" rows={4} maxLength={1000} className="w-full rounded-lg border hairline bg-black/30 px-3 py-3 text-sinner-ivory outline-none placeholder:text-sinner-mist/60" placeholder="Share arrival context or any relevant request." /></label>
              <label className="mt-5 flex gap-3 text-sm leading-6 text-sinner-mist"><input required type="checkbox" name="rules_accepted" className="mt-1 h-4 w-4 accent-sinner-gold" /><span>I agree to the space rules and understand exact address details remain protected until a future confirmed-booking flow.</span></label>
              <SubmitButton className="mt-6 w-full">{bookingType === "instant" ? "Create temporary hold" : "Request to book"}</SubmitButton>
              <p className="mt-4 text-center text-xs leading-5 text-sinner-mist/70">No payment is processed and unpaid reservations are not confirmed in Phase 3.</p>
            </form>
          </aside>
        </div>
      </section>
      <Footer />
    </main>
  );
}
