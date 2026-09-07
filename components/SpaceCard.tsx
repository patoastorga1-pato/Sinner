import Link from "next/link";
import { Heart, Star } from "lucide-react";
import type { Space } from "@/lib/data";
import { PrivacyScore } from "./PrivacyScore";

export function SpaceCard({ space }: { space: Space }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl bg-sinner-panel shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.44)]">
      <Link href={`/spaces/${space.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img src={space.image} alt={space.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/5" />
          <div className="absolute bottom-4 left-4">
            <PrivacyScore score={space.privacyScore} />
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-[1.7rem] font-medium leading-tight text-sinner-ivory">{space.name}</h3>
              <p className="mt-1 text-sm text-sinner-mist">{space.zone}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-sinner-goldSoft">
              <Star size={15} fill="currentColor" />
              {space.rating}
            </span>
          </div>
          <p className="mt-4 text-sm text-sinner-mist">From <span className="font-semibold text-sinner-ivory">{space.price}</span></p>
          <div className="mt-4 flex min-h-7 flex-wrap gap-2">
            {space.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/[0.09] bg-white/[0.035] px-2.5 py-1 text-xs text-sinner-mist">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
      <button aria-label={`Save ${space.name}`} className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-xl transition duration-200 hover:border-sinner-gold/40 hover:text-sinner-goldSoft">
        <Heart size={18} />
      </button>
    </article>
  );
}
