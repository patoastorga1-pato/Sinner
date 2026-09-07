"use client";

import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SPACE_TYPES, type SpaceSearchQuery } from "@/lib/types/marketplace";

const amenityFilters = [
  { slug: "jacuzzi", label: "Jacuzzi" },
  { slug: "pool", label: "Pool" },
  { slug: "private-entrance", label: "Private entrance" },
  { slug: "self-check-in", label: "Self check-in" },
  { slug: "soundproofing", label: "Soundproofing" },
  { slug: "private-parking", label: "Parking" },
];

const allowedUseFilters = [
  { name: "photography", slug: "photography", label: "Photography" },
  { name: "video", slug: "video_recording", label: "Video recording" },
  { name: "commercialContent", slug: "commercial_content", label: "Commercial content" },
  { name: "groups", slug: "groups", label: "Groups" },
  { name: "events", slug: "events", label: "Events" },
];

function CheckField({ name, value = "true", label, checked }: { name: string; value?: string; label: string; checked: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-2 text-sm text-sinner-mist transition hover:text-sinner-ivory">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="h-4 w-4 accent-sinner-gold" />
      <span>{label}</span>
    </label>
  );
}

function FilterForm({ query, onApply, idPrefix }: { query: SpaceSearchQuery; onApply?: () => void; idPrefix: string }) {
  return (
    <form action="/spaces" method="get" onSubmit={onApply} className="space-y-7">
      {query.location ? <input type="hidden" name="location" value={query.location} /> : null}
      {query.date ? <input type="hidden" name="date" value={query.date} /> : null}
      {query.start ? <input type="hidden" name="start" value={query.start} /> : null}
      <input type="hidden" name="duration" value={query.duration} />
      <input type="hidden" name="guests" value={query.guests} />
      <input type="hidden" name="sort" value={query.sort} />

      <fieldset>
        <legend className="text-xs font-semibold uppercase text-sinner-goldSoft">Price per booking unit</legend>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-xs text-sinner-mist"><span className="mb-2 block">Minimum</span><input id={`${idPrefix}-min-price`} type="number" name="minPrice" min="0" step="50" defaultValue={query.minPrice ?? ""} placeholder="$0" className="h-11 w-full rounded-lg border hairline bg-black/25 px-3 text-sm text-sinner-ivory outline-none focus:border-sinner-gold/45" /></label>
          <label className="text-xs text-sinner-mist"><span className="mb-2 block">Maximum</span><input id={`${idPrefix}-max-price`} type="number" name="maxPrice" min="0" step="50" defaultValue={query.maxPrice ?? ""} placeholder="Any" className="h-11 w-full rounded-lg border hairline bg-black/25 px-3 text-sm text-sinner-ivory outline-none focus:border-sinner-gold/45" /></label>
        </div>
      </fieldset>

      <label className="block"><span className="text-xs font-semibold uppercase text-sinner-goldSoft">Space type</span><select name="type" defaultValue={query.type} className="mt-3 h-11 w-full rounded-lg border hairline bg-sinner-coal px-3 text-sm text-sinner-ivory outline-none focus:border-sinner-gold/45"><option value="">All types</option>{SPACE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>

      <fieldset>
        <legend className="text-xs font-semibold uppercase text-sinner-goldSoft">Privacy Score</legend>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[8, 9, 9.5].map((score) => <label key={score} className="cursor-pointer"><input type="radio" name="privacy" value={score} defaultChecked={query.privacy === score} className="peer sr-only" /><span className="flex h-10 items-center justify-center rounded-lg border hairline text-sm text-sinner-mist transition peer-checked:border-sinner-gold/50 peer-checked:bg-sinner-gold/10 peer-checked:text-sinner-goldSoft">{score}+</span></label>)}
        </div>
      </fieldset>

      <fieldset><legend className="text-xs font-semibold uppercase text-sinner-goldSoft">Booking</legend><div className="mt-2"><CheckField name="instantBooking" label="Instant booking" checked={query.instantBooking} /></div></fieldset>
      <fieldset><legend className="text-xs font-semibold uppercase text-sinner-goldSoft">Features</legend><div className="mt-2">{amenityFilters.map((amenity) => <CheckField key={amenity.slug} name="amenities" value={amenity.slug} label={amenity.label} checked={query.amenities.includes(amenity.slug)} />)}</div></fieldset>
      <fieldset><legend className="text-xs font-semibold uppercase text-sinner-goldSoft">Use cases</legend><div className="mt-2"><CheckField name="creatorFriendly" label="Creator Friendly" checked={query.creatorFriendly} /><CheckField name="groupFriendly" label="Group Friendly" checked={query.groupFriendly} /><CheckField name="eventsAllowed" label="Events Allowed" checked={query.eventsAllowed} /></div></fieldset>
      <fieldset><legend className="text-xs font-semibold uppercase text-sinner-goldSoft">Allowed uses</legend><div className="mt-2">{allowedUseFilters.map((use) => <CheckField key={use.slug} name={use.name} label={use.label} checked={query.allowedUses.includes(use.slug)} />)}</div></fieldset>

      <div className="grid grid-cols-2 gap-3 border-t hairline pt-5">
        <Link href="/spaces" className="flex h-11 items-center justify-center rounded-lg border hairline text-sm text-sinner-mist transition hover:border-sinner-gold/35 hover:text-sinner-ivory">Clear all</Link>
        <button type="submit" className="h-11 rounded-lg bg-sinner-gold text-sm font-semibold text-sinner-black transition hover:bg-sinner-goldSoft">Apply filters</button>
      </div>
    </form>
  );
}

export function FiltersPanel({ query }: { query: SpaceSearchQuery }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-sinner-gold/25 text-sm text-sinner-goldSoft lg:hidden" aria-haspopup="dialog"><SlidersHorizontal size={17} />Filters</button>
      <aside className="hidden border-r hairline pr-6 lg:block" aria-label="Space filters"><FilterForm query={query} idPrefix="desktop" /></aside>
      {open ? (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm lg:hidden" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="mobile-filters-title" className="ml-auto h-full w-[min(92vw,400px)] overflow-y-auto border-l hairline bg-sinner-black px-5 pb-8 pt-5 shadow-2xl">
            <div className="mb-7 flex items-center justify-between"><h2 id="mobile-filters-title" className="font-display text-3xl text-sinner-ivory">Filters</h2><button type="button" onClick={() => setOpen(false)} aria-label="Close filters" className="grid h-10 w-10 place-items-center rounded-lg border hairline text-sinner-mist"><X size={19} /></button></div>
            <FilterForm query={query} idPrefix="mobile" onApply={() => setOpen(false)} />
          </section>
        </div>
      ) : null}
    </>
  );
}
