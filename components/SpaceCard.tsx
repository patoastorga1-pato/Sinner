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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-sinner-panel shadow-card transition duration-300 hover:border-sinner-gold/25 hover:bg-[#19131d] hover:shadow-[0_24px_62px_rgba(0,0,0,0.42),0_0_34px_rgba(214,170,88,0.07)]">
      <Link href={detailHref} className="flex h-full flex-col">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image src={space.coverPhoto} alt={`${space.name} cover`} fill preload={priority} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-300 group-hover:scale-[1.012] group-hover:brightness-[1.04]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/10 to-black/10" />
          <div className="absolute bottom-4 left-4"><PrivacyScore score={space.privacyScore} /></div>
          {space.instantBooking ? <span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-3 py-2 text-[0.7rem] font-semibold text-sinner-ivory backdrop-blur"><BadgeCheck size={14} className="text-sinner-goldSoft" />Instant</span> : null}
        </div>
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><h3 className="truncate font-display text-[1.85rem] font-medium leading-tight text-sinner-ivory">{space.name}</h3><p className="mt-2 truncate text-sm text-sinner-mist">{space.city}, {space.state}</p></div>
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-sinner-goldSoft"><Star size={15} fill={space.reviewCount ? "currentColor" : "none"} />{space.reviewCount ? space.ratingAverage.toFixed(1) : "New"}</span>
          </div>
          <p className="mt-5 text-sm text-sinner-mist">{startingPrice ? <>From <span className="text-base font-semibold text-sinner-ivory">{formatMoney(startingPrice.value)} MXN</span> <span className="text-xs text-sinner-mist/75">{startingPrice.unit}</span></> : <span className="text-base font-semibold text-sinner-ivory">Request quote</span>}</p>
          <p className="mt-1 text-xs text-sinner-mist/70">{space.reviewCount ? `${space.reviewCount} ${space.reviewCount === 1 ? "review" : "reviews"}` : "No reviews yet"}</p>
          <div className="mt-auto flex min-h-8 flex-wrap gap-2 pt-5">{badges.map((badge) => <span key={badge} className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs text-sinner-mist">{badge}</span>)}</div>
        </div>
      </Link>
      <FavoriteButton spaceId={space.id} spaceName={space.name} initialFavorite={initialFavorite} authenticated={authenticated} />
    </article>
  );
}
