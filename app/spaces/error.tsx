"use client";

import { CircleAlert } from "lucide-react";

export default function SpacesError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className="grid min-h-[70vh] place-items-center px-4 text-center"><div className="max-w-md"><CircleAlert size={34} className="mx-auto text-sinner-goldSoft" /><h1 className="mt-5 font-display text-4xl text-sinner-ivory">Spaces could not be loaded.</h1><p className="mt-3 text-sm leading-6 text-sinner-mist">The marketplace connection had a problem. Your search is still in the URL.</p><button type="button" onClick={() => retry()} className="mt-6 rounded-lg bg-sinner-gold px-5 py-3 text-sm font-semibold text-black">Try again</button></div></main>;
}
