"use client";

import Link from "next/link";
import { Info, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { MarketplaceAllowedUseFilter, MarketplaceAmenityFilter } from "@/lib/data-access/marketplace";
import { SPACE_TYPES, type SpaceSearchQuery } from "@/lib/types/marketplace";

const primaryAmenitySlugs = [
  "private-parking",
  "air-conditioning",
  "kitchen",
  "wi-fi",
  "outdoor-area",
  "terrace",
  "private-entrance",
  "self-check-in",
  "soundproofing",
  "jacuzzi",
  "pool",
  "private-bathroom",
];

const creatorUseSlugs = new Set(["creator_content"]);
const groupUseSlugs = new Set(["groups"]);
const privateEventUseSlugs = new Set(["private_events", "events"]);

function hasUse(allowedUses: MarketplaceAllowedUseFilter[], slugs: Set<string>) {
  return allowedUses.some((use) => slugs.has(use.slug));
}

function CheckField({ name, value = "true", label, checked }: { name: string; value?: string; label: string; checked: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-sinner-mist transition hover:bg-white/[0.035] hover:text-sinner-ivory">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="h-4 w-4 accent-sinner-gold" />
      <span>{label}</span>
    </label>
  );
}

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-b hairline pb-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-2 text-xs font-semibold uppercase text-sinner-goldSoft">
        <span>{title}</span>
        <span className="text-base text-sinner-mist transition group-open:rotate-45">+</span>
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}

