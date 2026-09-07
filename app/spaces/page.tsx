import Link from "next/link";
import { SearchX, Sparkles } from "lucide-react";
import { FiltersPanel } from "@/components/space/FiltersPanel";
import { Pagination } from "@/components/space/Pagination";
import { SortSelect } from "@/components/space/SortSelect";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { SectionTitle } from "@/components/SectionTitle";
import { SpaceCard } from "@/components/SpaceCard";
import { getFavoriteSpaceIds, searchSpaces } from "@/lib/data-access/marketplace";
import { hasActiveFilters, parseSpaceSearchParams, searchQueryToParams } from "@/lib/marketplace/search";
import type { RawSearchParams } from "@/lib/types/marketplace";

export default async function SpacesPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const query = parseSpaceSearchParams(await searchParams);
  const [result, favorites] = await Promise.all([searchSpaces(query), getFavoriteSpaceIds()]);
  const queryString = searchQueryToParams(query).toString();
  const reservationParams = new URLSearchParams();
  if (query.date) reservationParams.set("date", query.date);
  if (query.start) reservationParams.set("start", query.start);
  reservationParams.set("duration", String(query.duration));
  reservationParams.set("guests", String(query.guests));
  const reservationQuery = reservationParams.toString();
  const clearFilterQuery = { ...query, minPrice: null, maxPrice: null, privacy: null, type: "" as const, amenities: [], allowedUses: [], creatorFriendly: false, groupFriendly: false, eventsAllowed: false, instantBooking: false, sort: "recommended" as const, page: 1 };
  const clearFilterParams = searchQueryToParams(clearFilterQuery).toString();
  const clearFilterHref = clearFilterParams ? `/spaces?${clearFilterParams}` : "/spaces";

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <SectionTitle eyebrow="Browse" title="Spaces" copy="Find hourly private suites, studios and villas with adult verification and host-defined permissions." />
        <SearchBar compact query={query} />

        <div className="mt-8 flex flex-col gap-4 border-b hairline pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-medium text-sinner-ivory">{result.total} {result.total === 1 ? "space" : "spaces"}</p><p className="mt-1 text-xs text-sinner-mist">Approved listings only</p></div>
          <SortSelect value={query.sort} queryString={queryString} />
        </div>

        <div className="mt-7 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <FiltersPanel query={query} />
          <div className="min-w-0">
            {result.spaces.length ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {result.spaces.map((space, index) => <SpaceCard key={space.slug} space={space} initialFavorite={favorites.ids.includes(space.id)} authenticated={favorites.authenticated} detailQuery={reservationQuery} priority={index === 0} />)}
                </div>
                <Pagination page={result.page} totalPages={result.totalPages} queryString={queryString} />
              </>
            ) : (
              <div className="grid min-h-[460px] place-items-center border-y hairline px-5 py-14 text-center">
                <div className="max-w-md">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-sinner-gold/25 text-sinner-goldSoft">{hasActiveFilters(query) ? <SearchX size={21} /> : <Sparkles size={21} />}</span>
                  <h2 className="mt-5 font-display text-4xl text-sinner-ivory">No spaces match your search.</h2>
                  <p className="mt-3 text-sm leading-6 text-sinner-mist">Try changing your dates, location or filters.</p>
                  <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link href={clearFilterHref} className="rounded-lg border border-sinner-gold/30 px-5 py-3 text-sm text-sinner-goldSoft">Clear filters</Link>
                    <Link href="/spaces" className="rounded-lg bg-sinner-gold px-5 py-3 text-sm font-semibold text-black">Explore all spaces</Link>
                  </div>
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
