"use client";

import { Heart, LoaderCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/providers/ToastProvider";

export function FavoriteButton({ spaceId, spaceName, initialFavorite, authenticated, placement = "card" }: { spaceId: string; spaceName: string; initialFavorite: boolean; authenticated: boolean; placement?: "card" | "inline" }) {
  const [saved, setSaved] = useState(initialFavorite);
  const [pending, setPending] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  async function toggleFavorite() {
    if (!authenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      showToast("Connect Supabase to save favorites.", "error");
      return;
    }

    setPending(true);
    const nextSaved = !saved;
    setSaved(nextSaved);

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setSaved(saved);
      setPending(false);
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    const result = nextSaved
      ? await supabase.from("favorites").insert({ user_id: data.user.id, space_id: spaceId })
      : await supabase.from("favorites").delete().eq("user_id", data.user.id).eq("space_id", spaceId);

    if (result.error) {
      setSaved(saved);
      showToast(result.error.message, "error");
    } else {
      showToast(nextSaved ? `${spaceName} saved.` : `${spaceName} removed from favorites.`);
    }

    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={pending}
      aria-label={saved ? `Remove ${spaceName} from favorites` : `Save ${spaceName}`}
      aria-pressed={saved}
      className={`${placement === "card" ? "absolute right-4 top-4" : "relative"} z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/65 text-white backdrop-blur-xl transition duration-200 hover:border-sinner-gold/40 hover:text-sinner-goldSoft disabled:cursor-wait`}
    >
      {pending ? <LoaderCircle size={17} className="animate-spin" /> : <Heart size={18} fill={saved ? "currentColor" : "none"} className={saved ? "text-sinner-goldSoft" : ""} />}
    </button>
  );
}
