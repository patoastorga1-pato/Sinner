import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock, Search, SearchX, SlidersHorizontal, Sparkles, Users } from "lucide-react";
import { ExperienceCard } from "@/components/experience/ExperienceCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import {
  experienceCategoryFilters,
  getFavoriteSpaceIds,
  searchExperiences,
  type ExperienceSearchQuery,
  type ExperienceSort,
} from "@/lib/data-access/marketplace";
import { formatMoney } from "@/lib/marketplace/pricing";
import type { RawSearchParams } from "@/lib/types/marketplace";

const sortOptions: Array<{ value: ExperienceSort; label: string }> = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Highest rated" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function positiveNumber(value: string | string[] | undefined, fallback: number | null = null) {
  const parsed = Number(firstParam(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseQuery(raw: RawSearchParams): ExperienceSearchQuery {
  const requestedSort = firstParam(raw.sort) as ExperienceSort;
  return {
    location: firstParam(raw.location).trim(),
    date: firstParam(raw.date),
    guests: Math.max(1, positiveNumber(raw.guests, 2) ?? 2),
    minPrice: positiveNumber(raw.minPrice),
    maxPrice: positiveNumber(raw.maxPrice),
    duration: positiveNumber(raw.duration),
    category: firstParam(raw.category),
    sort: sortOptions.some((option) => option.value === requestedSort) ? requestedSort : "recommended",
    page: Math.max(1, positiveNumber(raw.page, 1) ?? 1),
  };
}

function hrefFor(query: ExperienceSearchQuery, overrides: Partial<ExperienceSearchQuery> = {}) {
  const next = { ...query, ...overrides };
  const params = new URLSearchParams();
  if (next.location) params.set("location", next.location);
  if (next.date) params.set("date", next.date);
  if (next.guests !== 2) params.set("guests", String(next.guests));
  if (next.minPrice !== null) params.set("minPrice", String(next.minPrice));
  if (next.maxPrice !== null) params.set("maxPrice", String(next.maxPrice));
  if (next.duration !== null) params.set("duration", String(next.duration));
  if (next.category) params.set("category", next.category);
  if (next.sort !== "recommended") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  const value = params.toString();
  return value ? `/experiences?${value}` : "/experiences";
}

function HiddenQueryFields({ query, omit = [] }: { query: ExperienceSearchQuery; omit?: Array<keyof ExperienceSearchQuery> }) {
  const omitted = new Set(omit);
  return (
    <>
      {!omitted.has("location") && query.location ? <input type="hidden" name="location" value={query.location} /> : null}
      {!omitted.has("date") && query.date ? <input type="hidden" name="date" value={query.date} /> : null}
      {!omitted.has("guests") ? <input type="hidden" name="guests" value={query.guests} /> : null}
      {!omitted.has("minPrice") && query.minPrice !== null ? <input type="hidden" name="minPrice" value={query.minPrice} /> : null}
      {!omitted.has("maxPrice") && query.maxPrice !== null ? <input type="hidden" name="maxPrice" value={query.maxPrice} /> : null}
      {!omitted.has("duration") && query.duration !== null ? <input type="hidden" name="duration" value={query.duration} /> : null}
      {!omitted.has("category") && query.category ? <input type="hidden" name="category" value={query.category} /> : null}
      {!omitted.has("sort") && query.sort !== "recommended" ? <input type="hidden" name="sort" value={query.sort} /> : null}
    </>
  );
}

function formatDuration(minutes: number) {
  if (!minutes) return "Host-defined duration";
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} ${hours === 1 ? "hour" : "hours"}` : `${minutes} min`;
}

export default async function ExperiencesPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const query = parseQuery(await searchParams);
  const [result, favorites] = await Promise.all([searchExperiences(query), getFavoriteSpaceIds()]);
  const featured = result.experiences[0] ?? null;

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-12 md:pb-20 lg:px-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase text-sinner-goldSoft">
            <span className="h-px w-8 bg-sinner-gold/70" />
            ADULT EXPERIENCES
          </div>
          <h1 className="mt-5 font-display text-5xl font-medium leading-[0.98] text-sinner-ivory sm:text-6xl lg:text-7xl">
            Experiences after dark
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-sinner-mist sm:text-lg sm:leading-8">
            Curated private experiences with clear permissions, verified venues and discreet booking.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-sinner-mist/85">
            A Space is the place. An Experience is a private package, format or activity hosted inside a permitted space with its own duration, capacity and price.
          </p>
        </div>

        <form action="/experiences" className="mt-8 grid gap-3 rounded-2xl border hairline bg-sinner-coal/75 p-3 shadow-card backdrop-blur-xl md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_150px_auto] md:items-end">
          <label className="grid gap-2 text-sm text-sinner-ivory">
            <span className="font-semibold">Where</span>
            <input name="location" defaultValue={query.location} placeholder="Ciudad, municipio o estado" className="h-12 rounded-lg border hairline bg-black/35 px-4 text-white outline-none transition placeholder:text-sinner-mist/45 focus:border-sinner-gold/45 focus:ring-2 focus:ring-sinner-purple/25" />
          </label>
          <label className="grid gap-2 text-sm text-sinner-ivory">
            <span className="font-semibold">Date · coming soon</span>
            <input type="date" disabled aria-describedby="experience-date-note" className="h-12 cursor-not-allowed rounded-lg border hairline bg-black/35 px-4 text-sinner-mist/60 outline-none [color-scheme:dark]" />
            <span id="experience-date-note" className="sr-only">Date availability is not available yet.</span>
          </label>
          <label className="grid gap-2 text-sm text-sinner-ivory">
            <span className="font-semibold">Guests</span>
            <select name="guests" defaultValue={query.guests} className="h-12 rounded-lg border hairline bg-black/35 px-4 text-white outline-none transition focus:border-sinner-gold/45 focus:ring-2 focus:ring-sinner-purple/25">
              {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count}</option>)}
            </select>
          </label>
          <HiddenQueryFields query={query} omit={["location", "date", "guests", "page"]} />
          <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-sinner-gold px-5 text-sm font-semibold text-black transition duration-200 hover:bg-sinner-goldSoft focus:outline-none focus:ring-2 focus:ring-sinner-gold/35">
            <Search size={17} />
            Search
          </button>
        </form>

        <div className="soft-scrollbar mt-5 flex gap-2 overflow-x-auto pb-2">
          <Link href={hrefFor(query, { category: "", page: 1 })} className={`min-w-fit rounded-full border px-4 py-2 text-sm transition duration-200 ${query.category ? "hairline text-sinner-mist hover:border-sinner-gold/35 hover:text-sinner-ivory" : "border-sinner-gold/35 bg-sinner-gold/[0.1] text-sinner-goldSoft"}`}>
            View all
          </Link>
          {experienceCategoryFilters.map((category) => (
            <Link
              key={category.slug}
              href={hrefFor(query, { category: query.category === category.slug ? "" : category.slug, page: 1 })}
              className={`min-w-fit rounded-full border px-4 py-2 text-sm transition duration-200 ${query.category === category.slug ? "border-sinner-gold/35 bg-sinner-gold/[0.1] text-sinner-goldSoft" : "hairline text-sinner-mist hover:border-sinner-gold/35 hover:bg-sinner-gold/[0.06] hover:text-sinner-ivory"}`}
            >
              {category.label}
            </Link>
          ))}
        </div>

        {featured ? (
          <section className="mt-10">
            <p className="text-xs font-semibold uppercase text-sinner-goldSoft">Featured experience</p>
            <div className="mt-4 grid overflow-hidden rounded-2xl border hairline bg-white/[0.025] lg:grid-cols-[1.2fr_0.8fr]">
              <div className="relative min-h-[320px]">
                <Image src={featured.image} alt={`${featured.name} featured experience`} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover brightness-[1.06] contrast-[1.06]" />
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-8">
                <p className="text-sm text-sinner-mist">{[featured.city, featured.state].filter(Boolean).join(", ")}</p>
                <h2 className="mt-3 font-display text-4xl text-sinner-ivory sm:text-5xl">{featured.name}</h2>
                <p className="mt-4 leading-7 text-sinner-mist">{featured.description}</p>
                <div className="mt-6 grid gap-3 text-sm text-sinner-mist sm:grid-cols-2">
                  <span className="flex items-center gap-2"><Clock size={16} className="text-sinner-goldSoft" />{formatDuration(featured.durationMinutes)}</span>
                  <span className="flex items-center gap-2"><Users size={16} className="text-sinner-goldSoft" />Up to {featured.maxGuests} guests</span>
                  <span className="flex items-center gap-2"><CalendarDays size={16} className="text-sinner-goldSoft" />Scheduling opens soon</span>
                  <span className="font-semibold text-sinner-ivory">{featured.price === null ? "Request quote" : `From ${formatMoney(featured.price, featured.currency)}`}</span>
                </div>
                <Link href={`/experiences/${featured.slug}`} className="mt-7 inline-flex min-h-11 w-fit items-center justify-center rounded-lg bg-sinner-gold px-5 text-sm font-semibold text-black transition duration-200 hover:bg-sinner-goldSoft focus:outline-none focus:ring-2 focus:ring-sinner-gold/35">
                  View experience
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-12">
          <div className="flex flex-col gap-4 border-b hairline pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-sinner-goldSoft">Explore experiences</p>
              <h2 className="mt-2 font-display text-4xl text-sinner-ivory">{result.total} {result.total === 1 ? "experience" : "experiences"}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:flex md:items-center">
              <details className="relative">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-lg border hairline bg-sinner-coal px-4 text-sm text-sinner-mist transition hover:border-sinner-gold/35 hover:text-sinner-ivory">
                  <SlidersHorizontal size={16} />
                  Filters
                </summary>
                <form action="/experiences" className="mt-3 grid gap-4 rounded-xl border hairline bg-sinner-coal p-4 shadow-card md:absolute md:right-0 md:z-20 md:w-80">
                  <HiddenQueryFields query={query} omit={["minPrice", "maxPrice", "duration", "page"]} />
                  <label className="grid gap-2 text-sm text-sinner-ivory">
                    <span>Minimum price</span>
                    <input type="number" name="minPrice" min="0" step="50" defaultValue={query.minPrice ?? ""} className="h-11 rounded-lg border hairline bg-black/35 px-3 text-white outline-none focus:border-sinner-gold/45" />
                  </label>
                  <label className="grid gap-2 text-sm text-sinner-ivory">
                    <span>Maximum price</span>
                    <input type="number" name="maxPrice" min="0" step="50" defaultValue={query.maxPrice ?? ""} className="h-11 rounded-lg border hairline bg-black/35 px-3 text-white outline-none focus:border-sinner-gold/45" />
                  </label>
                  <label className="grid gap-2 text-sm text-sinner-ivory">
                    <span>Duration</span>
                    <select name="duration" defaultValue={query.duration ?? ""} className="h-11 rounded-lg border hairline bg-black/35 px-3 text-white outline-none focus:border-sinner-gold/45">
                      <option value="">Any duration</option>
                      <option value="120">Up to 2 hours</option>
                      <option value="180">Up to 3 hours</option>
                      <option value="240">Up to 4 hours</option>
                      <option value="360">Up to 6 hours</option>
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="submit" className="min-h-10 rounded-lg bg-sinner-gold px-4 text-sm font-semibold text-black transition hover:bg-sinner-goldSoft">Apply</button>
                    <Link href="/experiences" className="inline-flex min-h-10 items-center justify-center rounded-lg border hairline px-4 text-sm text-sinner-mist transition hover:text-white">Clear</Link>
                  </div>
                </form>
              </details>
              <form action="/experiences" className="flex items-center gap-2">
                <HiddenQueryFields query={query} omit={["sort", "page"]} />
                <label className="sr-only" htmlFor="experience-sort">Sort experiences</label>
                <select id="experience-sort" name="sort" defaultValue={query.sort} className="h-11 rounded-lg border hairline bg-sinner-coal px-3 text-sm text-sinner-ivory outline-none focus:border-sinner-gold/45">
                  {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <button type="submit" className="h-11 rounded-lg border border-sinner-gold/25 px-3 text-sm font-semibold text-sinner-goldSoft transition hover:bg-sinner-gold/10">Apply</button>
              </form>
            </div>
          </div>

          {result.experiences.length ? (
            <>
              <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {result.experiences.map((experience, index) => <ExperienceCard key={experience.id} experience={experience} authenticated={favorites.authenticated} priority={index === 0} />)}
              </div>
              {result.experiences.length < result.total ? (
                <div className="mt-8 text-center">
                  <Link href={hrefFor(query, { page: query.page + 1 })} className="inline-flex min-h-11 items-center rounded-lg border border-sinner-gold/25 px-5 text-sm font-semibold text-sinner-goldSoft transition hover:bg-sinner-gold/10">
                    Show more
                  </Link>
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-7 grid min-h-[360px] place-items-center rounded-2xl border hairline bg-white/[0.018] px-5 py-14 text-center">
              <div className="max-w-md">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-sinner-gold/25 text-sinner-goldSoft">
                  <SearchX size={21} />
                </span>
                <h2 className="mt-5 font-display text-4xl text-sinner-ivory">No experiences match your search.</h2>
                <p className="mt-3 text-sm leading-6 text-sinner-mist">Try changing the location, guest count or filters.</p>
                <Link href="/experiences" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-sinner-gold px-5 text-sm font-semibold text-black transition duration-200 hover:bg-sinner-goldSoft">
                  Clear filters
                </Link>
              </div>
            </div>
          )}
        </section>

        <section className="mt-14 rounded-2xl border hairline bg-sinner-coal/55 p-6 sm:p-8">
          <div className="flex items-center gap-3 text-sinner-goldSoft">
            <Sparkles size={18} />
            <p className="text-xs font-semibold uppercase">How experiences work</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {["Choose an experience", "Select your time", "Book privately"].map((step, index) => (
              <div key={step} className="rounded-xl border hairline bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase text-sinner-goldSoft">Step {index + 1}</p>
                <p className="mt-2 font-display text-2xl text-sinner-ivory">{step}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-sinner-mist">Verified venues · Clear permissions · Discreet booking</p>
        </section>
      </section>
      <Footer />
    </main>
  );
}
