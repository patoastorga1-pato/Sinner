"use client";

import { CalendarDays, CheckCircle2, Clock, LoaderCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { calculatePriceEstimate, formatMoney, getStartingPrice } from "@/lib/marketplace/pricing";
import { getLocalDateInputValue } from "@/lib/marketplace/search";
import type { AvailabilityResult, BookingMode, ReservationSelection, SpaceDetailData } from "@/lib/types/marketplace";

const startTimes = Array.from({ length: 32 }, (_, index) => {
  const totalMinutes = (8 * 60 + index * 30) % (24 * 60);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
});

export function BookingWidget({ space, authenticated, initialSelection }: { space: SpaceDetailData; authenticated: boolean; initialSelection: ReservationSelection }) {
  const router = useRouter();
  const [mode, setMode] = useState<BookingMode>(initialSelection.mode);
  const [date, setDate] = useState(initialSelection.date);
  const [start, setStart] = useState(initialSelection.start);
  const [duration, setDuration] = useState(Math.max(space.minimumHours, initialSelection.duration));
  const [guests, setGuests] = useState(Math.min(space.maxGuests, initialSelection.guests));
  const [pending, setPending] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const selection = useMemo<ReservationSelection>(() => ({ date, start, duration: mode === "overnight" ? 12 : mode === "full-day" ? 24 : duration, guests, mode }), [date, start, duration, guests, mode]);
  const estimate = calculatePriceEstimate(space, selection);
  const startingPrice = getStartingPrice(space);

  async function continueBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setAvailability(null);
    try {
      const response = await fetch(`/api/spaces/${space.id}/availability`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(selection) });
      const result = await response.json() as AvailabilityResult;
      setAvailability(result);
      if (!response.ok || !result.available) return;
      const params = new URLSearchParams({ space_id: space.id, date: selection.date, start: selection.start, duration: String(selection.duration), guests: String(selection.guests), mode: selection.mode });
      if (!authenticated) {
        const returnPath = `/spaces/${space.slug}?${params.toString()}`;
        router.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
        return;
      }
      router.push(`/checkout/preview?${params.toString()}`);
    } catch {
      setAvailability({ available: false, reason: "invalid", message: "Availability could not be checked. Please try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="premium-panel h-fit p-5 sm:p-6 lg:sticky lg:top-24">
      <p className="text-sm text-sinner-mist">{startingPrice ? "From" : "Pricing"}</p>
      <p className="mt-1 font-display text-4xl font-medium gold-text">{startingPrice ? `${formatMoney(startingPrice.value)} MXN` : "Request quote"}</p>
      {startingPrice ? <p className="mt-1 text-xs text-sinner-mist">{startingPrice.unit}</p> : null}

      <form onSubmit={continueBooking} className="mt-6">
        <fieldset><legend className="sr-only">Booking mode</legend><div className="grid grid-cols-3 gap-1 rounded-lg border hairline bg-black/25 p-1">{([
          ["hourly", "Hourly", space.hourlyPrice], ["overnight", "Overnight", space.overnightPrice], ["full-day", "Full day", space.fullDayPrice],
        ] as const).map(([value, label, price]) => <button key={value} type="button" disabled={price === null} aria-pressed={mode === value} onClick={() => { setMode(value); setAvailability(null); }} className={`min-h-10 rounded-md px-2 text-xs transition ${mode === value ? "bg-sinner-gold text-black" : "text-sinner-mist hover:text-white"} disabled:cursor-not-allowed disabled:opacity-35`}>{label}</button>)}</div></fieldset>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <label className="flex items-center gap-3 rounded-xl border hairline bg-black/30 px-4 py-3"><CalendarDays size={18} className="text-sinner-gold" /><span className="min-w-0 flex-1"><span className="block text-[0.65rem] font-semibold uppercase text-sinner-mist/60">Date</span><input required type="date" min={getLocalDateInputValue()} value={date} onChange={(event) => { setDate(event.target.value); setAvailability(null); }} className="mt-1 w-full bg-transparent text-sm text-white outline-none [color-scheme:dark]" /></span></label>
          <label className="flex items-center gap-3 rounded-xl border hairline bg-black/30 px-4 py-3"><Clock size={18} className="text-sinner-gold" /><span className="min-w-0 flex-1"><span className="block text-[0.65rem] font-semibold uppercase text-sinner-mist/60">Start time</span><select required value={start} onChange={(event) => { setStart(event.target.value); setAvailability(null); }} className="mt-1 w-full bg-transparent text-sm text-white outline-none">{startTimes.map((time) => <option key={time} value={time} className="bg-sinner-coal">{time}</option>)}</select></span></label>
          {mode === "hourly" ? <label className="flex items-center gap-3 rounded-xl border hairline bg-black/30 px-4 py-3"><Clock size={18} className="text-sinner-gold" /><span className="min-w-0 flex-1"><span className="block text-[0.65rem] font-semibold uppercase text-sinner-mist/60">Duration</span><select value={duration} onChange={(event) => { setDuration(Number(event.target.value)); setAvailability(null); }} className="mt-1 w-full bg-transparent text-sm text-white outline-none">{Array.from({ length: 13 - space.minimumHours }, (_, index) => index + space.minimumHours).map((hours) => <option key={hours} value={hours} className="bg-sinner-coal">{hours} {hours === 1 ? "hour" : "hours"}</option>)}</select></span></label> : <div className="flex items-center gap-3 rounded-xl border hairline bg-black/30 px-4 py-3 text-sm text-sinner-mist"><Clock size={18} className="text-sinner-gold" />{mode === "overnight" ? "12-hour overnight estimate" : "24-hour full-day estimate"}</div>}
          <label className="flex items-center gap-3 rounded-xl border hairline bg-black/30 px-4 py-3"><Users size={18} className="text-sinner-gold" /><span className="min-w-0 flex-1"><span className="block text-[0.65rem] font-semibold uppercase text-sinner-mist/60">Guests</span><select value={guests} onChange={(event) => { setGuests(Number(event.target.value)); setAvailability(null); }} className="mt-1 w-full bg-transparent text-sm text-white outline-none">{Array.from({ length: space.maxGuests }, (_, index) => index + 1).map((count) => <option key={count} value={count} className="bg-sinner-coal">{count} {count === 1 ? "guest" : "guests"}</option>)}</select></span></label>
        </div>

        {estimate ? <div className="mt-5 border-t hairline pt-5 text-sm text-sinner-mist"><div className="flex justify-between gap-4"><span>{mode === "hourly" ? `${formatMoney(estimate.rate)} x ${selection.duration} hours` : mode === "overnight" ? "Overnight rate" : "Full-day rate"}</span><span>{formatMoney(estimate.baseAmount)} MXN</span></div><div className="mt-2 flex justify-between gap-4"><span>Cleaning fee</span><span>{formatMoney(estimate.cleaningFee)} MXN</span></div><div className="mt-2 flex justify-between gap-4"><span>SINNER service fee ({estimate.serviceFeePercent}%)</span><span>{formatMoney(estimate.serviceFee)} MXN</span></div><div className="mt-4 flex justify-between border-t hairline pt-4 font-semibold text-sinner-ivory"><span>Estimated total</span><span>{formatMoney(estimate.total)} MXN</span></div></div> : <p className="mt-5 text-sm text-sinner-mist">This booking mode does not have a published rate.</p>}

        {availability ? <p aria-live="polite" className={`mt-4 flex items-start gap-2 text-sm ${availability.available ? "text-emerald-300" : "text-rose-300"}`}>{availability.available ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> : null}{availability.message}</p> : null}
        <button type="submit" disabled={pending || !estimate} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-sinner-gold px-6 py-3 font-semibold text-sinner-black transition hover:bg-sinner-goldSoft disabled:cursor-not-allowed disabled:opacity-55">{pending ? <LoaderCircle size={18} className="animate-spin" /> : null}{pending ? "Checking..." : "Continue"}</button>
        <p className="mt-4 text-center text-xs leading-5 text-sinner-mist/75">Estimate only. No reservation or payment is created in this phase.</p>
      </form>
    </aside>
  );
}
