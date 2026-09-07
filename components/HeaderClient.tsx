"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Heart, Menu, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import type { AuthState } from "@/lib/auth/server";

const navItems = [
  { label: "Spaces", href: "/spaces" },
  { label: "Experiences", href: "/experiences" },
  { label: "Events", href: "/events" },
];

const memberItems = [
  { label: "Profile", href: "/profile" },
  { label: "Bookings", href: "/bookings" },
  { label: "Messages", href: "/messages" },
  { label: "Favorites", href: "/favorites" },
  { label: "Settings", href: "/settings" },
];

export function HeaderClient({ auth }: { auth: AuthState }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const pathname = usePathname();
  const isHost = auth.roles.includes("host");
  const loginRedirect = `/login?redirect=${encodeURIComponent(pathname)}`;
  const hostHref = auth.user ? (isHost ? "/host/dashboard" : "/host/onboarding") : "/login?redirect=/host/onboarding";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 18);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 border-b transition-colors duration-300 hairline backdrop-blur-xl ${scrolled ? "bg-sinner-black/95" : "bg-sinner-black/80"}`}>
      <div className="relative mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo-sinner.png" alt="SINNER logo" width={44} height={44} className="h-11 w-11 object-cover" />
          <span className="font-display text-xl font-medium gold-text sm:text-2xl">SINNER</span>
        </Link>
        <nav className="hidden items-center gap-9 text-sm text-sinner-mist md:flex">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="relative py-5 transition-colors duration-200 after:absolute after:bottom-3 after:left-0 after:h-px after:w-0 after:bg-sinner-gold after:transition-all after:duration-200 hover:text-sinner-ivory hover:after:w-full">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-2">
          <Link href={hostHref} className="hidden rounded-lg border border-sinner-gold/30 px-4 py-2 text-sm text-sinner-goldSoft transition duration-200 hover:border-sinner-gold/55 hover:bg-sinner-gold/5 sm:inline-flex">
            {isHost ? "Host Dashboard" : "Become a Host"}
          </Link>
          {auth.user ? (
            <Link href="/notifications" aria-label="Notifications" className="relative hidden h-10 w-10 items-center justify-center rounded-lg border hairline text-sinner-mist transition hover:border-sinner-gold/30 hover:text-sinner-goldSoft sm:flex">
              <Bell size={18} />
              {auth.unreadNotifications > 0 ? <span className="absolute right-1 top-1 min-w-4 rounded-full bg-sinner-violet px-1 text-center text-[0.62rem] font-bold leading-4 text-white">{Math.min(auth.unreadNotifications, 99)}</span> : null}
            </Link>
          ) : null}
          <Link href={auth.user ? "/favorites" : "/login?redirect=/favorites"} aria-label="Favorites" className="grid h-10 w-10 place-items-center rounded-lg border hairline text-sinner-mist transition duration-200 hover:border-sinner-gold/30 hover:text-sinner-goldSoft">
            <Heart size={18} />
          </Link>
          <button
            type="button"
            aria-label="Account menu"
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((open) => !open)}
            className="hidden h-10 w-10 items-center justify-center rounded-lg border hairline text-sinner-mist transition duration-200 hover:border-sinner-gold/30 hover:text-sinner-goldSoft sm:flex"
          >
            <UserRound size={18} />
          </button>
          <button type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="grid h-10 w-10 place-items-center rounded-lg border hairline text-sinner-mist transition hover:text-sinner-goldSoft md:hidden">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {accountOpen ? (
          <div className="absolute right-6 top-14 z-20 w-56 rounded-lg border hairline bg-sinner-coal p-2 shadow-card lg:right-8">
            {auth.user ? (
              <>
                <p className="truncate border-b hairline px-3 py-2 text-xs text-sinner-mist">{auth.profile?.display_name || auth.user.email}</p>
                {memberItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setAccountOpen(false)} className="block rounded-md px-3 py-2 text-sm text-sinner-mist hover:bg-white/[0.05] hover:text-white">{item.label}</Link>)}
                <Link href={hostHref} onClick={() => setAccountOpen(false)} className="block rounded-md px-3 py-2 text-sm text-sinner-goldSoft hover:bg-white/[0.05]">{isHost ? "Host Dashboard" : "Become a Host"}</Link>
                <form action={logoutAction} className="mt-1 border-t hairline pt-1"><button type="submit" className="w-full rounded-md px-3 py-2 text-left text-sm text-sinner-mist hover:bg-white/[0.05] hover:text-white">Log out</button></form>
              </>
            ) : (
              <>
                <Link href={loginRedirect} onClick={() => setAccountOpen(false)} className="block rounded-md px-3 py-2 text-sm text-sinner-mist hover:bg-white/[0.05] hover:text-white">Log in</Link>
                <Link href="/signup" onClick={() => setAccountOpen(false)} className="block rounded-md px-3 py-2 text-sm text-sinner-goldSoft hover:bg-white/[0.05]">Sign up</Link>
              </>
            )}
          </div>
        ) : null}
      </div>

      {menuOpen ? (
        <nav className="border-t hairline bg-sinner-black/98 px-4 py-4 md:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {navItems.map((item) => <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-4 py-3 text-sm text-sinner-mist transition hover:bg-white/[0.04] hover:text-sinner-ivory">{item.label}</Link>)}
            <div className="my-2 border-t hairline" />
            {auth.user ? memberItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-4 py-3 text-sm text-sinner-mist hover:bg-white/[0.04] hover:text-white">{item.label}</Link>) : (
              <>
                <Link href={loginRedirect} onClick={() => setMenuOpen(false)} className="rounded-lg px-4 py-3 text-sm text-sinner-mist">Log in</Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="rounded-lg px-4 py-3 text-sm text-sinner-goldSoft">Sign up</Link>
              </>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

