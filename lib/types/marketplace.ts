export const SPACE_TYPES = [
  { value: "private-suite", label: "Private Suite" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "studio", label: "Studio" },
  { value: "playroom", label: "Playroom" },
  { value: "venue", label: "Venue" },
  { value: "other", label: "Other" },
] as const;

export const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Highest rated" },
  { value: "privacy", label: "Highest Privacy Score" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
] as const;

export type SpaceType = (typeof SPACE_TYPES)[number]["value"];
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
export type BookingMode = "hourly" | "overnight" | "full-day";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export type SpaceSearchQuery = {
  location: string;
  date: string;
  start: string;
  duration: number;
  guests: number;
  minPrice: number | null;
  maxPrice: number | null;
  privacy: number | null;
  type: SpaceType | "";
  amenities: string[];
  allowedUses: string[];
  creatorFriendly: boolean;
  groupFriendly: boolean;
  eventsAllowed: boolean;
  instantBooking: boolean;
  sort: SortOption;
  page: number;
};

export type SpacePhoto = {
  id: string;
  url: string;
  sortOrder: number;
  isCover: boolean;
  altText: string | null;
};

export type SpaceAmenity = {
  name: string;
  slug: string;
  category: string;
  iconName: string | null;
};

export type SpaceAllowedUse = {
  name: string;
  slug: string;
  allowed: boolean;
  details: string | null;
};

export type SpaceRule = {
  key: string;
  label: string;
  detail: string;
  allowed?: boolean;
};

export type PublicHost = {
  id: string | null;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
  memberSince: string | null;
  rating: number | null;
};

export type PublicReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  authorName: string;
  authorAvatar: string | null;
};

export type SpaceCardData = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  spaceType: string;
  city: string;
  state: string;
  country: string;
  approximateLocation: string;
  maxGuests: number;
  hourlyPrice: number | null;
  overnightPrice: number | null;
  fullDayPrice: number | null;
  cleaningFee: number;
  minimumHours: number;
  privacyScore: number;
  instantBooking: boolean;
  creatorFriendly: boolean;
  groupFriendly: boolean;
  eventsAllowed: boolean;
  featured: boolean;
  publishedAt: string | null;
  ratingAverage: number;
  reviewCount: number;
  coverPhoto: string;
  amenities: SpaceAmenity[];
  allowedUses: SpaceAllowedUse[];
};

export type SpaceDetailData = SpaceCardData & {
  description: string;
  photos: SpacePhoto[];
  rules: SpaceRule[];
  cancellationPolicy: string;
  checkInNotes: string;
  minimumBookingNoticeMinutes: number;
  bufferMinutes: number;
  host: PublicHost;
  reviews: PublicReview[];
};

export type SpaceSearchResult = {
  spaces: SpaceCardData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ReservationSelection = {
  date: string;
  start: string;
  duration: number;
  guests: number;
  mode: BookingMode;
};

export type PriceEstimate = {
  rate: number;
  baseAmount: number;
  cleaningFee: number;
  serviceFee: number;
  total: number;
  serviceFeePercent: number;
};

export type AvailabilityResult = {
  available: boolean;
  reason: "available" | "conflict" | "capacity" | "notice" | "invalid";
  message: string;
};
