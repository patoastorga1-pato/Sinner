import Link from "next/link";
import { Map as MapIcon, SearchX, Sparkles, X } from "lucide-react";
import { FiltersPanel } from "@/components/space/FiltersPanel";
import { Pagination } from "@/components/space/Pagination";
import { SortSelect } from "@/components/space/SortSelect";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { SpaceCard } from "@/components/SpaceCard";
import {
  getFavoriteSpaceIds,
  getMarketplaceAllowedUseFilters,
  getMarketplaceAmenityFilters,
  searchSpaces,
  type MarketplaceAllowedUseFilter,
  type MarketplaceAmenityFilter,
} from "@/lib/data-access/marketplace";
import { formatMoney } from "@/lib/marketplace/pricing";
import { getLocalDateInputValue, hasActiveFilters, parseSpaceSearchParams, searchQueryToParams } from "@/lib/marketplace/search";
import { SPACE_TYPES, type RawSearchParams, type SpaceSearchQuery } from "@/lib/types/marketplace";

type ActiveFilterChip = {
  key: string;
  label: string;
  href: string;
};

function spacesHref(query: SpaceSearchQuery) {
  const params = searchQueryToParams(query);
  const queryString = params.toString();
  return queryString ? `/spaces?${queryString}` : "/spaces";
}

function removeFilterHref(query: SpaceSearchQuery, update: (next: SpaceSearchQuery) => void) {
  const next: SpaceSearchQuery = {
    ...query,
    amenities: [...query.amenities],
    allowedUses: [...query.allowedUses],
    page: 1,
  };
  update(next);
  return spacesHref(next);
}

