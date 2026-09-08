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

      <section className="relative min-h-[640px] overflow-hidden sm:min-h-[700px] lg:min-h-[740px]">
        <Image
          src="/images/hero-sinner-night.png"
          alt="Private luxury suite at night with violet ambient lighting"
          fill
          preload
          sizes="100vw"
          className="object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,6,9,0.97)_0%,rgba(7,6,9,0.82)_34%,rgba(7,6,9,0.5)_66%,rgba(7,6,9,0.28)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#070609_0%,rgba(7,6,9,0.12)_44%,rgba(7,6,9,0.48)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_34%,rgba(84,27,112,0.18),transparent_34rem)]" />
        <div className="relative mx-auto flex min-h-[640px] max-w-7xl items-center px-4 pb-32 pt-24 sm:min-h-[700px] sm:px-6 lg:min-h-[740px] lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase text-sinner-goldSoft">
              <span className="h-px w-8 bg-sinner-gold/70" />
              18+ Adults only
            </div>
            <h1 className="mt-8 font-display text-5xl font-medium leading-[0.98] text-sinner-ivory sm:text-7xl lg:text-[5.5rem]">
              Your desires.
              <br />
              Your space.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-sinner-ivory/78 sm:text-xl sm:leading-9">
              Discover private spaces, experiences and events created for adults who value privacy, quality and discretion.
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-20 mx-auto -mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <SearchBar />
        <div className="soft-scrollbar mt-7 flex gap-3.5 overflow-x-auto pb-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.label}
                href={category.href}
                className="flex min-w-fit items-center gap-2.5 rounded-full border border-white/[0.075] bg-sinner-coal/90 px-5 py-3 text-sm text-sinner-mist shadow-sm backdrop-blur transition duration-300 hover:border-sinner-gold/35 hover:bg-sinner-panel hover:text-sinner-goldSoft hover:shadow-[0_0_24px_rgba(214,170,88,0.1)] sm:text-[0.95rem]"
              >
                <Icon size={17} />
                {category.label}
              </Link>
            );
          })}
        </div>
      </div>

      <section className="mx-auto max-w-7xl bg-[radial-gradient(circle_at_12%_28%,rgba(84,27,112,0.1),transparent_28rem)] px-4 py-20 sm:px-6 md:py-24 lg:px-8 lg:py-28">
        <SectionTitle
          eyebrow="Curated spaces"
          title="Explore private spaces"
          copy="Premium rooms, villas and studios with clear rules, hourly booking and discreet access."
        />
        <div className="grid items-stretch gap-6 md:grid-cols-3 lg:gap-7">
          {spaces.map((space, index) => (
            <SpaceCard key={space.slug} space={space} initialFavorite={favorites.ids.includes(space.id)} authenticated={favorites.authenticated} priority={index === 0} />
          ))}
        </div>
      </section>

      <section id="experiences" className="border-y hairline bg-sinner-coal/55 bg-[radial-gradient(circle_at_86%_16%,rgba(84,27,112,0.12),transparent_32rem)] py-20 md:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Adult experiences"
            title="Experiences after dark"
            copy="Discreet formats for couples, creators and private guests, hosted in spaces with transparent permissions."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:auto-rows-[280px] lg:grid-cols-12 lg:gap-5">
            {experiences.map((experience, index) => (
              <Link
                key={experience.name}
                href={`/experiences/${experience.slug}`}
                className={`group relative min-h-[280px] overflow-hidden rounded-2xl border border-white/[0.06] ${experienceLayout[index]}`}
              >
                <Image src={experience.image} alt={experience.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover brightness-[1.08] contrast-[1.08] saturate-[1.04] transition duration-300 group-hover:scale-[1.012] group-hover:brightness-[1.12]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/38 to-black/10" />
                <div className="absolute inset-0 bg-sinner-plum/8 transition duration-300 group-hover:bg-sinner-plum/18" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-6 sm:p-8">
                  <div className="max-w-lg">
                    <p className="text-xs font-semibold uppercase text-sinner-goldSoft">SINNER experience</p>
                    <h3 className={`mt-2 font-display font-medium leading-tight text-white ${index === 0 ? "text-4xl sm:text-5xl" : "text-3xl"}`}>
                      {experience.name}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-sinner-ivory/78">{experience.description}</p>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition duration-300 group-hover:border-sinner-gold/45 group-hover:text-sinner-goldSoft">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="events" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-24 lg:px-8 lg:py-28">
        <SectionTitle
          eyebrow="Lifestyle events"
          title="Upcoming events"
          copy="Private social formats with adult verification, limited access and elevated venues."
        />
        <div className="grid items-stretch gap-6 md:grid-cols-3 lg:gap-7">
          {events.map((event) => (
            <Link key={event.name} href={`/events/${event.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-sinner-panel shadow-card transition duration-300 hover:border-sinner-gold/25 hover:bg-[#19131d] hover:shadow-[0_24px_62px_rgba(0,0,0,0.42),0_0_34px_rgba(214,170,88,0.07)]">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={event.image} alt={event.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-300 group-hover:scale-[1.012] group-hover:brightness-[1.04]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/76 via-black/8 to-black/24" />
                <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-medium text-sinner-ivory backdrop-blur-xl">
                  {event.badge}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase text-sinner-goldSoft">{event.type}</p>
                <h3 className="mt-2 font-display text-[2rem] font-medium leading-tight text-sinner-ivory">{event.name}</h3>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm leading-6 text-sinner-mist">
                  <span className="flex items-center gap-2"><CalendarDays size={15} className="text-sinner-gold" />{event.date}</span>
                  <span className="flex items-center gap-2"><MapPin size={15} className="text-sinner-gold" />{event.city}</span>
                </div>
                <div className="mt-auto flex items-center justify-between gap-4 border-t hairline pt-5 text-sm">
                  <span className="text-base font-semibold text-sinner-ivory">{event.price}</span>
                  <span className="text-sinner-goldSoft">{event.availability}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="host" className="relative overflow-hidden border-y hairline bg-sinner-coal/70 py-20 md:py-24 lg:py-28">
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
          <div className="grid gap-x-10 sm:grid-cols-2">
            {privacy.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-5 border-t hairline py-7">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-sinner-gold/20 bg-sinner-black/45 text-sinner-goldSoft shadow-[0_0_22px_rgba(214,170,88,0.08)]">
                    <Icon size={22} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-sinner-ivory">{item.title}</h3>
                    <p className="mt-2.5 text-sm leading-6 text-sinner-mist">{item.copy}</p>
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
