import { Heart } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { SpaceCard } from "@/components/SpaceCard";
import { requireUser } from "@/lib/auth/server";
import { getFavoriteSpaces } from "@/lib/data-access/marketplace";

export default async function FavoritesPage() {
  await requireUser("/favorites");
  const spaces = await getFavoriteSpaces();

  return (
    <AccountShell title="Favorites" copy="Your saved private spaces, ready when the moment is right.">
      {spaces.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{spaces.map((space) => <SpaceCard key={space.id} space={space} initialFavorite authenticated />)}</div> : <EmptyState icon={Heart} title="No saved spaces yet." copy="Save spaces from the marketplace and they will appear here." actionLabel="Discover spaces" actionHref="/spaces" />}
    </AccountShell>
  );
}

