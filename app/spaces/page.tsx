import { SlidersHorizontal, Map, List, ArrowUpDown } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { SectionTitle } from "@/components/SectionTitle";
import { SpaceCard } from "@/components/SpaceCard";
import { spaces } from "@/lib/data";

const filters = [
  "Price",
  "Date",
  "Duration",
  "Guests",
  "Privacy Score",
  "Jacuzzi",
  "Private entrance",
  "Self check-in",
  "Soundproofing",
  "Creator Friendly",
  "Group Friendly",
  "Themed",
  "Filming Allowed",
  "Commercial Content Allowed",
];

export default function SpacesPage() {
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <SectionTitle eyebrow="Browse" title="Spaces" copy="Find hourly private suites, studios and villas with adult verification and host-defined permissions." />
        <SearchBar compact />
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="soft-scrollbar flex gap-2 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <button key={filter} className="min-w-fit rounded-full border hairline bg-white/[0.03] px-4 py-2 text-sm text-sinner-mist transition hover:border-sinner-gold/35 hover:text-sinner-goldSoft">
                {filter}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-sinner-gold/35 px-4 py-2 text-sm text-sinner-goldSoft">
              <SlidersHorizontal size={16} />
              Filters
            </button>
            <button className="flex items-center gap-2 rounded-lg border hairline px-4 py-2 text-sm text-sinner-mist">
              <ArrowUpDown size={16} />
              Sort
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-lg border hairline text-sinner-goldSoft" aria-label="List view">
              <List size={17} />
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-lg border hairline text-sinner-mist" aria-label="Map view">
              <Map size={17} />
            </button>
          </div>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-6 sm:grid-cols-2">
            {spaces.map((space) => (
              <SpaceCard key={space.slug} space={space} />
            ))}
          </div>
          <aside className="premium-panel hidden min-h-[560px] p-5 lg:block">
            <div className="h-full rounded-xl border hairline bg-[radial-gradient(circle_at_60%_34%,rgba(84,27,112,0.3),transparent_11rem),linear-gradient(135deg,#17141b,#070609)] p-5">
              <p className="text-xs font-semibold uppercase text-sinner-gold">Map preview</p>
              <div className="relative mt-8 h-[420px]">
                {spaces.map((space, index) => (
                  <div
                    key={space.slug}
                    className="absolute rounded-full border border-sinner-gold/35 bg-black/80 px-3 py-2 text-xs text-white shadow-gold"
                    style={{ left: `${18 + index * 23}%`, top: `${22 + index * 18}%` }}
                  >
                    {space.price}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
      <Footer />
    </main>
  );
}
