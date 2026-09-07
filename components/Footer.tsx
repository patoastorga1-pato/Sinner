import Image from "next/image";
import Link from "next/link";

const columns = [
  { title: "Explore", links: ["Spaces", "Experiences", "Events"] },
  { title: "Hosting", links: ["Become a Host", "Host standards", "Resources"] },
  { title: "Safety", links: ["Adult verification", "Privacy", "Trust center"] },
  { title: "Company", links: ["About SINNER", "Journal", "Contact"] },
  { title: "Legal", links: ["Terms", "Privacy policy", "Community rules"] },
];

export function Footer() {
  return (
    <footer className="border-t hairline bg-[#050407]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo-sinner.png" alt="SINNER logo" width={48} height={48} className="h-12 w-12 object-cover" />
              <span className="font-display text-3xl font-medium gold-text">SINNER</span>
            </Link>
            <p className="mt-4 text-sm text-sinner-mist">Private spaces. After dark.</p>
            <p className="mt-8 inline-flex rounded-full border border-sinner-gold/20 px-3 py-1.5 text-xs font-semibold uppercase text-sinner-goldSoft">18+ Adults only</p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold text-sinner-ivory">{column.title}</h3>
                <div className="mt-4 grid gap-3 text-sm text-sinner-mist">
                  {column.links.map((link) => (
                    <Link key={link} href="#" className="transition hover:text-sinner-goldSoft">
                      {link}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-3 border-t hairline pt-6 text-xs text-sinner-mist/70 sm:flex-row">
          <span>© 2026 SINNER</span>
          <span>No sexual services. Spaces, experiences and authorized adult events only.</span>
        </div>
      </div>
    </footer>
  );
}
