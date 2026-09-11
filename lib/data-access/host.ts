import { createClient } from "@/lib/supabase/server";
import type { ListingStatus, PayoutRecord, SpaceStatus } from "@/lib/types/database";

type UnknownRow = Record<string, unknown>;

const DEFAULT_PHOTO = "/images/hero-sinner-night.png";

function asRows(value: unknown): UnknownRow[] {
  return Array.isArray(value) ? (value as UnknownRow[]) : [];
}

function asObject(value: unknown): UnknownRow | null {
  if (!value || typeof value !== "object") return null;
  return Array.isArray(value) ? ((value[0] as UnknownRow | undefined) ?? null) : (value as UnknownRow);
}

function asNumber(value: unknown, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function asNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function resolvePhotoUrl(storagePath: unknown) {
  const path = String(storagePath ?? "").trim();
  if (!path) return DEFAULT_PHOTO;
  if (/^https?:\/\//i.test(path)) return path.includes("images.unsplash.com") && !path.includes("?") ? `${path}?auto=format&fit=crop&w=1200&q=84` : path;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return baseUrl ? `${baseUrl}/storage/v1/object/public/space-photos/${path.replace(/^\//, "")}` : DEFAULT_PHOTO;
}

export type HostCatalogOption = {
  id: string;
  name: string;
  slug: string;
  category?: string;
};

export type HostListing = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  spaceType: string;
  status: SpaceStatus;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  stateCode: string | null;
  municipality: string | null;
  locality: string | null;
  approximateLocation: string | null;
  timezone: string;
  maxGuests: number;
  hourlyPrice: number | null;
  overnightPrice: number | null;
  fullDayPrice: number | null;
  cleaningFee: number;
  minimumHours: number;
  privacyScore: number | null;
  instantBooking: boolean;
  creatorFriendly: boolean;
  groupFriendly: boolean;
  eventsAllowed: boolean;
  featured: boolean;
  ratingAverage: number;
  reviewCount: number;
  cancellationPolicy: string | null;
  checkInNotes: string | null;
  minimumBookingNoticeMinutes: number;
  bufferMinutes: number;
  rules: string[];
  amenityIds: string[];
  allowedUseIds: string[];
  coverPhoto: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type HostEarningSummary = {
  payouts: PayoutRecord[];
  pending: number;
  available: number;
  paid: number;
  currency: string;
};

const listingSelect = `
  id,name,slug,short_description,description,space_type,status,city,state,country,country_code,state_code,
  municipality,locality,approximate_location,timezone,max_guests,hourly_price,overnight_price,full_day_price,
  cleaning_fee,minimum_hours,privacy_score,instant_booking,creator_friendly,group_friendly,events_allowed,
  featured,rating_average,review_count,cancellation_policy,check_in_notes,minimum_booking_notice_minutes,
  buffer_minutes,house_rules,created_at,updated_at,published_at,
  space_photos(id,storage_path,sort_order,is_cover),
  space_amenities(amenity_id,amenities(id,name,slug,category)),
  space_allowed_uses(allowed_use_id,allowed,allowed_uses(id,name,slug))
`;

function mapListing(row: UnknownRow): HostListing {
  const photos = asRows(row.space_photos).sort((a, b) => asNumber(a.sort_order) - asNumber(b.sort_order));
  const cover = photos.find((photo) => Boolean(photo.is_cover)) ?? photos[0];
  const amenityRows = asRows(row.space_amenities);
  const useRows = asRows(row.space_allowed_uses).filter((item) => Boolean(item.allowed));
  const houseRules = asRows(row.house_rules).map((rule, index) => String(rule.detail ?? rule.label ?? `Rule ${index + 1}`));

  return {
    id: String(row.id),
    name: String(row.name ?? "Untitled space"),
    slug: String(row.slug ?? ""),
    shortDescription: row.short_description ? String(row.short_description) : null,
    description: row.description ? String(row.description) : null,
    spaceType: String(row.space_type ?? "other"),
    status: String(row.status ?? "draft") as SpaceStatus,
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    country: String(row.country ?? "Mexico"),
    countryCode: String(row.country_code ?? "MX"),
    stateCode: row.state_code ? String(row.state_code) : null,
    municipality: row.municipality ? String(row.municipality) : null,
    locality: row.locality ? String(row.locality) : null,
    approximateLocation: row.approximate_location ? String(row.approximate_location) : null,
    timezone: String(row.timezone ?? "America/Mexico_City"),
    maxGuests: asNumber(row.max_guests, 1),
    hourlyPrice: asNullableNumber(row.hourly_price),
    overnightPrice: asNullableNumber(row.overnight_price),
    fullDayPrice: asNullableNumber(row.full_day_price),
    cleaningFee: asNumber(row.cleaning_fee),
    minimumHours: asNumber(row.minimum_hours, 1),
    privacyScore: asNullableNumber(row.privacy_score),
    instantBooking: Boolean(row.instant_booking),
    creatorFriendly: Boolean(row.creator_friendly),
    groupFriendly: Boolean(row.group_friendly),
    eventsAllowed: Boolean(row.events_allowed),
    featured: Boolean(row.featured),
    ratingAverage: asNumber(row.rating_average),
    reviewCount: asNumber(row.review_count),
    cancellationPolicy: row.cancellation_policy ? String(row.cancellation_policy) : null,
    checkInNotes: row.check_in_notes ? String(row.check_in_notes) : null,
    minimumBookingNoticeMinutes: asNumber(row.minimum_booking_notice_minutes, 120),
    bufferMinutes: asNumber(row.buffer_minutes, 30),
    rules: houseRules,
    amenityIds: amenityRows.map((item) => String(item.amenity_id)).filter(Boolean),
    allowedUseIds: useRows.map((item) => String(item.allowed_use_id)).filter(Boolean),
    coverPhoto: resolvePhotoUrl(cover?.storage_path),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    publishedAt: row.published_at ? String(row.published_at) : null,
  };
}

export async function getHostListings(): Promise<HostListing[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data } = await supabase
    .from("spaces")
    .select(listingSelect)
    .eq("host_id", userData.user.id)
    .order("created_at", { ascending: false });

  return asRows(data).map(mapListing);
}

export async function getHostListing(id: string): Promise<HostListing | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data } = await supabase
    .from("spaces")
    .select(listingSelect)
    .eq("id", id)
    .eq("host_id", userData.user.id)
    .maybeSingle();

  return data ? mapListing(data as UnknownRow) : null;
}

