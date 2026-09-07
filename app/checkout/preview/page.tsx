import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, CreditCard, MapPin, ShieldCheck, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { requireUser } from "@/lib/auth/server";
import { getSpaceAvailability, getSpaceById } from "@/lib/data-access/marketplace";
import { calculatePriceEstimate, formatMoney } from "@/lib/marketplace/pricing";
import { parseReservationParams } from "@/lib/marketplace/search";
import type { RawSearchParams } from "@/lib/types/marketplace";

export default async function CheckoutPreviewPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  Object.entries(raw).forEach(([key, value]) => (Array.isArray(value) ? value : [value]).filter(Boolean).forEach((item) => params.append(key, String(item))));
  await requireUser(`/checkout/preview?${params.toString()}`);
  const spaceId = Array.isArray(raw.space_id) ? raw.space_id[0] : raw.space_id;
  if (!spaceId) notFound();
  const space = await getSpaceById(spaceId);
  if (!space) notFound();
  const selection = parseReservationParams(raw, space.minimumHours);
  if (!selection.date) notFound();
  const availability = await getSpaceAvailability(space.id, selection);
  const estimate = calculatePriceEstimate(space, selection);
  if (!estimate) notFound();
  const backParams = new URLSearchParams({ date: selection.date, start: selection.start, duration: String(selection.duration), guests: String(selection.guests), mode: selection.mode });

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <Link href={`/spaces/${space.slug}?${backParams.toString()}`} className="inline-flex items-center gap-2 text-sm text-sinner-goldSoft"><ArrowLeft size={16} />Back to space</Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <p className="text-xs font-semibold uppercase text-sinner-goldSoft">Booking preparation</p><h1 className="mt-3 font-display text-5xl text-sinner-ivory">Review your selection</h1><p className="mt-4 max-w-xl leading-7 text-sinner-mist">This page prepares the reservation details for Phase 3. Nothing has been booked and no payment will be requested.</p>
            <div className="mt-9 grid gap-x-8 sm:grid-cols-2">
              {[{ icon: CalendarDays, label: "Date", value: selection.date }, { icon: Clock, label: "Start and duration", value: `${selection.start} | ${selection.duration} hours` }, { icon: Users, label: "Guests", value: String(selection.guests) }, { icon: MapPin, label: "Area", value: space.approximateLocation }].map((item) => { const Icon = item.icon; return <div key={item.label} className="flex gap-3 border-b hairline py-5"><Icon size={18} className="mt-0.5 shrink-0 text-sinner-goldSoft" /><div><p className="text-xs uppercase text-sinner-mist/60">{item.label}</p><p className="mt-1 text-sm text-sinner-ivory">{item.value}</p></div></div>; })}
            </div>
            <div className={`mt-8 flex items-start gap-3 rounded-xl border p-5 text-sm ${availability.available ? "border-emerald-400/25 bg-emerald-400/5 text-emerald-200" : "border-rose-400/25 bg-rose-400/5 text-rose-200"}`}>{availability.available ? <CheckCircle2 size={19} className="shrink-0" /> : <ShieldCheck size={19} className="shrink-0" />}<p>{availability.message}</p></div>
          </div>
          <aside className="premium-panel h-fit p-6"><p className="text-xs font-semibold uppercase text-sinner-goldSoft">{space.name}</p><div className="mt-5 space-y-3 text-sm text-sinner-mist"><div className="flex justify-between gap-4"><span>{selection.mode === "hourly" ? `${formatMoney(estimate.rate)} x ${selection.duration} hours` : `${selection.mode} rate`}</span><span>{formatMoney(estimate.baseAmount)} MXN</span></div><div className="flex justify-between gap-4"><span>Cleaning fee</span><span>{formatMoney(estimate.cleaningFee)} MXN</span></div><div className="flex justify-between gap-4"><span>Service fee</span><span>{formatMoney(estimate.serviceFee)} MXN</span></div><div className="flex justify-between gap-4 border-t hairline pt-4 font-semibold text-sinner-ivory"><span>Estimated total</span><span>{formatMoney(estimate.total)} MXN</span></div></div><button type="button" disabled className="mt-6 flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-sinner-gold/25 text-sm font-semibold text-sinner-mist/60"><CreditCard size={17} />Booking opens in Phase 3</button><p className="mt-4 text-center text-xs leading-5 text-sinner-mist/70">No reservation record or payment is created.</p></aside>
        </div>
      </section>
      <Footer />
    </main>
  );
}
