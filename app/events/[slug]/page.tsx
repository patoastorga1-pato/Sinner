import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, ShieldCheck, Ticket } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getEventBySlug } from "@/lib/data-access/marketplace";
import { formatMoney } from "@/lib/marketplace/pricing";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  const facts = [
    { Icon: CalendarDays, value: event.eventDate },
    { Icon: Clock, value: `${event.startTime} - ${event.endTime}` },
    { Icon: MapPin, value: [event.locality, event.city, event.state].filter(Boolean).join(", ") },
  ];
  return <main><Header/><section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <Link href="/events" className="text-sm text-sinner-goldSoft">← Back to events</Link>
    <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div><div className="relative min-h-[480px] overflow-hidden rounded-xl"><Image src={event.image} alt={event.name} fill sizes="(max-width:1024px) 100vw, 70vw" className="object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"/><div className="absolute bottom-0 p-7"><p className="text-xs uppercase text-sinner-goldSoft">{event.category}</p><h1 className="mt-2 font-display text-5xl text-white sm:text-7xl">{event.name}</h1></div></div>
        <section className="mt-7 grid gap-4 sm:grid-cols-3">{facts.map(({Icon,value})=><div key={value} className="rounded-lg border hairline p-4"><Icon size={18} className="text-sinner-goldSoft"/><p className="mt-3 text-sm text-sinner-mist">{value}</p></div>)}</section>
        <section className="mt-8 border-t hairline pt-7"><h2 className="font-display text-4xl">About this event</h2><p className="mt-4 leading-8 text-sinner-mist">{event.description}</p></section>
        {event.houseRules?<section className="mt-8 border-t hairline pt-7"><h2 className="font-display text-3xl">Rules</h2><p className="mt-4 whitespace-pre-line text-sm leading-7 text-sinner-mist">{event.houseRules}</p></section>:null}
      </div>
      <aside className="h-fit rounded-xl border hairline bg-white/[0.025] p-6 lg:sticky lg:top-24"><div className="flex items-center gap-2 text-sm text-sinner-goldSoft"><ShieldCheck size={17}/>Verified adults · {event.minimumAge}+</div><h2 className="mt-5 font-display text-3xl">Tickets</h2><div className="mt-4 divide-y hairline">{event.ticketTypes.map(type=><div key={type.id} className="py-4"><div className="flex justify-between gap-4"><div><p className="font-semibold text-white">{type.name}</p><p className="mt-1 text-xs text-sinner-mist">{type.remaining} remaining · max {type.maxPerOrder}</p></div><p className="font-semibold text-white">{formatMoney(type.price,type.currency)}</p></div>{type.description?<p className="mt-2 text-sm text-sinner-mist">{type.description}</p>:null}</div>)}</div><button disabled className="mt-5 flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-sinner-gold/25 text-sm text-sinner-mist"><Ticket size={17}/>Secure checkout connects with Panda Blue</button><p className="mt-3 text-xs leading-5 text-sinner-mist/65">No ticket is issued until the payment provider confirms the transaction.</p></aside>
    </div></section><Footer/></main>;
}
