import Link from "next/link";
import { ChevronDown } from "lucide-react";

function pageHref(queryString: string, page: number) {
  const params = new URLSearchParams(queryString);
  if (page <= 1) params.delete("page"); else params.set("page", String(page));
  const suffix = params.toString();
  return suffix ? `/spaces?${suffix}` : "/spaces";
}

export function Pagination({ page, totalPages, queryString }: { page: number; totalPages: number; queryString: string }) {
  if (totalPages <= 1) return null;
  const hasMore = page < totalPages;
  return (
    <nav aria-label="Search result pages" className="mt-10 grid place-items-center border-t hairline pt-7">
      {hasMore ? (
        <Link href={pageHref(queryString, page + 1)} className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-sinner-gold/25 px-5 text-sm font-semibold text-sinner-goldSoft transition hover:bg-sinner-gold/10 hover:text-sinner-gold">
          Show more
          <ChevronDown size={17} />
        </Link>
      ) : (
        <span className="rounded-full border hairline px-4 py-2 text-xs text-sinner-mist">All spaces loaded</span>
      )}
      <span className="mt-3 text-xs text-sinner-mist/70">Showing batch {page} of {totalPages}</span>
    </nav>
  );
}
