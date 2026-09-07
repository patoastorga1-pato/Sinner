import { notFound } from "next/navigation";
import { SpaceDetail } from "@/components/SpaceDetail";
import { spaces } from "@/lib/data";

export function generateStaticParams() {
  return spaces.filter((space) => space.slug !== "midnight-loft").map((space) => ({ slug: space.slug }));
}

export default function SpacePage({ params }: { params: { slug: string } }) {
  const space = spaces.find((item) => item.slug === params.slug);

  if (!space) {
    notFound();
  }

  return <SpaceDetail space={space} />;
}
