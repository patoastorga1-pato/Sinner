import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SectionTitle } from "@/components/SectionTitle";
import { getExperiences } from "@/lib/data-access/marketplace";

export default async function ExperiencesPage() {
  const experiences = await getExperiences();
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <SectionTitle eyebrow="Adult experiences" title="Experiences after dark" copy="Private formats with clear permissions, discreet access and premium spaces." />
        <div className="grid gap-5 md:grid-cols-2">{experiences.map((experience) => <Link key={experience.id} href={`/experiences/${experience.slug}`} className="group relative min-h-80 overflow-hidden rounded-2xl"><Image src={experience.image} alt={experience.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition duration-300 group-hover:scale-[1.02]" /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" /><div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-6"><div><p className="text-xs font-semibold uppercase text-sinner-goldSoft">SINNER experience</p><h2 className="mt-2 font-display text-4xl text-white">{experience.name}</h2><p className="mt-2 text-sm text-sinner-mist">{experience.description}</p></div><ArrowUpRight className="shrink-0 text-sinner-goldSoft" /></div></Link>)}</div>
      </section>
      <Footer />
    </main>
  );
}
