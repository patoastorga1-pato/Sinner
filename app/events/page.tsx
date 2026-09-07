import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SectionTitle } from "@/components/SectionTitle";
import { getEvents } from "@/lib/data-access/marketplace";

export default async function EventsPage() {
  const events = await getEvents();
  return <main><Header /><section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8"><SectionTitle eyebrow="Lifestyle events" title="Events" copy="Verified adult events with limited access and clear organizer rules." /><div className="grid gap-6 md:grid-cols-3">{events.map((event) => <Link key={event.id} href={`/events/${event.slug}`} className="group overflow-hidden rounded-2xl bg-sinner-panel shadow-card transition hover:-translate-y-1"><div className="relative aspect-[4/3] overflow-hidden"><Image src={event.image} alt={event.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition group-hover:scale-[1.02]" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" /><span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs text-white backdrop-blur">{event.badge}</span></div><div className="p-6"><p className="text-xs font-semibold uppercase text-sinner-gold">{event.type}</p><h2 className="mt-2 font-display text-3xl text-sinner-ivory">{event.name}</h2><div className="mt-5 flex flex-wrap gap-4 text-sm text-sinner-mist"><span className="flex items-center gap-2"><CalendarDays size={15} />{event.date}</span><span className="flex items-center gap-2"><MapPin size={15} />{event.city}</span></div><p className="mt-5 border-t hairline pt-4 text-sm font-semibold text-sinner-ivory">{event.price}</p></div></Link>)}</div></section><Footer /></main>;
}
