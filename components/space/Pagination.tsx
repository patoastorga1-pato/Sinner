import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

function pageHref(queryString: string, page: number) {
  const params = new URLSearchParams(queryString);
  if (page <= 1) params.delete("page"); else params.set("page", String(page));
  const suffix = params.toString();
  return suffix ? `/spaces?${suffix}` : "/spaces";
}

export function Pagination({ page, totalPages, queryString }: { page: number; totalPages: number; queryString: string }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Search result pages" className="mt-10 flex items-center justify-between border-t hairline pt-6">
      <Link aria-disabled={page === 1} tabIndex={page === 1 ? -1 : undefined} href={pageHref(queryString, Math.max(1, page - 1))} className={`flex items-center gap-2 text-sm ${page === 1 ? "pointer-events-none text-sinner-mist/35" : "text-sinner-goldSoft"}`}><ChevronLeft size={17} />Previous</Link>
      <span className="text-sm text-sinner-mist">Page {page} of {totalPages}</span>
      <Link aria-disabled={page === totalPages} tabIndex={page === totalPages ? -1 : undefined} href={pageHref(queryString, Math.min(totalPages, page + 1))} className={`flex items-center gap-2 text-sm ${page === totalPages ? "pointer-events-none text-sinner-mist/35" : "text-sinner-goldSoft"}`}>Next<ChevronRight size={17} /></Link>
    </nav>
  );
}
