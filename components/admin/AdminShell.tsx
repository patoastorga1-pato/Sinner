export function AdminShell({ title, copy, children }: { title: string; copy: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-[1540px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <p className="text-xs font-semibold uppercase text-sinner-gold">Administration</p>
      <h1 className="mt-2 font-display text-4xl font-medium text-sinner-ivory sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-sinner-mist sm:text-base">{copy}</p>
      <div className="mt-7">{children}</div>
    </section>
  );
}
