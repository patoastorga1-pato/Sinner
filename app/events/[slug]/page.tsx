import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getEvents } from "@/lib/data-access/marketplace";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = (await getEvents()).find((item) => item.slug === slug);
  if (!event) notFound();
  return <main><Header /><section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8"><div className="grid overflow-hidden rounded-2xl bg-sinner-panel lg:grid-cols-[1.15fr_0.85fr]"><div className="relative min-h-[420px]"><Image src={event.image} alt={event.name} fill sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover" /></div><div className="p-7 sm:p-10"><p className="text-xs font-semibold uppercase text-sinner-gold">{event.type}</p><h1 className="mt-3 font-display text-5xl text-sinner-ivory">{event.name}</h1><div className="mt-7 grid gap-4 text-sinner-mist"><span className="flex items-center gap-3"><CalendarDays size={18} className="text-sinner-goldSoft" />{event.date}</span><span className="flex items-center gap-3"><MapPin size={18} className="text-sinner-goldSoft" />{event.city}</span><span className="flex items-center gap-3"><ShieldCheck size={18} className="text-sinner-goldSoft" />Verified adults only</span></div><p className="mt-8 font-display text-3xl gold-text">{event.price}</p><button type="button" disabled className="mt-7 w-full rounded-lg border border-sinner-gold/25 px-5 py-3 text-sm text-sinner-mist">Ticketing is not enabled yet</button></div></div></section><Footer /></main>;
}
