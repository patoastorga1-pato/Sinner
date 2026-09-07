import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function SpaceNotFound() {
  return (
    <main>
      <Header />
      <section className="mx-auto grid min-h-[68vh] max-w-3xl place-items-center px-4 py-20 text-center sm:px-6">
        <div>
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-sinner-gold/25 text-sinner-goldSoft">
            <SearchX size={23} />
          </span>
          <p className="mt-6 text-xs font-semibold uppercase text-sinner-goldSoft">Space unavailable</p>
          <h1 className="mt-3 font-display text-5xl text-sinner-ivory sm:text-6xl">This private space cannot be found.</h1>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-sinner-mist">
            The listing may be unpublished, under review or no longer available to the public.
          </p>
          <Link href="/spaces" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg bg-sinner-gold px-6 font-semibold text-sinner-black">
            <ArrowLeft size={17} />Browse spaces
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
