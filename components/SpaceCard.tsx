import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { formatMoney, getStartingPrice } from "@/lib/marketplace/pricing";
import type { SpaceCardData } from "@/lib/types/marketplace";
import { FavoriteButton } from "./FavoriteButton";
import { PrivacyScore } from "./PrivacyScore";

export function SpaceCard({
  space,
  initialFavorite = false,
  authenticated = false,
  detailQuery = "",
  priority = false,
}: {
  space: SpaceCardData;
  initialFavorite?: boolean;
  authenticated?: boolean;
  detailQuery?: string;
  priority?: boolean;
}) {
  const startingPrice = getStartingPrice(space);
  const detailHref = `/spaces/${space.slug}${detailQuery ? `?${detailQuery}` : ""}`;
  const badges = [...space.amenities.slice(0, 2).map((amenity) => amenity.name), space.creatorFriendly ? "Creator Friendly" : null, space.groupFriendly ? "Group Friendly" : null]
    .filter((badge): badge is string => Boolean(badge)).slice(0, 3);

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-sinner-panel shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.44)]">
      <Link href={detailHref} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image src={space.coverPhoto} alt={`${space.name} cover`} fill preload={priority} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-300 group-hover:scale-[1.025]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/5" />
          <div className="absolute bottom-4 left-4"><PrivacyScore score={space.privacyScore} /></div>
          {space.instantBooking ? <span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-3 py-2 text-[0.7rem] font-semibold text-sinner-ivory backdrop-blur"><BadgeCheck size={14} className="text-sinner-goldSoft" />Instant</span> : null}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><h3 className="truncate font-display text-[1.7rem] font-medium leading-tight text-sinner-ivory">{space.name}</h3><p className="mt-1 truncate text-sm text-sinner-mist">{space.city}, {space.state}</p></div>
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-sinner-goldSoft"><Star size={15} fill={space.reviewCount ? "currentColor" : "none"} />{space.reviewCount ? space.ratingAverage.toFixed(1) : "New"}</span>
          </div>
          <p className="mt-4 text-sm text-sinner-mist">{startingPrice ? <>From <span className="font-semibold text-sinner-ivory">{formatMoney(startingPrice.value)} MXN</span> <span className="text-xs">{startingPrice.unit}</span></> : <span className="font-semibold text-sinner-ivory">Request quote</span>}</p>
          <p className="mt-1 text-xs text-sinner-mist/70">{space.reviewCount ? `${space.reviewCount} ${space.reviewCount === 1 ? "review" : "reviews"}` : "No reviews yet"}</p>
          <div className="mt-4 flex min-h-7 flex-wrap gap-2">{badges.map((badge) => <span key={badge} className="rounded-full border border-white/[0.09] bg-white/[0.035] px-2.5 py-1 text-xs text-sinner-mist">{badge}</span>)}</div>
        </div>
      </Link>
      <FavoriteButton spaceId={space.id} spaceName={space.name} initialFavorite={initialFavorite} authenticated={authenticated} />
    </article>
  );
}
