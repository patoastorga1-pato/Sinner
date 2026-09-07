"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Spaces", href: "/spaces" },
  { label: "Experiences", href: "/#experiences" },
  { label: "Events", href: "/#events" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 18);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 border-b transition-colors duration-300 hairline backdrop-blur-xl ${scrolled ? "bg-sinner-black/95" : "bg-sinner-black/80"}`}>
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
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
          <Link
            href="/#host"
            className="hidden rounded-lg border border-sinner-gold/30 px-4 py-2 text-sm text-sinner-goldSoft transition duration-200 hover:border-sinner-gold/55 hover:bg-sinner-gold/5 sm:inline-flex"
          >
            Become a Host
          </Link>
          <button aria-label="Favorites" className="grid h-10 w-10 place-items-center rounded-lg border hairline text-sinner-mist transition duration-200 hover:border-sinner-gold/30 hover:text-sinner-goldSoft">
            <Heart size={18} />
          </button>
          <button aria-label="Profile" className="hidden h-10 w-10 items-center justify-center rounded-lg border hairline text-sinner-mist transition duration-200 hover:border-sinner-gold/30 hover:text-sinner-goldSoft sm:flex">
            <UserRound size={18} />
          </button>
          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-lg border hairline text-sinner-mist transition hover:text-sinner-goldSoft md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {menuOpen ? (
        <nav className="border-t hairline bg-sinner-black/98 px-4 py-4 md:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-4 py-3 text-sm text-sinner-mist transition hover:bg-white/[0.04] hover:text-sinner-ivory">
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
