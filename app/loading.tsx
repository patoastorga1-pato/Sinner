import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return <div className="grid min-h-screen place-items-center bg-sinner-black text-sinner-goldSoft"><LoaderCircle size={28} className="animate-spin" aria-label="Loading" /></div>;
}

