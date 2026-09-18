import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock, MapPin, ShieldCheck, Star, Users } from "lucide-react";
import { ExperienceFavoriteButton } from "@/components/experience/ExperienceFavoriteButton";
import { formatMoney } from "@/lib/marketplace/pricing";
import type { PublicExperience } from "@/lib/data-access/marketplace";

function formatDuration(minutes: number) {
  if (!minutes) return "Duration set by host";
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} ${hours === 1 ? "hour" : "hours"}` : `${minutes} min`;
}

export function ExperienceCard({ experience, authenticated, priority = false }: { experience: PublicExperience; authenticated: boolean; priority?: boolean }) {
  return (
    <article className="group overflow-hidden rounded-xl border hairline bg-white/[0.025] transition duration-300 hover:border-sinner-gold/25 hover:bg-white/[0.04]">
      <div className="relative aspect-[4/3] overflow-hidden bg-sinner-coal">
        <Image
          src={experience.image}
          alt={`${experience.name} experience`}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover brightness-[1.05] contrast-[1.05] transition duration-300 group-hover:scale-[1.015] group-hover:brightness-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/10" />
        <ExperienceFavoriteButton experienceName={experience.name} authenticated={authenticated} />
        {experience.verifiedVenue ? (
          <span className="absolute left-4 top-4 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-emerald-300/25 bg-black/60 px-3 text-xs font-semibold text-emerald-100 backdrop-blur-xl">
            <ShieldCheck size={14} />
            Verified venue
          </span>
        ) : null}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs uppercase text-sinner-mist/70">
              <MapPin size={13} />
              {[experience.city, experience.state].filter(Boolean).join(", ")}
            </p>
            <h2 className="mt-2 font-display text-3xl leading-tight text-sinner-ivory">{experience.name}</h2>
          </div>
          <ArrowUpRight className="mt-1 shrink-0 text-sinner-goldSoft transition duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-sinner-mist">{experience.description}</p>
        <div className="mt-4 grid gap-2 text-sm text-sinner-mist">
          <span className="flex items-center gap-2"><Clock size={15} className="text-sinner-goldSoft" />{formatDuration(experience.durationMinutes)}</span>
          <span className="flex items-center gap-2"><Users size={15} className="text-sinner-goldSoft" />Up to {experience.maxGuests} {experience.maxGuests === 1 ? "guest" : "guests"}</span>
          {experience.reviewCount > 0 && experience.ratingAverage ? <span className="flex items-center gap-2"><Star size={15} className="fill-sinner-goldSoft text-sinner-goldSoft" />{experience.ratingAverage.toFixed(1)} · {experience.reviewCount} reviews</span> : null}
        </div>
        <div className="mt-5 flex items-center justify-between gap-4 border-t hairline pt-4">
          <p className="font-semibold text-sinner-ivory">{experience.price === null ? "Request quote" : `From ${formatMoney(experience.price, experience.currency)}`}</p>
          {experience.instantBooking ? <span className="rounded-full border border-sinner-gold/25 px-2.5 py-1 text-xs font-semibold text-sinner-goldSoft">Instant booking</span> : null}
        </div>
        <Link href={`/experiences/${experience.slug}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-sinner-gold px-4 text-sm font-semibold text-black transition duration-200 hover:bg-sinner-goldSoft focus:outline-none focus:ring-2 focus:ring-sinner-gold/35">
          View experience
        </Link>
      </div>
    </article>
  );
}
