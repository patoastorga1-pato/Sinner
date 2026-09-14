"use client";

import { ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { SORT_OPTIONS, type SortOption } from "@/lib/types/marketplace";

export function SortSelect({ value, queryString, className = "" }: { value: SortOption; queryString: string; className?: string }) {
  const router = useRouter();
  return (
    <label className={`flex h-11 items-center gap-2 rounded-lg border hairline bg-sinner-coal px-3 text-sm text-sinner-mist ${className}`}>
      <ArrowUpDown size={16} className="text-sinner-goldSoft" /><span className="sr-only">Sort spaces</span>
      <select value={value} onChange={(event) => { const params = new URLSearchParams(queryString); params.set("sort", event.target.value); params.delete("page"); router.push(`/spaces?${params.toString()}`); }} className="min-w-0 bg-transparent text-sinner-ivory outline-none">
        {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value} className="bg-sinner-coal">{option.label}</option>)}
      </select>
    </label>
  );
}
