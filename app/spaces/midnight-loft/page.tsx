import { SpaceDetail } from "@/components/SpaceDetail";
import { spaces } from "@/lib/data";

const space = spaces[0];

export default function MidnightLoftPage() {
  return <SpaceDetail space={space} />;
}
