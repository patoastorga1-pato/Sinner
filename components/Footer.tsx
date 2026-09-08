import Image from "next/image";
import Link from "next/link";

const columns = [
  { title: "Explore", links: [["Spaces", "/spaces"], ["Experiences", "/experiences"], ["Events", "/events"]] },
  { title: "Hosting", links: [["Become a Host", "/host/onboarding"], ["Host standards", "/host/onboarding"], ["Resources", "/host/onboarding"]] },
  { title: "Safety", links: [["Adult verification", "/profile"], ["Privacy", "/privacy"], ["Trust center", "/privacy"]] },
  { title: "Company", links: [["About SINNER", "/"], ["Journal", "/experiences"], ["Contact", "/settings"]] },
  { title: "Legal", links: [["Terms", "/terms"], ["Privacy policy", "/privacy"], ["Community rules", "/terms"]] },
];

export function Footer() {
  return (
    <footer className="border-t hairline bg-[#050407]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-18 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_2.1fr] lg:gap-16">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo-sinner.png" alt="SINNER logo" width={48} height={48} className="h-12 w-12 object-cover" />
              <span className="font-display text-3xl font-medium gold-text">SINNER</span>
            </Link>
            <p className="mt-5 text-sm leading-6 text-sinner-mist">Private spaces. After dark.</p>
            <p className="mt-8 inline-flex rounded-full border border-sinner-gold/20 bg-white/[0.02] px-4 py-2 text-xs font-semibold uppercase text-sinner-goldSoft">18+ Adults only</p>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-8">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold text-sinner-ivory">{column.title}</h3>
                <div className="mt-4 grid gap-3.5 text-sm text-sinner-mist">
                  {column.links.map(([label, href]) => (
                    <Link key={label} href={href} className="transition duration-300 hover:text-sinner-goldSoft">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-4 border-t hairline pt-7 text-xs leading-5 text-sinner-mist/70 sm:flex-row sm:items-center">
          <span>© 2026 SINNER</span>
          <span className="max-w-xl sm:text-right">No sexual services. Spaces, experiences and authorized adult events only.</span>
        </div>
      </div>
    </footer>
  );
}