export async function getHostListingCatalog() {
  const supabase = await createClient();
  if (!supabase) return { amenities: [] as HostCatalogOption[], allowedUses: [] as HostCatalogOption[] };

  const [amenitiesResult, usesResult] = await Promise.all([
    supabase.from("amenities").select("id,name,slug,category").order("category", { ascending: true }).order("name", { ascending: true }),
    supabase.from("allowed_uses").select("id,name,slug").order("name", { ascending: true }),
  ]);

  return {
    amenities: asRows(amenitiesResult.data).map((item) => ({
      id: String(item.id),
      name: String(item.name),
      slug: String(item.slug),
      category: item.category ? String(item.category) : undefined,
    })),
    allowedUses: asRows(usesResult.data).map((item) => ({
      id: String(item.id),
      name: String(item.name),
      slug: String(item.slug),
    })),
  };
}

export async function getHostEarnings(): Promise<HostEarningSummary> {
  const supabase = await createClient();
  if (!supabase) return { payouts: [], pending: 0, available: 0, paid: 0, currency: "MXN" };
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { payouts: [], pending: 0, available: 0, paid: 0, currency: "MXN" };

  const { data } = await supabase
    .from("payout_records")
    .select("id,host_id,payment_id,status,gross_amount,platform_fee,net_amount,currency,paid_at,metadata,created_at,updated_at")
    .eq("host_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const payouts = (data ?? []) as PayoutRecord[];
  return payouts.reduce<HostEarningSummary>(
    (summary, payout) => ({
      payouts: summary.payouts,
      pending: summary.pending + (payout.status === "pending" ? Number(payout.net_amount) : 0),
      available: summary.available + (payout.status === "available" ? Number(payout.net_amount) : 0),
      paid: summary.paid + (payout.status === "paid" ? Number(payout.net_amount) : 0),
      currency: payout.currency || summary.currency,
    }),
    { payouts, pending: 0, available: 0, paid: 0, currency: payouts[0]?.currency ?? "MXN" },
  );
}

export function listingStatusLabel(status: ListingStatus | SpaceStatus) {
  return status.replace(/_/g, " ");
}