function FilterForm({
  query,
  amenities,
  allowedUses,
  onApply,
  idPrefix,
}: {
  query: SpaceSearchQuery;
  amenities: MarketplaceAmenityFilter[];
  allowedUses: MarketplaceAllowedUseFilter[];
  onApply?: () => void;
  idPrefix: string;
}) {
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const sortedAmenities = useMemo(() => {
    const preferred = amenities.filter((amenity) => primaryAmenitySlugs.includes(amenity.slug));
    const rest = amenities.filter((amenity) => !primaryAmenitySlugs.includes(amenity.slug));
    return [...preferred, ...rest];
  }, [amenities]);
  const visibleAmenities = showAllAmenities ? sortedAmenities : sortedAmenities.slice(0, 8);
  const hasCreatorUse = hasUse(allowedUses, creatorUseSlugs);
  const hasGroupUse = hasUse(allowedUses, groupUseSlugs);
  const hasPrivateEventUse = hasUse(allowedUses, privateEventUseSlugs);

  return (
    <form action="/spaces" method="get" onSubmit={onApply} className="space-y-5">
      {query.location ? <input type="hidden" name="location" value={query.location} /> : null}
      {query.date ? <input type="hidden" name="date" value={query.date} /> : null}
      {query.start ? <input type="hidden" name="start" value={query.start} /> : null}
      <input type="hidden" name="duration" value={query.duration} />
      <input type="hidden" name="guests" value={query.guests} />
      <input type="hidden" name="sort" value={query.sort} />

      <FilterSection title="Price">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-sinner-mist">
            <span className="mb-2 block">Minimum</span>
            <input id={`${idPrefix}-min-price`} type="number" name="minPrice" min="0" step="50" defaultValue={query.minPrice ?? ""} placeholder="$0" className="h-11 w-full rounded-lg border hairline bg-black/25 px-3 text-sm text-sinner-ivory outline-none focus:border-sinner-gold/45" />
          </label>
          <label className="text-xs text-sinner-mist">
            <span className="mb-2 block">Maximum</span>
            <input id={`${idPrefix}-max-price`} type="number" name="maxPrice" min="0" step="50" defaultValue={query.maxPrice ?? ""} placeholder="Any" className="h-11 w-full rounded-lg border hairline bg-black/25 px-3 text-sm text-sinner-ivory outline-none focus:border-sinner-gold/45" />
          </label>
        </div>
      </FilterSection>

      <FilterSection title="Space type">
        <select name="type" defaultValue={query.type} className="h-11 w-full rounded-lg border hairline bg-sinner-coal px-3 text-sm text-sinner-ivory outline-none focus:border-sinner-gold/45">
          <option value="">All types</option>
          {SPACE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
      </FilterSection>

      <FilterSection title="Booking">
        <CheckField name="instantBooking" label="Instant booking" checked={query.instantBooking} />
      </FilterSection>

      <FilterSection title="Privacy">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-sinner-goldSoft">
          <span>Privacy score</span>
          <span title="Privacy Score considers factors such as private access, soundproofing, host interaction and exterior visibility." className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-sinner-gold/25 text-sinner-mist">
            <Info size={12} />
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[8, 9, 9.5].map((score) => (
            <label key={score} className="cursor-pointer">
              <input type="radio" name="privacy" value={score} defaultChecked={query.privacy === score} className="peer sr-only" />
              <span className="flex h-10 items-center justify-center rounded-lg border hairline text-sm text-sinner-mist transition peer-checked:border-sinner-gold/50 peer-checked:bg-sinner-gold/10 peer-checked:text-sinner-goldSoft">{score}+</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Amenities" defaultOpen={false}>
        <div className="grid gap-1">
          {visibleAmenities.map((amenity) => <CheckField key={amenity.slug} name="amenities" value={amenity.slug} label={amenity.label} checked={query.amenities.includes(amenity.slug)} />)}
          {!amenities.length ? <p className="py-2 text-sm text-sinner-mist">No amenity filters are available yet.</p> : null}
        </div>
        {sortedAmenities.length > visibleAmenities.length ? (
          <button type="button" onClick={() => setShowAllAmenities(true)} className="mt-3 text-sm font-semibold text-sinner-goldSoft">Show all amenities</button>
        ) : null}
      </FilterSection>

      <FilterSection title="Allowed uses" defaultOpen={false}>
        <div className="grid gap-1">
          {!hasCreatorUse ? <CheckField name="creatorFriendly" label="Creator content" checked={query.creatorFriendly} /> : null}
          {!hasGroupUse ? <CheckField name="groupFriendly" label="Groups" checked={query.groupFriendly} /> : null}
          {!hasPrivateEventUse ? <CheckField name="eventsAllowed" label="Private events" checked={query.eventsAllowed} /> : null}
          {allowedUses.map((use) => <CheckField key={use.slug} name="allowedUses" value={use.slug} label={use.label} checked={query.allowedUses.includes(use.slug)} />)}
          {!allowedUses.length ? <p className="py-2 text-sm text-sinner-mist">Allowed-use filters appear here when configured in Supabase.</p> : null}
        </div>
      </FilterSection>

      <FilterSection title="Restrictions" defaultOpen={false}>
        <p className="text-sm leading-6 text-sinner-mist">No restriction filters available yet.</p>
      </FilterSection>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <Link href="/spaces" className="flex h-11 items-center justify-center rounded-lg border hairline text-sm text-sinner-mist transition hover:border-sinner-gold/35 hover:text-sinner-ivory">Clear all</Link>
        <button type="submit" className="h-11 rounded-lg bg-sinner-gold text-sm font-semibold text-sinner-black transition hover:bg-sinner-goldSoft">Apply filters</button>
      </div>
    </form>
  );
}

export function FiltersPanel({
  query,
  amenities,
  allowedUses,
  mode = "responsive",
}: {
  query: SpaceSearchQuery;
  amenities: MarketplaceAmenityFilter[];
  allowedUses: MarketplaceAllowedUseFilter[];
  mode?: "responsive" | "desktop" | "mobile";
}) {
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
      {mode !== "desktop" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex h-11 items-center justify-center gap-2 rounded-lg border border-sinner-gold/25 px-4 text-sm font-semibold text-sinner-goldSoft transition hover:bg-sinner-gold/10 ${mode === "responsive" ? "lg:hidden" : ""}`}
          aria-haspopup="dialog"
        >
          <SlidersHorizontal size={17} />Filters
        </button>
      ) : null}
      {mode !== "mobile" ? (
        <aside className={`${mode === "desktop" ? "block" : "hidden lg:block"} rounded-2xl border hairline bg-white/[0.018] p-5`} aria-label="Space filters">
          <FilterForm query={query} amenities={amenities} allowedUses={allowedUses} idPrefix="desktop" />
        </aside>
      ) : null}
      {open ? (
        <div className="fixed inset-0 z-[70] bg-black/78 backdrop-blur-sm lg:hidden" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="mobile-filters-title" className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl border-t hairline bg-sinner-black px-5 pb-8 pt-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="mobile-filters-title" className="font-display text-3xl text-sinner-ivory">Filters</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close filters" className="grid h-10 w-10 place-items-center rounded-lg border hairline text-sinner-mist"><X size={19} /></button>
            </div>
            <FilterForm query={query} amenities={amenities} allowedUses={allowedUses} idPrefix="mobile" onApply={() => setOpen(false)} />
          </section>
        </div>
      ) : null}
    </>
  );
}
