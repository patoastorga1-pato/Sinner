"use client";

import { AlertTriangle } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div className="max-w-md">
        <AlertTriangle size={32} className="mx-auto text-sinner-gold" />
        <h1 className="mt-5 font-display text-4xl text-sinner-ivory">Something went wrong.</h1>
        <p className="mt-3 text-sinner-mist">The request could not be completed. Your account data has not been changed.</p>
        <button type="button" onClick={reset} className="mt-6 rounded-lg bg-sinner-gold px-5 py-3 font-semibold text-black">Try again</button>
      </div>
    </main>
  );
}

