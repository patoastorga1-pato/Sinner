import Link from "next/link";
import { Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { searchAdmin } from "@/lib/data-access/admin";

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim() ?? "";
  const results = await searchAdmin(query);
  return <AdminShell title="Global search" copy="Find users, hosts, bookings and marketplace content from one place.">
    <form className="flex max-w-2xl items-center gap-2 rounded-md border hairline bg-white/[0.025] px-4">
      <Search size={18} className="text-sinner-mist" /><input name="q" defaultValue={query} placeholder="Name, user ID, booking reference or listing" className="h-12 flex-1 bg-transparent text-sm text-white outline-none" />
      <button className="rounded-md bg-sinner-gold px-4 py-2 text-sm font-semibold text-black">Search</button>
    </form>
    <div className="mt-6 divide-y hairline rounded-md border hairline bg-white/[0.02]">
      {results.map((result) => <Link key={`${result.type}-${result.id}`} href={result.href} className="grid gap-1 px-4 py-4 transition hover:bg-white/[0.035] sm:grid-cols-[130px_1fr]">
        <span className="text-xs font-semibold uppercase text-sinner-goldSoft">{result.type}</span><span><strong className="block text-sm text-white">{result.label}</strong><span className="mt-1 block text-xs text-sinner-mist">{result.detail}</span></span>
      </Link>)}
      {query.length < 2 ? <p className="p-6 text-sm text-sinner-mist">Enter at least two characters to search.</p> : !results.length ? <p className="p-6 text-sm text-sinner-mist">No matching records found.</p> : null}
    </div>
    <p className="mt-4 text-xs text-sinner-mist/60">Email search is available for host applications. General account email search requires a protected Auth lookup and is not exposed here.</p>
  </AdminShell>;
}
