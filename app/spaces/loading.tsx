export default function SpacesLoading() {
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="h-5 w-24 animate-pulse rounded bg-white/10" /><div className="mt-4 h-14 w-56 animate-pulse rounded bg-white/10" /><div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl bg-white/[0.06]" />)}</div></main>;
}
