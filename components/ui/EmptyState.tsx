import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, copy, actionLabel, actionHref }: { icon: LucideIcon; title: string; copy: string; actionLabel?: string; actionHref?: string }) {
  return (
    <div className="grid min-h-72 place-items-center border-y hairline py-12 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-sinner-gold/25 text-sinner-goldSoft"><Icon size={21} /></span>
        <h2 className="mt-5 font-display text-3xl font-medium text-sinner-ivory">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-sinner-mist">{copy}</p>
        {actionLabel && actionHref ? <Link href={actionHref} className="mt-6 inline-flex rounded-lg bg-sinner-gold px-5 py-3 text-sm font-semibold text-black hover:bg-sinner-goldSoft">{actionLabel}</Link> : null}
      </div>
    </div>
  );
}

