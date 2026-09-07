import Image from "next/image";
import Link from "next/link";

export function AuthShell({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-12 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(84,27,112,0.24),transparent_30rem)]" />
      <div className="relative w-full max-w-lg">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <Image src="/logo-sinner.png" alt="SINNER logo" width={48} height={48} className="h-12 w-12 object-cover" />
          <span className="font-display text-3xl font-medium gold-text">SINNER</span>
        </Link>
        <section className="premium-panel p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase text-sinner-gold">{eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-medium text-sinner-ivory sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-sinner-mist">{copy}</p>
          <div className="mt-7">{children}</div>
        </section>
      </div>
    </main>
  );
}

