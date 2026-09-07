import { Bath, Camera, Car, CookingPot, DoorOpen, KeyRound, LampDesk, Scan, ShowerHead, Snowflake, Sparkles, Sunset, Trees, VolumeX, Waves, Wifi, type LucideIcon } from "lucide-react";
import type { SpaceAmenity } from "@/lib/types/marketplace";

const icons: Record<string, LucideIcon> = { bath: Bath, waves: Waves, "door-open": DoorOpen, car: Car, "key-round": KeyRound, "volume-x": VolumeX, wifi: Wifi, snowflake: Snowflake, "shower-head": ShowerHead, scan: Scan, "lamp-desk": LampDesk, camera: Camera, "cooking-pot": CookingPot, sunset: Sunset, trees: Trees };

export function AmenityList({ amenities }: { amenities: SpaceAmenity[] }) {
  if (!amenities.length) return <p className="mt-5 text-sm text-sinner-mist">Amenities will be confirmed by the host.</p>;
  return <div className="mt-5 grid gap-x-7 gap-y-1 sm:grid-cols-2">{amenities.map((amenity) => { const Icon = (amenity.iconName && icons[amenity.iconName]) || Sparkles; return <div key={amenity.slug} className="flex items-center gap-3 border-b hairline py-3 text-sm text-sinner-mist"><Icon size={18} className="shrink-0 text-sinner-goldSoft" /><span>{amenity.name}</span></div>; })}</div>;
}
