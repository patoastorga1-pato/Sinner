import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

const accountLinks = [
  ["Profile", "/profile"],
  ["Bookings", "/bookings"],
  ["Messages", "/messages"],
  ["Favorites", "/favorites"],
  ["Notifications", "/notifications"],
  ["Settings", "/settings"],
] as const;

export function AccountShell({ eyebrow = "Your account", title, copy, children }: { eyebrow?: string; title: string; copy: string; children: React.ReactNode }) {
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <p className="text-xs font-semibold uppercase text-sinner-gold">{eyebrow}</p>
        <h1 className="mt-3 font-display text-5xl font-medium text-sinner-ivory sm:text-6xl">{title}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-sinner-mist">{copy}</p>
        <nav className="soft-scrollbar mt-8 flex gap-2 overflow-x-auto border-b hairline pb-4">
          {accountLinks.map(([label, href]) => <Link key={href} href={href} className="min-w-fit rounded-lg px-4 py-2 text-sm text-sinner-mist hover:bg-white/[0.04] hover:text-sinner-goldSoft">{label}</Link>)}
        </nav>
        <div className="mt-10">{children}</div>
      </section>
      <Footer />
    </main>
  );
}

