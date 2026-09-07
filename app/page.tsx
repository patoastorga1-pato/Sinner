import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Camera,
  EyeOff,
  FileCheck2,
  Gem,
  MapPin,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { SectionTitle } from "@/components/SectionTitle";
import { SpaceCard } from "@/components/SpaceCard";
import { getEvents, getExperiences, getFavoriteSpaceIds, getFeaturedSpaces } from "@/lib/data-access/marketplace";

const categories = [
  { label: "Private Suites", href: "/spaces?type=private-suite", icon: BedDouble },
  { label: "Jacuzzi", href: "/spaces?amenities=jacuzzi", icon: Bath },
  { label: "Themed Rooms", href: "/spaces?type=playroom", icon: Sparkles },
  { label: "Creator Friendly", href: "/spaces?creatorFriendly=true", icon: Camera },
  { label: "Playrooms", href: "/spaces?type=playroom", icon: Gem },
  { label: "Villas", href: "/spaces?type=villa", icon: Building2 },
  { label: "Group Friendly", href: "/spaces?groupFriendly=true", icon: Users },
  { label: "Events", href: "/events", icon: PartyPopper },
];

const privacy = [
  { title: "Verified adults", copy: "Age and identity checks create a trusted adult community.", icon: BadgeCheck },
  { title: "Clear host rules", copy: "Permissions and boundaries are visible before every booking.", icon: FileCheck2 },
  { title: "Discreet bookings", copy: "Thoughtful communication and privacy-minded reservation flows.", icon: EyeOff },
  { title: "Verified spaces", copy: "Listings are reviewed for quality, accuracy and secure access.", icon: ShieldCheck },
];

const experienceLayout = [
  "md:col-span-2 lg:col-span-7 lg:row-span-2",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-6",
  "lg:col-span-6",
];

