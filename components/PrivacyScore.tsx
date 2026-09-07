import { ShieldCheck } from "lucide-react";

export function PrivacyScore({ score, large = false }: { score: number; large?: boolean }) {
  if (large) {
    return (
      <div className="relative min-w-44 overflow-hidden rounded-xl border border-sinner-gold/25 bg-sinner-coal/90 p-5 shadow-card backdrop-blur-xl">
        <div className="absolute inset-y-0 left-0 w-1 bg-sinner-purple/70" />
        <div className="flex items-center gap-2 text-sinner-goldSoft"><ShieldCheck size={17} /><span className="text-[0.68rem] font-semibold uppercase">Privacy score</span></div>
        <div className="mt-2 flex items-end gap-1"><span className="font-display text-5xl font-medium leading-none gold-text">{score.toFixed(1)}</span><span className="pb-1 text-xs text-sinner-mist">/ 10</span></div>
        <details className="mt-3 text-xs text-sinner-mist"><summary className="cursor-pointer text-sinner-goldSoft focus:outline-none focus-visible:ring-2 focus-visible:ring-sinner-gold/40">Why this score?</summary><p className="mt-2 leading-5">This is the host&apos;s stored Privacy Score. A factor breakdown will be introduced when verified privacy signals are available.</p></details>
      </div>
    );
  }
  return <div className="flex items-center gap-2 rounded-full border border-sinner-gold/45 bg-black/[0.82] px-3 py-2 text-[0.72rem] shadow-[0_10px_28px_rgba(0,0,0,0.5)] backdrop-blur-xl"><ShieldCheck size={16} className="text-sinner-goldSoft" /><span className="font-semibold uppercase text-white">Privacy</span><span className="font-bold text-sinner-goldSoft">{score.toFixed(1)}</span></div>;
}