function fallbackLabel(slug: string) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateChip(date: string) {
  if (date === getLocalDateInputValue()) return "Tonight";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildActiveFilterChips(
  query: SpaceSearchQuery,
  amenities: MarketplaceAmenityFilter[],
  allowedUses: MarketplaceAllowedUseFilter[],
): ActiveFilterChip[] {
  const amenityLabels = new Map(amenities.map((amenity) => [amenity.slug, amenity.label]));
  const allowedUseLabels = new Map(allowedUses.map((use) => [use.slug, use.label]));
  const typeLabel = SPACE_TYPES.find((type) => type.value === query.type)?.label;
  const chips: ActiveFilterChip[] = [];

  if (query.location) {
    chips.push({
      key: "location",
      label: query.location,
      href: removeFilterHref(query, (next) => { next.location = ""; }),
    });
  }
  if (query.date) {
    chips.push({
      key: "date",
      label: formatDateChip(query.date),
      href: removeFilterHref(query, (next) => { next.date = ""; }),
    });
  }
  if (query.start) {
    chips.push({
      key: "start",
      label: `Starts ${query.start}`,
      href: removeFilterHref(query, (next) => { next.start = ""; }),
    });
  }
  if (query.duration !== 4) {
    chips.push({
      key: "duration",
      label: `${query.duration} ${query.duration === 1 ? "hour" : "hours"}`,
      href: removeFilterHref(query, (next) => { next.duration = 4; }),
    });
  }
  if (query.guests !== 2) {
    chips.push({
      key: "guests",
      label: `${query.guests} ${query.guests === 1 ? "guest" : "guests"}`,
      href: removeFilterHref(query, (next) => { next.guests = 2; }),
    });
  }
  if (query.minPrice !== null) {
    chips.push({
      key: "minPrice",
      label: `From ${formatMoney(query.minPrice)}`,
      href: removeFilterHref(query, (next) => { next.minPrice = null; }),
    });
  }
  if (query.maxPrice !== null) {
    chips.push({
      key: "maxPrice",
      label: `Up to ${formatMoney(query.maxPrice)}`,
      href: removeFilterHref(query, (next) => { next.maxPrice = null; }),
    });
  }
  if (query.privacy !== null) {
    chips.push({
      key: "privacy",
      label: `Privacy ${query.privacy}+`,
      href: removeFilterHref(query, (next) => { next.privacy = null; }),
    });
  }
  if (typeLabel) {
    chips.push({
      key: "type",
      label: typeLabel,
      href: removeFilterHref(query, (next) => { next.type = ""; }),
    });
  }
  if (query.instantBooking) {
    chips.push({
      key: "instantBooking",
      label: "Instant booking",
      href: removeFilterHref(query, (next) => { next.instantBooking = false; }),
    });
  }
  if (query.creatorFriendly) {
    chips.push({
      key: "creatorFriendly",
      label: "Creator content",
      href: removeFilterHref(query, (next) => { next.creatorFriendly = false; }),
    });
  }
  if (query.groupFriendly) {
    chips.push({
      key: "groupFriendly",
      label: "Groups",
      href: removeFilterHref(query, (next) => { next.groupFriendly = false; }),
    });
  }
  if (query.eventsAllowed) {
    chips.push({
      key: "eventsAllowed",
      label: "Private events",
      href: removeFilterHref(query, (next) => { next.eventsAllowed = false; }),
    });
  }
  query.amenities.forEach((slug) => {
    chips.push({
      key: `amenity-${slug}`,
      label: amenityLabels.get(slug) ?? fallbackLabel(slug),
      href: removeFilterHref(query, (next) => { next.amenities = next.amenities.filter((item) => item !== slug); }),
    });
  });
  query.allowedUses.forEach((slug) => {
    chips.push({
      key: `allowed-use-${slug}`,
      label: allowedUseLabels.get(slug) ?? fallbackLabel(slug),
      href: removeFilterHref(query, (next) => { next.allowedUses = next.allowedUses.filter((item) => item !== slug); }),
    });
  });

  return chips;
}

export default async function SpacesPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const query = parseSpaceSearchParams(await searchParams);
  const [result, favorites, amenityFilters, allowedUseFilters] = await Promise.all([
    searchSpaces(query),
    getFavoriteSpaceIds(),
    getMarketplaceAmenityFilters(),
    getMarketplaceAllowedUseFilters(),
  ]);
  const queryString = searchQueryToParams(query).toString();
  const activeFilterChips = buildActiveFilterChips(query, amenityFilters, allowedUseFilters);
  const reservationParams = new URLSearchParams();
  if (query.date) reservationParams.set("date", query.date);
  if (query.start) reservationParams.set("start", query.start);
  reservationParams.set("duration", String(query.duration));
  reservationParams.set("guests", String(query.guests));
  const reservationQuery = reservationParams.toString();
  const verifiedSpacesCopy = `${result.total} verified ${result.total === 1 ? "space" : "spaces"} available`;

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase text-sinner-goldSoft">
            <span className="h-px w-8 bg-sinner-gold/70" />
            PRIVATE SPACES
          </div>
          <h1 className="mt-5 font-display text-5xl font-medium leading-[0.98] text-sinner-ivory sm:text-6xl lg:text-7xl">
            Find your private space
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-sinner-mist sm:text-lg sm:leading-8">
            Verified suites, studios, villas and private venues available by the hour or overnight.
          </p>
          <p className="mt-4 text-sm font-semibold text-sinner-goldSoft">{verifiedSpacesCopy}</p>
        </div>

        <SearchBar compact query={query} />

        {activeFilterChips.length ? (
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {activeFilterChips.map((chip) => (
              <Link
                key={chip.key}
                href={chip.href}
                className="inline-flex min-h-9 items-center gap-2 rounded-full border border-sinner-gold/20 bg-sinner-gold/[0.08] px-3.5 text-sm text-sinner-goldSoft transition duration-200 hover:border-sinner-gold/45 hover:bg-sinner-gold/[0.12]"
              >
                {chip.label}
                <X size={14} aria-hidden="true" />
              </Link>
            ))}
            <Link href="/spaces" className="inline-flex min-h-9 items-center rounded-full border hairline px-3.5 text-sm text-sinner-mist transition duration-200 hover:border-sinner-gold/30 hover:text-sinner-ivory">
              Clear all
            </Link>
          </div>
        ) : null}

        <div className="mt-7 grid grid-cols-3 gap-3 lg:hidden">
          <FiltersPanel query={query} amenities={amenityFilters} allowedUses={allowedUseFilters} mode="mobile" />
          <SortSelect value={query.sort} queryString={queryString} className="w-full justify-center" />
          <button
            type="button"
            disabled
            title="Map view will be connected when a map provider is added."
            className="flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-lg border hairline bg-sinner-coal px-3 text-sm text-sinner-mist/70"
          >
            <MapIcon size={17} />
            Map
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-b hairline pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-sinner-ivory">{result.total} {result.total === 1 ? "space" : "spaces"}</p>
            <p className="mt-1 text-xs text-sinner-mist">Approved listings only</p>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <div className="flex h-11 items-center rounded-lg border hairline bg-sinner-coal p-1 text-sm" aria-label="Catalog view">
              <span className="flex h-9 items-center rounded-md bg-sinner-gold px-3 font-semibold text-sinner-black">Listings</span>
              <button
                type="button"
                disabled
                title="Map view will be connected when a map provider is added."
                className="flex h-9 cursor-not-allowed items-center gap-2 px-3 text-sinner-mist/65"
              >
                <MapIcon size={15} />
                Map
              </button>
            </div>
            <SortSelect value={query.sort} queryString={queryString} />
          </div>
        </div>

        <div className="mt-7 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <FiltersPanel query={query} amenities={amenityFilters} allowedUses={allowedUseFilters} mode="desktop" />
          <div className="min-w-0">
            {result.spaces.length ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {result.spaces.map((space, index) => (
                    <SpaceCard
                      key={space.slug}
                      space={space}
                      initialFavorite={favorites.ids.includes(space.id)}
                      authenticated={favorites.authenticated}
                      detailQuery={reservationQuery}
                      priority={index === 0}
                    />
                  ))}
                </div>
                <Pagination page={result.page} totalPages={result.totalPages} queryString={queryString} />
              </>
            ) : (
              <div className="grid min-h-[460px] place-items-center rounded-2xl border hairline bg-white/[0.018] px-5 py-14 text-center">
                <div className="max-w-md">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-sinner-gold/25 text-sinner-goldSoft">
                    {hasActiveFilters(query) ? <SearchX size={21} /> : <Sparkles size={21} />}
                  </span>
                  <h2 className="mt-5 font-display text-4xl text-sinner-ivory">No spaces match all your filters.</h2>
                  <p className="mt-3 text-sm leading-6 text-sinner-mist">Try removing some filters or expanding your search.</p>
                  <Link href="/spaces" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-sinner-gold px-5 text-sm font-semibold text-black transition duration-200 hover:bg-sinner-goldSoft">
                    Clear filters
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
