import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, ShieldCheck, Users } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getExperiences } from "@/lib/data-access/marketplace";

export default async function ExperiencePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const experience = (await getExperiences()).find((item) => item.slug === slug);
  if (!experience) notFound();

  return (
    <main><Header /><section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8"><div className="relative min-h-[500px] overflow-hidden rounded-2xl"><Image src={experience.image} alt={experience.name} fill preload sizes="100vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/20" /><div className="absolute inset-x-0 bottom-0 max-w-3xl p-7 sm:p-10"><p className="text-xs font-semibold uppercase text-sinner-goldSoft">SINNER experience</p><h1 className="mt-3 font-display text-5xl text-white sm:text-7xl">{experience.name}</h1><p className="mt-5 text-lg leading-8 text-sinner-ivory/75">{experience.description}</p></div></div><div className="mt-8 grid gap-4 sm:grid-cols-3">{[[Clock,"Flexible duration"],[Users,"Private guest list"],[ShieldCheck,"Clear permissions"]].map(([Icon,label]) => { const ItemIcon = Icon as typeof Clock; return <div key={String(label)} className="flex items-center gap-3 rounded-lg border hairline bg-white/[0.03] px-4 py-4 text-sinner-mist"><ItemIcon size={18} className="text-sinner-goldSoft" />{String(label)}</div>; })}</div></section><Footer /></main>
  );
}
