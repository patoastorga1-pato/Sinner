"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const acknowledgementKey = "sinner-adult-entry-v1";

export function AgeGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = window.localStorage.getItem(acknowledgementKey) === "accepted";
    const timer = window.setTimeout(() => setVisible(!accepted), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/90 px-4 backdrop-blur-xl" role="dialog" aria-modal="true" aria-labelledby="age-gate-title">
      <section className="w-full max-w-md rounded-2xl border border-sinner-gold/25 bg-sinner-coal p-7 text-center shadow-[0_28px_90px_rgba(0,0,0,0.7)] sm:p-9">
        <Image src="/logo-sinner.png" alt="SINNER" width={64} height={64} className="mx-auto h-16 w-16 object-cover" />
        <p className="mt-5 text-xs font-semibold uppercase text-sinner-gold">Adults only</p>
        <h2 id="age-gate-title" className="mt-3 font-display text-4xl font-medium text-sinner-ivory">SINNER is exclusively for adults.</h2>
        <p className="mt-4 text-sinner-mist">Are you 18 or older?</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem(acknowledgementKey, "accepted");
              setVisible(false);
            }}
            className="h-12 rounded-lg bg-sinner-gold px-5 font-semibold text-black hover:bg-sinner-goldSoft"
          >
            Enter SINNER
          </button>
          <button type="button" onClick={() => window.location.replace("about:blank")} className="h-12 rounded-lg border hairline px-5 font-semibold text-sinner-mist hover:border-sinner-gold/30 hover:text-white">
            Exit
          </button>
        </div>
        <p className="mt-5 text-xs leading-5 text-sinner-mist/65">This acknowledgement is not identity or age verification.</p>
      </section>
    </div>
  );
}
