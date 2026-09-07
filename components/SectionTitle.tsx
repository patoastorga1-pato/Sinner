export function SectionTitle({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy?: string }) {
  return (
    <div className="mb-10 max-w-3xl md:mb-12">
      {eyebrow ? <p className="mb-4 text-xs font-semibold uppercase text-sinner-gold">{eyebrow}</p> : null}
      <h2 className="font-display text-4xl font-medium leading-tight text-sinner-ivory md:text-5xl">{title}</h2>
      {copy ? <p className="mt-4 max-w-2xl text-base leading-7 text-sinner-mist">{copy}</p> : null}
    </div>
  );
}
