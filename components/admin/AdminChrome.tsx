"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell, BookOpenCheck, ChevronDown, CircleDollarSign, ClipboardCheck, FileSearch,
  Headphones, History, House, LogOut, Menu, MessageSquareWarning, Search, Settings,
  ShieldCheck, Star, UserCheck, Users, WalletCards, X,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { AuthenticatedState } from "@/lib/auth/server";

const navGroups = [
  { label: "Operations", items: [
    ["Overview", "/admin", House], ["Users", "/admin/users", Users], ["Hosts", "/admin/hosts", UserCheck],
    ["Host applications", "/admin/host-requests", ClipboardCheck], ["Content", "/admin/listings", FileSearch],
    ["Reviews", "/admin/reviews", Star], ["Bookings", "/admin/bookings", BookOpenCheck],
  ] },
  { label: "Trust & service", items: [
    ["Support", "/admin/support", Headphones], ["Reports", "/admin/reports", ShieldCheck],
    ["Moderation", "/admin/moderation", MessageSquareWarning], ["Messages / Safety", "/admin/messages", MessageSquareWarning],
  ] },
  { label: "Finance & system", items: [
    ["Payments", "/admin/payments", CircleDollarSign], ["Payouts", "/admin/payouts", WalletCards],
    ["Audit log", "/admin/audit-log", History], ["Settings", "/admin/settings", Settings],
  ] },
] as const;

function Sidebar({ close }: { close?: () => void }) {
  const pathname = usePathname();
  return <nav aria-label="Admin navigation" className="space-y-6 px-3 py-5">
    {navGroups.map((group) => <div key={group.label}>
      <p className="px-3 text-[0.68rem] font-semibold uppercase text-sinner-mist/45">{group.label}</p>
      <div className="mt-2 space-y-1">
        {group.items.map(([label, href, Icon]) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return <Link key={href} href={href} onClick={close} className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm transition duration-200 ${active ? "bg-sinner-gold/10 text-sinner-goldSoft" : "text-sinner-mist hover:bg-white/[0.04] hover:text-white"}`}>
            <Icon size={17} aria-hidden="true" /><span>{label}</span>
          </Link>;
        })}
      </div>
    </div>)}
  </nav>;
}

export function AdminChrome({ auth, children }: { auth: AuthenticatedState; children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const adminName = auth.profile?.display_name || auth.user.email || "Administrator";

  return <div className="min-h-screen bg-sinner-black text-sinner-ivory">
    <header className="sticky top-0 z-[90] border-b hairline bg-sinner-black/95 backdrop-blur-xl">
      <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Open admin menu" onClick={() => setDrawerOpen(true)} className="grid h-10 w-10 place-items-center rounded-md border hairline text-sinner-mist lg:hidden"><Menu size={19} /></button>
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image src="/logo-sinner.png" alt="SINNER" width={38} height={38} className="h-9 w-9 object-cover" />
            <span className="hidden font-display text-lg gold-text sm:block">SINNER <span className="font-sans text-xs font-semibold text-sinner-mist">ADMIN</span></span>
          </Link>
        </div>
        <form action="/admin/search" className="mx-auto flex w-full max-w-xl items-center gap-2 rounded-md border hairline bg-black/30 px-3 focus-within:border-sinner-gold/35">
          <Search size={16} className="shrink-0 text-sinner-mist/60" />
          <input name="q" aria-label="Search SINNER" placeholder="Search SINNER..." className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-sinner-mist/45" />
        </form>
        <div className="relative flex items-center gap-2">
          <Link href="/admin/reports?status=open" aria-label="Administrative notifications" className="grid h-10 w-10 place-items-center rounded-md border hairline text-sinner-mist transition hover:text-sinner-goldSoft"><Bell size={18} /></Link>
          <button type="button" aria-expanded={accountOpen} onClick={() => setAccountOpen((open) => !open)} className="flex h-10 max-w-44 items-center gap-2 rounded-md border hairline px-3 text-sm text-sinner-mist hover:text-white">
            <span className="hidden truncate sm:block">{adminName}</span><ChevronDown size={15} />
          </button>
          {accountOpen ? <div className="absolute right-0 top-12 z-20 w-56 rounded-md border hairline bg-sinner-coal p-2 shadow-card">
            <p className="truncate border-b hairline px-3 py-2 text-xs text-sinner-mist">{auth.user.email}</p>
            <Link href="/" className="block rounded px-3 py-2 text-sm text-sinner-mist hover:bg-white/[0.04] hover:text-white">View marketplace</Link>
            <Link href="/profile" className="block rounded px-3 py-2 text-sm text-sinner-mist hover:bg-white/[0.04] hover:text-white">My profile</Link>
            <form action={logoutAction} className="mt-1 border-t hairline pt-1"><button className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-sinner-mist hover:bg-white/[0.04] hover:text-white"><LogOut size={15} /> Sign out</button></form>
          </div> : null}
        </div>
      </div>
    </header>

    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden border-r hairline bg-white/[0.015] lg:block"><div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto"><Sidebar /></div></aside>
      <div className="min-w-0"><main>{children}</main><footer className="flex flex-wrap items-center justify-between gap-3 border-t hairline px-6 py-5 text-xs text-sinner-mist/60"><span>© 2026 SINNER · Admin</span><div className="flex gap-4"><span>System status</span><form action={logoutAction}><button className="hover:text-white">Sign out</button></form></div></footer></div>
    </div>

    {drawerOpen ? <div className="fixed inset-0 z-[100] lg:hidden"><button aria-label="Close admin menu" className="absolute inset-0 bg-black/75" onClick={() => setDrawerOpen(false)} /><aside className="relative h-full w-[min(86vw,310px)] overflow-y-auto border-r hairline bg-sinner-coal"><div className="flex h-16 items-center justify-between border-b hairline px-4"><span className="font-display text-lg gold-text">SINNER ADMIN</span><button aria-label="Close admin menu" onClick={() => setDrawerOpen(false)} className="grid h-10 w-10 place-items-center"><X size={20} /></button></div><Sidebar close={() => setDrawerOpen(false)} /></aside></div> : null}
  </div>;
}
