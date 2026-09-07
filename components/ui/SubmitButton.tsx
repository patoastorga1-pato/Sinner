"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`flex h-12 items-center justify-center gap-2 rounded-lg bg-sinner-gold px-5 font-semibold text-black transition hover:bg-sinner-goldSoft disabled:cursor-wait disabled:opacity-70 ${className}`}>
      {pending ? <LoaderCircle size={17} className="animate-spin" /> : null}
      {pending ? "Working..." : children}
    </button>
  );
}

