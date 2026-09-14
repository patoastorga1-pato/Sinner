"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  BookOpenCheck,
  CreditCard,
  Heart,
  HelpCircle,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageCircle,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import type { UserRole } from "@/lib/types/database";

const accountLinks = [
  { label: "Overview", href: "/profile", icon: LayoutDashboard },
  { label: "Bookings", href: "/bookings", icon: BookOpenCheck },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Verification", href: "/verification", icon: ShieldCheck },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Security", href: "/security", icon: LockKeyhole },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Support", href: "/support", icon: HelpCircle },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/profile" && pathname.startsWith(`${href}/`));
}

function AccountLink({ item, onClick }: { item: (typeof accountLinks)[number]; onClick?: () => void }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm transition duration-200 ${
        active
          ? "border border-sinner-gold/25 bg-sinner-gold/10 text-sinner-goldSoft shadow-[0_0_24px_rgba(214,170,88,0.06)]"
          : "text-sinner-mist hover:bg-white/[0.04] hover:text-sinner-ivory"
      }`}
    >
      <Icon size={17} />
      <span>{item.label}</span>
    </Link>
  );
}

export function AccountNavigation({ roles }: { roles: UserRole[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const current = accountLinks.find((item) => isActive(pathname, item.href)) ?? accountLinks[0];
  const isHost = roles.includes("host");
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-12 w-full items-center justify-between rounded-xl border hairline bg-sinner-coal/95 px-4 text-sm text-sinner-ivory shadow-card lg:hidden"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5">
          <Menu size={17} className="text-sinner-goldSoft" />
          {current.label}
        </span>
        <span className="text-xs uppercase text-sinner-mist">Menu</span>
      </button>

      <aside className="hidden h-fit rounded-2xl border hairline bg-white/[0.018] p-3 lg:sticky lg:top-24 lg:block">
        <nav className="grid gap-1" aria-label="Account sections">
          {accountLinks.map((item) => <AccountLink key={item.href} item={item} />)}
        </nav>
        {(isHost || isAdmin) ? (
          <div className="mt-4 border-t hairline pt-4">
            <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase text-sinner-mist/60">Platform tools</p>
            {isHost ? <Link href="/host/dashboard" className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm text-sinner-goldSoft transition hover:bg-sinner-gold/10">Host dashboard</Link> : null}
            {isAdmin ? <Link href="/admin" className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold text-sinner-goldSoft transition hover:bg-sinner-gold/10">Admin panel</Link> : null}
          </div>
        ) : null}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-[70] bg-black/78 backdrop-blur-sm lg:hidden" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-label="Account menu" className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl border-t hairline bg-sinner-black px-5 pb-8 pt-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-sinner-goldSoft">YOUR ACCOUNT</p>
                <h2 className="mt-1 font-display text-3xl text-sinner-ivory">Account menu</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close account menu" className="grid h-10 w-10 place-items-center rounded-lg border hairline text-sinner-mist"><X size={19} /></button>
            </div>
            <nav className="grid gap-1" aria-label="Account sections">
              {accountLinks.map((item) => <AccountLink key={item.href} item={item} onClick={() => setOpen(false)} />)}
            </nav>
            {(isHost || isAdmin) ? (
              <div className="mt-5 border-t hairline pt-4">
                <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase text-sinner-mist/60">Platform tools</p>
                {isHost ? <Link href="/host/dashboard" onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-3.5 text-sm text-sinner-goldSoft">Host dashboard</Link> : null}
                {isAdmin ? <Link href="/admin" onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-3.5 text-sm font-semibold text-sinner-goldSoft">Admin panel</Link> : null}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
