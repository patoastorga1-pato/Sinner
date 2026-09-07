import { CalendarDays, Check, Clock, MapPin, Star, Users, X } from "lucide-react";
import type { Space } from "@/lib/data";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { PrivacyScore } from "./PrivacyScore";

export function SpaceDetail({ space }: { space: Space }) {
  const gallery = [space.image, ...space.gallery];

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid overflow-hidden rounded-2xl bg-sinner-coal md:grid-cols-4 md:gap-1">
          <div className="md:col-span-2 md:row-span-2">
            <img src={gallery[0]} alt={`${space.name} main room`} className="h-full min-h-[360px] w-full object-cover sm:min-h-[460px]" />
          </div>
          {gallery.slice(1).map((image, index) => (
            <img key={image} src={image} alt={`${space.name} gallery ${index + 2}`} className="hidden h-full w-full object-cover brightness-75 md:block" />
          ))}
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
              <div>
                <h1 className="font-display text-5xl font-medium leading-none text-sinner-ivory sm:text-6xl">{space.name}</h1>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-sinner-mist">
                  <span className="flex items-center gap-2">
                    <MapPin size={16} /> {space.zone}
                  </span>
                  <span className="flex items-center gap-2 text-sinner-goldSoft">
                    <Star size={16} fill="currentColor" /> {space.rating}
                  </span>
                </div>
              </div>
              <PrivacyScore score={space.privacyScore} large />
            </div>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-sinner-mist">{space.description}</p>

            <section className="mt-12">
              <h2 className="font-display text-4xl font-medium text-sinner-ivory">Amenities</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {space.amenities.map((amenity) => (
                  <div key={amenity} className="rounded-lg border hairline bg-white/[0.03] px-4 py-3 text-sinner-mist">
                    {amenity}
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <h2 className="font-display text-4xl font-medium text-sinner-ivory">Allowed at this space</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-sinner-mist">
                Permissions are determined by the host and must be reviewed before every reservation.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {space.allowedUses.map((use) => (
                  <div key={use.label} className="flex items-center justify-between rounded-lg border hairline bg-white/[0.03] px-4 py-3 text-sinner-mist">
                    <span>{use.label}</span>
                    {use.allowed ? <Check className="text-sinner-goldSoft" size={18} /> : <X className="text-sinner-mist/55" size={18} />}
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <h2 className="font-display text-4xl font-medium text-sinner-ivory">Rules</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {space.rules.map((rule) => (
                  <div key={rule} className="rounded-lg border hairline bg-white/[0.03] px-4 py-3 text-sinner-mist">
                    {rule}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="premium-panel h-fit p-5 lg:sticky lg:top-24">
            <p className="text-sm text-sinner-mist">From</p>
            <p className="mt-1 font-display text-4xl font-medium gold-text">{space.price}</p>
            <div className="mt-6 grid gap-3">
              {[
                { label: "Calendar", value: "Sep 14, 2026", icon: CalendarDays },
                { label: "Hours", value: "9 PM - 1 AM", icon: Clock },
                { label: "Guests", value: "2 guests", icon: Users },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} className="flex items-center gap-3 rounded-xl border hairline bg-black/35 px-4 py-4 text-left transition hover:border-sinner-gold/25">
                    <Icon size={18} className="text-sinner-gold" />
                    <span>
                      <span className="block text-xs font-semibold uppercase text-sinner-mist/60">{item.label}</span>
                      <span className="mt-1 block text-sm text-white">{item.value}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 border-t hairline pt-5 text-sm text-sinner-mist">
              <div className="flex justify-between">
                <span>4 hours</span>
                <span>{space.price}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span>Discreet booking fee</span>
                <span>Calculated later</span>
              </div>
            </div>
            <button className="mt-6 w-full rounded-xl bg-sinner-gold px-6 py-4 font-semibold text-black transition hover:bg-sinner-goldSoft">Reserve</button>
            <p className="mt-4 text-center text-xs leading-5 text-sinner-mist/75">No payment is processed in this frontend preview.</p>
          </aside>
        </div>
      </section>
      <Footer />
    </main>
  );
}
