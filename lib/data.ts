export type Space = {
  id: string;
  slug: string;
  name: string;
  zone: string;
  price: string;
  rating: number;
  privacyScore: number;
  tags: string[];
  image: string;
  gallery: string[];
  description: string;
  amenities: string[];
  rules: string[];
  allowedUses: { label: string; allowed: boolean }[];
};

export const spaces: Space[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "midnight-loft",
    name: "Midnight Loft",
    zone: "Guadalajara, Jalisco",
    price: "$1,500 MXN",
    rating: 4.96,
    privacyScore: 9.7,
    tags: ["Creator Friendly", "Jacuzzi"],
    image: "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1200&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=85",
    ],
    description:
      "A low-lit private loft designed for hourly escapes, discreet content sessions and elevated after-dark experiences.",
    amenities: ["Private jacuzzi", "King suite", "Warm bar lighting", "Secure access", "Bluetooth audio", "Blackout curtains"],
    rules: ["Adults only, 18+", "Government ID required", "Respect quiet hours", "No unauthorized guests"],
    allowedUses: [
      { label: "Intimate experiences", allowed: true },
      { label: "Nudity", allowed: true },
      { label: "Photography", allowed: true },
      { label: "Video recording", allowed: true },
      { label: "Commercial adult content", allowed: true },
      { label: "Groups up to 8 guests", allowed: true },
      { label: "Events", allowed: false },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    slug: "the-velvet-room",
    name: "The Velvet Room",
    zone: "Zapopan, Jalisco",
    price: "$950 MXN",
    rating: 4.91,
    privacyScore: 9.4,
    tags: ["Themed", "Private Entrance"],
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=85",
    ],
    description: "A compact private room with a cinematic palette, self check-in and polished comfort for couples.",
    amenities: ["Private entrance", "Self check-in", "Ambient lighting", "Soundproofing", "Rain shower"],
    rules: ["Adults only, 18+", "No smoking", "No parties", "Leave the space as received"],
    allowedUses: [
      { label: "Intimate experiences", allowed: true },
      { label: "Nudity", allowed: true },
      { label: "Photography", allowed: true },
      { label: "Video recording", allowed: false },
      { label: "Commercial adult content", allowed: false },
      { label: "Groups up to 8 guests", allowed: false },
      { label: "Events", allowed: false },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    slug: "obsidian-villa",
    name: "Obsidian Villa",
    zone: "Guadalajara, Jalisco",
    price: "$4,800 MXN",
    rating: 4.99,
    privacyScore: 9.9,
    tags: ["Groups", "Pool", "Events"],
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=85",
    ],
    description: "A private villa for curated lifestyle events, groups and elegant nighttime gatherings.",
    amenities: ["Pool", "Outdoor lounge", "Private parking", "Host concierge", "Event-ready kitchen"],
    rules: ["Adults only, 18+", "Guest list required", "Security deposit required", "Noise limits after 1 AM"],
    allowedUses: [
      { label: "Intimate experiences", allowed: true },
      { label: "Nudity", allowed: true },
      { label: "Photography", allowed: true },
      { label: "Video recording", allowed: true },
      { label: "Commercial adult content", allowed: false },
      { label: "Groups up to 8 guests", allowed: true },
      { label: "Events", allowed: true },
    ],
  },
];

export const experiences = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    slug: "private-jacuzzi-experience",
    name: "Private Jacuzzi Experience",
    description: "Warm water, low light and complete privacy.",
    image: "/images/experience-jacuzzi.png",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    slug: "couples-escape",
    name: "Couples Escape",
    description: "A private setting designed for two.",
    image: "/images/experience-couples.png",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    slug: "themed-experience",
    name: "Themed Experience",
    description: "Immersive rooms with a distinct point of view.",
    image: "/images/experience-themed.png",
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    slug: "private-content-studio",
    name: "Private Content Studio",
    description: "Controlled light, discreet access and creator-ready sets.",
    image: "/images/experience-studio.png",
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    slug: "sensory-experience",
    name: "Sensory Experience",
    description: "Atmosphere, sound and detail curated for the night.",
    image: "/images/experience-sensory.png",
  },
];

export const events = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    slug: "midnight-masquerade",
    name: "Midnight Masquerade",
    date: "Oct 18",
    city: "Guadalajara",
    type: "Lifestyle Event",
    price: "From $1,200 MXN",
    availability: "24 seats left",
    badge: "Invite Only",
    image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    slug: "couples-only-night",
    name: "Couples Only Night",
    date: "Nov 02",
    city: "Zapopan",
    type: "Private Event",
    price: "From $1,600 MXN",
    availability: "Limited",
    badge: "Couples Only",
    image: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    slug: "after-dark-social",
    name: "After Dark Social",
    date: "Nov 21",
    city: "Guadalajara",
    type: "Adult Experiences",
    price: "From $900 MXN",
    availability: "Open",
    badge: "Verified Event",
    image: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=900&q=85",
  },
];
