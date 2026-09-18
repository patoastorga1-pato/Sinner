"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";

export function ExperienceFavoriteButton({ experienceName, authenticated }: { experienceName: string; authenticated: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  function handleClick() {
    if (!authenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    showToast("Experience favorites need the favorites table to support experience_id before this can save.", "error");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Save ${experienceName}`}
      className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/65 text-white backdrop-blur-xl transition duration-200 hover:border-sinner-gold/45 hover:text-sinner-goldSoft focus:outline-none focus:ring-2 focus:ring-sinner-gold/35"
    >
      <Heart size={18} />
    </button>
  );
}
