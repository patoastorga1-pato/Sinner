"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { SpacePhoto } from "@/lib/types/marketplace";

export function SpaceGallery({ name, photos }: { name: string; photos: SpacePhoto[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const gallery = photos.length ? photos : [{ id: "placeholder", url: "/images/hero-sinner-night.png", sortOrder: 0, isCover: true, altText: `${name} placeholder` }];

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") setActive((index) => (index + 1) % gallery.length);
      if (event.key === "ArrowLeft") setActive((index) => (index - 1 + gallery.length) % gallery.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); };
  }, [open, gallery.length]);

  return (
    <>
      <div className="relative grid min-h-[360px] overflow-hidden rounded-2xl bg-sinner-coal md:h-[520px] md:grid-cols-4 md:grid-rows-2 md:gap-1">
        <button type="button" onClick={() => { setActive(0); setOpen(true); }} aria-label={`Open ${name} photo gallery`} className="group relative min-h-[360px] overflow-hidden text-left md:col-span-2 md:row-span-2">
          <Image src={gallery[0].url} alt={gallery[0].altText ?? `${name} main space`} fill preload sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition duration-300 group-hover:scale-[1.015]" />
        </button>
        {gallery.slice(1, 5).map((photo, index) => <button key={photo.id} type="button" onClick={() => { setActive(index + 1); setOpen(true); }} aria-label={`Open ${name} photo ${index + 2}`} className="relative hidden overflow-hidden md:block"><Image src={photo.url} alt={photo.altText ?? `${name} gallery view ${index + 2}`} fill sizes="25vw" className="object-cover brightness-90 transition duration-300 hover:brightness-110" /></button>)}
        <button type="button" onClick={() => setOpen(true)} className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-white/20 bg-black/75 px-4 py-2.5 text-sm text-white backdrop-blur transition hover:border-sinner-gold/50"><Images size={17} />Show all photos</button>
      </div>

      {open ? (
        <div role="dialog" aria-modal="true" aria-label={`${name} full-screen gallery`} className="fixed inset-0 z-[80] grid grid-rows-[auto_1fr_auto] bg-black/95 p-4 sm:p-6">
          <div className="flex items-center justify-between"><p className="text-sm text-sinner-mist">{active + 1} / {gallery.length}</p><button type="button" onClick={() => setOpen(false)} aria-label="Close gallery" className="grid h-11 w-11 place-items-center rounded-lg border border-white/15 text-white"><X size={21} /></button></div>
          <div className="relative mx-auto my-4 h-full w-full max-w-6xl"><Image src={gallery[active].url} alt={gallery[active].altText ?? `${name} gallery view ${active + 1}`} fill sizes="100vw" className="object-contain" /></div>
          <div className="flex items-center justify-center gap-4"><button type="button" onClick={() => setActive((index) => (index - 1 + gallery.length) % gallery.length)} aria-label="Previous photo" className="grid h-11 w-11 place-items-center rounded-lg border border-white/15 text-white"><ChevronLeft size={21} /></button><button type="button" onClick={() => setActive((index) => (index + 1) % gallery.length)} aria-label="Next photo" className="grid h-11 w-11 place-items-center rounded-lg border border-white/15 text-white"><ChevronRight size={21} /></button></div>
        </div>
      ) : null}
    </>
  );
}
