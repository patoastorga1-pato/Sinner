import { notFound } from "next/navigation";
import { SpaceDetail } from "@/components/SpaceDetail";
import { getFavoriteSpaceIds, getRelatedSpaces, getSpaceBySlug } from "@/lib/data-access/marketplace";
import { parseReservationParams } from "@/lib/marketplace/search";
import type { RawSearchParams } from "@/lib/types/marketplace";

export default async function MidnightLoftPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const [rawSearchParams, favorites] = await Promise.all([searchParams, getFavoriteSpaceIds()]);
  const space = await getSpaceBySlug("midnight-loft");
  if (!space) notFound();

  const related = await getRelatedSpaces(space);
  const initialSelection = parseReservationParams(rawSearchParams, space.minimumHours);

  return (
    <SpaceDetail
      space={space}
      related={related}
      initialFavorite={favorites.ids.includes(space.id)}
      authenticated={favorites.authenticated}
      initialSelection={initialSelection}
    />
  );
}
