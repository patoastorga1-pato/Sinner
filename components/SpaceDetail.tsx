import Image from "next/image";
import { BadgeCheck, Check, CircleOff, Clock3, MapPin, Star, UserRound, Users, X } from "lucide-react";
import { AmenityList } from "@/components/space/AmenityList";
import { BookingWidget } from "@/components/space/BookingWidget";
import { SpaceGallery } from "@/components/space/SpaceGallery";
import type { ReservationSelection, SpaceCardData, SpaceDetailData } from "@/lib/types/marketplace";
import { FavoriteButton } from "./FavoriteButton";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { PrivacyScore } from "./PrivacyScore";
import { SpaceCard } from "./SpaceCard";

export function SpaceDetail({
  space,
  related,
  initialFavorite,
  authenticated,
  initialSelection,
}: {
  space: SpaceDetailData;
  related: SpaceCardData[];
  initialFavorite: boolean;
  authenticated: boolean;
  initialSelection: ReservationSelection;
}) {
  const memberSince = space.host.memberSince
    ? new Date(space.host.memberSince).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : null;

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <SpaceGallery name={space.name} photos={space.photos} />

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
              <div className="min-w-0">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase text-sinner-goldSoft"><span>{space.spaceType}</span>{space.instantBooking ? <><span className="h-1 w-1 rounded-full bg-sinner-mist/50" /><span className="flex items-center gap-1"><BadgeCheck size={14} />Instant booking</span></> : null}</div>
                <div className="mt-3 flex items-start gap-3"><h1 className="min-w-0 font-display text-5xl font-medium leading-none text-sinner-ivory sm:text-6xl">{space.name}</h1><FavoriteButton spaceId={space.id} spaceName={space.name} initialFavorite={initialFavorite} authenticated={authenticated} placement="inline" /></div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-sinner-mist">
                  <span className="flex items-center gap-2"><MapPin size={16} />{space.approximateLocation}</span>
                  <span className="flex items-center gap-2 text-sinner-goldSoft"><Star size={16} fill={space.reviewCount ? "currentColor" : "none"} />{space.reviewCount ? `${space.ratingAverage.toFixed(1)} (${space.reviewCount} ${space.reviewCount === 1 ? "review" : "reviews"})` : "No reviews yet"}</span>
                  <span className="flex items-center gap-2"><Users size={16} />Up to {space.maxGuests}</span>
                </div>
              </div>
              <PrivacyScore score={space.privacyScore} large />
            </div>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-sinner-mist">{space.description}</p>

            <section className="mt-12 border-t hairline pt-10" aria-labelledby="host-heading">
              <div className="flex items-center gap-4">
                {space.host.avatarUrl ? <Image src={space.host.avatarUrl} alt="" width={56} height={56} className="h-14 w-14 rounded-full object-cover" /> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-sinner-gold/25 bg-sinner-coal text-sinner-goldSoft"><UserRound size={23} /></span>}
                <div><div className="flex flex-wrap items-center gap-2"><h2 id="host-heading" className="font-display text-2xl text-sinner-ivory">Hosted by {space.host.displayName}</h2>{space.host.verified ? <span className="flex items-center gap-1 rounded-full border border-sinner-gold/25 px-2 py-1 text-[0.65rem] font-semibold uppercase text-sinner-goldSoft"><BadgeCheck size={13} />Verified Host</span> : null}</div><p className="mt-1 text-sm text-sinner-mist">{memberSince ? `Member since ${memberSince}` : "SINNER marketplace host"}{space.host.rating ? ` | ${space.host.rating.toFixed(1)} host rating` : ""}</p></div>
              </div>
            </section>

            <section className="mt-12 border-t hairline pt-10"><h2 className="font-display text-4xl font-medium text-sinner-ivory">Amenities</h2><AmenityList amenities={space.amenities} /></section>

            <section className="mt-12 border-t hairline pt-10">
              <h2 className="font-display text-4xl font-medium text-sinner-ivory">Allowed at this space</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-sinner-mist">Permissions are configured by the host and must be reviewed before every reservation.</p>
              <div className="mt-5 grid gap-x-7 sm:grid-cols-2">{space.allowedUses.map((use) => <div key={use.slug} className="flex items-center justify-between gap-4 border-b hairline py-3 text-sm text-sinner-mist"><span><span className="block text-sinner-ivory">{use.name}</span>{use.details ? <span className="mt-1 block text-xs">{use.details}</span> : null}</span>{use.allowed ? <span className="flex items-center gap-1.5 text-xs text-emerald-300"><Check size={17} />Allowed</span> : <span className="flex items-center gap-1.5 text-xs text-sinner-mist/60"><X size={17} />Not allowed</span>}</div>)}</div>
            </section>

            <section className="mt-12 border-t hairline pt-10">
              <h2 className="font-display text-4xl font-medium text-sinner-ivory">House rules</h2>
              <div className="mt-5 grid gap-x-7 sm:grid-cols-2">{space.rules.map((rule) => <div key={rule.key} className="flex gap-3 border-b hairline py-4"><span className="mt-0.5 text-sinner-goldSoft">{rule.allowed === false ? <CircleOff size={18} /> : <Check size={18} />}</span><div><h3 className="text-sm font-medium text-sinner-ivory">{rule.label}</h3><p className="mt-1 text-sm leading-6 text-sinner-mist">{rule.detail}</p></div></div>)}</div>
              <div className="mt-7 grid gap-5 border-l-2 border-sinner-gold/25 pl-5 text-sm leading-6 text-sinner-mist"><p><strong className="text-sinner-ivory">Cancellation:</strong> {space.cancellationPolicy}</p><p><strong className="text-sinner-ivory">Check-in:</strong> {space.checkInNotes}</p></div>
            </section>

            <section className="mt-12 border-t hairline pt-10">
              <h2 className="font-display text-4xl font-medium text-sinner-ivory">Approximate location</h2>
              <div className="mt-5 flex min-h-40 items-center gap-5 rounded-xl border hairline bg-[linear-gradient(135deg,#17141b,#0b090d)] p-6"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-sinner-gold/25 text-sinner-goldSoft"><MapPin size={21} /></span><div><p className="font-medium text-sinner-ivory">{space.approximateLocation}</p><p className="mt-2 max-w-xl text-sm leading-6 text-sinner-mist">The exact address is protected and is never included in public listing responses. It will be shared only through an authorized confirmed-booking flow.</p></div></div>
            </section>

            <section className="mt-12 border-t hairline pt-10">
              <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-sinner-goldSoft">Guest feedback</p><h2 className="mt-2 font-display text-4xl font-medium text-sinner-ivory">Reviews</h2></div>{space.reviewCount ? <p className="flex items-center gap-2 text-sm text-sinner-goldSoft"><Star size={16} fill="currentColor" />{space.ratingAverage.toFixed(1)} overall</p> : null}</div>
              {space.reviews.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2">{space.reviews.map((review) => <article key={review.id} className="rounded-xl border hairline bg-white/[0.025] p-5"><div className="flex items-center justify-between gap-3"><p className="font-medium text-sinner-ivory">{review.authorName}</p><span className="flex items-center gap-1 text-sm text-sinner-goldSoft"><Star size={14} fill="currentColor" />{review.rating.toFixed(1)}</span></div>{review.comment ? <p className="mt-4 text-sm leading-6 text-sinner-mist">{review.comment}</p> : null}<p className="mt-4 text-xs text-sinner-mist/60">{new Date(review.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p></article>)}</div> : <p className="mt-5 text-sm text-sinner-mist">No reviews yet.</p>}
            </section>
          </div>

          <div><BookingWidget space={space} authenticated={authenticated} initialSelection={initialSelection} /><div className="mt-4 flex items-center gap-3 px-2 text-xs leading-5 text-sinner-mist"><Clock3 size={16} className="shrink-0 text-sinner-goldSoft" />Hourly availability includes the host&apos;s {space.bufferMinutes}-minute turnover buffer.</div></div>
        </div>

        {related.length ? <section className="mt-20 border-t hairline pt-14"><p className="text-xs font-semibold uppercase text-sinner-goldSoft">More spaces nearby</p><h2 className="mt-3 font-display text-4xl text-sinner-ivory">You may also like</h2><div className="mt-7 grid gap-6 md:grid-cols-3">{related.map((candidate) => <SpaceCard key={candidate.id} space={candidate} authenticated={authenticated} />)}</div></section> : null}
      </section>
      <Footer />
    </main>
  );
}
