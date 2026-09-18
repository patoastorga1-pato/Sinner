import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Check, Clock, MapPin, ShieldCheck, Star, Users } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getExperienceBySlug } from "@/lib/data-access/marketplace";
import { formatMoney } from "@/lib/marketplace/pricing";

function formatDuration(minutes: number) {
  if (!minutes) return "Duration set by host";
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} ${hours === 1 ? "hour" : "hours"}` : `${minutes} min`;
}

export default async function ExperiencePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const experience = await getExperienceBySlug(slug);
  if (!experience) notFound();
  const location = [experience.city, experience.state].filter(Boolean).join(", ");

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 md:pb-20 lg:px-8">
        <Link href="/experiences" className="inline-flex items-center gap-2 text-sm text-sinner-goldSoft transition hover:text-sinner-gold">
          <ArrowLeft size={16} />
          Back to experiences
        </Link>

        <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <div className="relative min-h-[460px] overflow-hidden rounded-2xl border hairline">
              <Image src={experience.image} alt={`${experience.name} private experience`} fill preload sizes="(max-width: 1024px) 100vw, 760px" className="object-cover brightness-[1.06] contrast-[1.06]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 max-w-4xl p-6 sm:p-9">
                <p className="text-xs font-semibold uppercase text-sinner-goldSoft">SINNER experience</p>
                <h1 className="mt-3 font-display text-5xl text-white sm:text-7xl">{experience.name}</h1>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-sinner-ivory/80">
                  <span className="inline-flex items-center gap-1.5"><MapPin size={16} />{location || "Location set by host"}</span>
                  {experience.reviewCount > 0 && experience.ratingAverage ? <span className="inline-flex items-center gap-1.5"><Star size={16} className="fill-sinner-goldSoft text-sinner-goldSoft" />{experience.ratingAverage.toFixed(1)} · {experience.reviewCount} reviews</span> : null}
                  {experience.verifiedVenue ? <span className="inline-flex items-center gap-1.5"><ShieldCheck size={16} />Verified venue</span> : null}
                </div>
              </div>
            </div>

            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Clock, label: "Duration", value: formatDuration(experience.durationMinutes) },
                { icon: Users, label: "Capacity", value: `Up to ${experience.maxGuests} ${experience.maxGuests === 1 ? "guest" : "guests"}` },
                { icon: CalendarDays, label: "Availability", value: "Schedule backend pending" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-xl border hairline bg-white/[0.025] p-4">
                    <Icon size={18} className="text-sinner-goldSoft" />
                    <p className="mt-3 text-xs uppercase text-sinner-mist/60">{item.label}</p>
                    <p className="mt-1 text-sm font-medium text-sinner-ivory">{item.value}</p>
                  </div>
                );
              })}
            </section>

            <section className="mt-10 border-t hairline pt-8">
              <h2 className="font-display text-4xl text-sinner-ivory">About this experience</h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-sinner-mist">{experience.description}</p>
            </section>

            <section className="mt-10 grid gap-8 border-t hairline pt-8 lg:grid-cols-2">
              <div>
                <h2 className="font-display text-4xl text-sinner-ivory">What&apos;s included</h2>
                {experience.included.length ? (
                  <div className="mt-5 grid gap-3">
                    {experience.included.map((item) => (
                      <p key={item} className="flex gap-3 rounded-lg border hairline bg-black/20 p-4 text-sm text-sinner-mist">
                        <Check size={17} className="shrink-0 text-sinner-goldSoft" />
                        {item}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl border hairline bg-white/[0.02] p-5 text-sm leading-6 text-sinner-mist">
                    Inclusions are not connected in the current Experiences schema yet. They should come from an experience_inclusions table or equivalent real host data.
                  </p>
                )}
              </div>
              <div>
                <h2 className="font-display text-4xl text-sinner-ivory">Rules</h2>
                {experience.rules.length ? (
                  <div className="mt-5 grid gap-3">
                    {experience.rules.map((rule) => (
                      <p key={rule} className="rounded-lg border hairline bg-black/20 p-4 text-sm text-sinner-mist">{rule}</p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl border hairline bg-white/[0.02] p-5 text-sm leading-6 text-sinner-mist">
                    Rules are not configured for this experience yet. The host rules and approval model should be connected before public booking.
                  </p>
                )}
              </div>
            </section>

            <section className="mt-10 grid gap-6 border-t hairline pt-8 md:grid-cols-2">
              <div className="rounded-xl border hairline bg-white/[0.025] p-5">
                <p className="text-xs font-semibold uppercase text-sinner-goldSoft">Hosted at</p>
                <h2 className="mt-2 font-display text-3xl text-sinner-ivory">Space relation pending</h2>
                <p className="mt-3 text-sm leading-6 text-sinner-mist">The current experiences table does not include space_id. Add that relation to open the related Space from here.</p>
              </div>
              <div className="rounded-xl border hairline bg-white/[0.025] p-5">
                <p className="text-xs font-semibold uppercase text-sinner-goldSoft">Host</p>
                <h2 className="mt-2 font-display text-3xl text-sinner-ivory">SINNER host</h2>
                <p className="mt-3 text-sm leading-6 text-sinner-mist">Public host profile data can be shown here once host_id is assigned and joined to public_host_profiles.</p>
              </div>
            </section>

            <section className="mt-10 border-t hairline pt-8">
              <h2 className="font-display text-4xl text-sinner-ivory">Cancellation policy</h2>
              <p className="mt-4 text-sm leading-6 text-sinner-mist">{experience.cancellationPolicy ?? "Experience-specific cancellation policy is not configured yet."}</p>
            </section>
          </div>

          <aside className="premium-panel h-fit p-6 lg:sticky lg:top-24">
            <p className="text-sm text-sinner-mist">From</p>
            <p className="mt-1 font-display text-4xl font-medium gold-text">{experience.price === null ? "Request quote" : `${formatMoney(experience.price, experience.currency)}`}</p>
            <p className="mt-2 text-sm text-sinner-mist">{formatDuration(experience.durationMinutes)} · Up to {experience.maxGuests} guests</p>
            <form className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm text-sinner-ivory">
                <span>Select date</span>
                <input type="date" disabled className="h-12 cursor-not-allowed rounded-lg border hairline bg-black/35 px-4 text-sinner-mist outline-none [color-scheme:dark]" />
              </label>
              <label className="grid gap-2 text-sm text-sinner-ivory">
                <span>Select time</span>
                <select disabled className="h-12 cursor-not-allowed rounded-lg border hairline bg-black/35 px-4 text-sinner-mist outline-none">
                  <option>Availability not connected</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm text-sinner-ivory">
                <span>Guests</span>
                <select disabled className="h-12 cursor-not-allowed rounded-lg border hairline bg-black/35 px-4 text-sinner-mist outline-none">
                  {Array.from({ length: experience.maxGuests }, (_, index) => index + 1).map((count) => <option key={count}>{count}</option>)}
                </select>
              </label>
              <button type="button" disabled className="mt-2 min-h-12 cursor-not-allowed rounded-lg border border-sinner-gold/25 px-5 text-sm font-semibold text-sinner-mist/70">
                Reserve
              </button>
              <p className="text-xs leading-5 text-sinner-mist/70">Experience reservations need experience_id support in bookings, availability slots and payment status before this button can create a real booking.</p>
            </form>
          </aside>
        </div>
      </section>
      <Footer />
    </main>
  );
}