export default async function Home() {
  const [spaces, experiences, events, favorites] = await Promise.all([
    getFeaturedSpaces(3),
    getExperiences(),
    getEvents(),
    getFavoriteSpaceIds(),
  ]);

  return (
    <main className="overflow-x-clip">
      <Header />

      <section className="relative min-h-[620px] overflow-hidden sm:min-h-[680px] lg:min-h-[720px]">
        <Image
          src="/images/hero-sinner-night.png"
          alt="Private luxury suite at night with violet ambient lighting"
          fill
          preload
          sizes="100vw"
          className="object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,6,9,0.92)_0%,rgba(7,6,9,0.6)_52%,rgba(7,6,9,0.32)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#070609_0%,rgba(7,6,9,0.08)_44%,rgba(7,6,9,0.42)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_34%,rgba(84,27,112,0.18),transparent_34rem)]" />
        <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-center px-4 pb-24 pt-20 sm:min-h-[680px] sm:px-6 lg:min-h-[720px] lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase text-sinner-goldSoft">
              <span className="h-px w-8 bg-sinner-gold/70" />
              18+ Adults only
            </div>
            <h1 className="mt-7 font-display text-5xl font-medium leading-[0.98] text-sinner-ivory sm:text-7xl lg:text-[5.5rem]">
              Your desires.
              <br />
              Your space.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-sinner-ivory/72 sm:text-lg sm:leading-8">
              Discover private spaces, experiences and events created for adults who value privacy, quality and discretion.
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-20 mx-auto -mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <SearchBar />
        <div className="soft-scrollbar mt-6 flex gap-2.5 overflow-x-auto pb-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.label}
                href={category.href}
                className="flex min-w-fit items-center gap-2.5 rounded-full border border-white/[0.09] bg-sinner-coal/90 px-4 py-2.5 text-sm text-sinner-mist shadow-sm backdrop-blur transition duration-200 hover:border-sinner-gold/35 hover:bg-sinner-panel hover:text-sinner-goldSoft"
              >
                <Icon size={16} />
                {category.label}
              </Link>
            );
          })}
        </div>
      </div>

      <section className="mx-auto max-w-7xl bg-[radial-gradient(circle_at_12%_28%,rgba(84,27,112,0.1),transparent_28rem)] px-4 py-24 sm:px-6 md:py-28 lg:px-8 lg:py-32">
        <SectionTitle
          eyebrow="Curated spaces"
          title="Explore private spaces"
          copy="Premium rooms, villas and studios with clear rules, hourly booking and discreet access."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {spaces.map((space, index) => (
            <SpaceCard key={space.slug} space={space} initialFavorite={favorites.ids.includes(space.id)} authenticated={favorites.authenticated} priority={index === 0} />
          ))}
        </div>
      </section>

      <section id="experiences" className="border-y hairline bg-sinner-coal/55 bg-[radial-gradient(circle_at_86%_16%,rgba(84,27,112,0.12),transparent_32rem)] py-24 md:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Adult experiences"
            title="Experiences after dark"
            copy="Discreet formats for couples, creators and private guests, hosted in spaces with transparent permissions."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:auto-rows-[280px] lg:grid-cols-12">
            {experiences.map((experience, index) => (
              <Link
                key={experience.name}
                href={`/experiences/${experience.slug}`}
                className={`group relative min-h-[280px] overflow-hidden rounded-2xl ${experienceLayout[index]}`}
              >
                <Image src={experience.image} alt={experience.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition duration-300 group-hover:scale-[1.02]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5" />
                <div className="absolute inset-0 bg-sinner-plum/10 transition duration-300 group-hover:bg-sinner-plum/20" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-6 sm:p-7">
                  <div className="max-w-lg">
                    <p className="text-xs font-semibold uppercase text-sinner-goldSoft">SINNER experience</p>
                    <h3 className={`mt-2 font-display font-medium leading-tight text-white ${index === 0 ? "text-4xl sm:text-5xl" : "text-3xl"}`}>
                      {experience.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-sinner-ivory/70">{experience.description}</p>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur transition duration-200 group-hover:border-sinner-gold/45 group-hover:text-sinner-goldSoft">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="events" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-28 lg:px-8 lg:py-32">
        <SectionTitle
          eyebrow="Lifestyle events"
          title="Upcoming events"
          copy="Private social formats with adult verification, limited access and elevated venues."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {events.map((event) => (
            <Link key={event.name} href={`/events/${event.slug}`} className="group overflow-hidden rounded-2xl bg-sinner-panel shadow-card transition duration-300 hover:-translate-y-1">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={event.image} alt={event.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-300 group-hover:scale-[1.02]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-medium text-sinner-ivory backdrop-blur-xl">
                  {event.badge}
                </span>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase text-sinner-gold">{event.type}</p>
                <h3 className="mt-2 font-display text-3xl font-medium leading-tight text-sinner-ivory">{event.name}</h3>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-sinner-mist">
                  <span className="flex items-center gap-2"><CalendarDays size={15} className="text-sinner-gold" />{event.date}</span>
                  <span className="flex items-center gap-2"><MapPin size={15} className="text-sinner-gold" />{event.city}</span>
                </div>
                <div className="mt-5 flex items-center justify-between border-t hairline pt-4 text-sm">
                  <span className="font-semibold text-sinner-ivory">{event.price}</span>
                  <span className="text-sinner-goldSoft">{event.availability}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="host" className="relative overflow-hidden border-y hairline bg-sinner-coal/70 py-24 md:py-28 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_42%,rgba(84,27,112,0.23),transparent_34rem)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-8">
          <div>
            <SectionTitle
              eyebrow="Safety by design"
              title="Privacy comes first."
              copy="SINNER is exclusively for adults and keeps the commercial focus on verified spaces, host rules and authorized experiences."
            />
            <p className="max-w-md text-sm leading-6 text-sinner-mist/80">Trust should feel built in, not added at checkout.</p>
          </div>
          <div className="grid gap-x-8 sm:grid-cols-2">
            {privacy.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4 border-t hairline py-6">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-sinner-gold/20 bg-sinner-black/40 text-sinner-goldSoft">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-sinner-ivory">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-sinner-mist">{item.copy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
