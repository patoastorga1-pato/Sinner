import Link from "next/link";
import { AccountNavigation } from "@/components/account/AccountNavigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getAuthState } from "@/lib/auth/server";

const legacyAccountLinks = [
  ["Profile", "/profile"],
  ["Bookings", "/bookings"],
  ["Messages", "/messages"],
  ["Favorites", "/favorites"],
  ["Notifications", "/notifications"],
  ["Support", "/support"],
  ["Settings", "/settings"],
] as const;

function AccountFooter() {
  return (
    <footer className="border-t hairline py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-xs text-sinner-mist sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© 2026 SINNER</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/privacy" className="transition hover:text-sinner-goldSoft">Privacy</Link>
          <Link href="/terms" className="transition hover:text-sinner-goldSoft">Terms</Link>
          <Link href="/support" className="transition hover:text-sinner-goldSoft">Support</Link>
        </nav>
      </div>
    </footer>
  );
}

export async function AccountShell({
  eyebrow = "YOUR ACCOUNT",
  title,
  copy,
  children,
}: {
  eyebrow?: string;
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  const isAccountCenter = eyebrow === "YOUR ACCOUNT";

  if (!isAccountCenter) {
    return (
      <main>
        <Header />
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <p className="text-xs font-semibold uppercase text-sinner-gold">{eyebrow}</p>
          <h1 className="mt-3 font-display text-5xl font-medium text-sinner-ivory sm:text-6xl">{title}</h1>
          <p className="mt-4 max-w-2xl leading-7 text-sinner-mist">{copy}</p>
          <nav className="soft-scrollbar mt-8 flex gap-2 overflow-x-auto border-b hairline pb-4">
            {legacyAccountLinks.map(([label, href]) => <Link key={href} href={href} className="min-w-fit rounded-lg px-4 py-2 text-sm text-sinner-mist hover:bg-white/[0.04] hover:text-sinner-goldSoft">{label}</Link>)}
          </nav>
          <div className="mt-10">{children}</div>
        </section>
        <Footer />
      </main>
    );
  }

  const auth = await getAuthState();

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 md:pb-16 md:pt-10 lg:px-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase text-sinner-goldSoft">
            <span className="h-px w-8 bg-sinner-gold/70" />
            {eyebrow}
          </div>
          <h1 className="mt-3 font-display text-5xl font-medium leading-none text-sinner-ivory sm:text-6xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-sinner-mist sm:text-base sm:leading-7">{copy}</p>
        </div>

        <div className="mt-7 grid gap-7 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <AccountNavigation roles={auth.roles} />
          <div className="min-w-0">{children}</div>
        </div>
      </section>
      <AccountFooter />
    </main>
  );
}
