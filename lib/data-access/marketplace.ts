import { events as developmentEvents, experiences as developmentExperiences } from "@/lib/data";
import { developmentSpaces, getDevelopmentAvailabilityBlocks } from "@/lib/marketplace/fixtures";
import { getStartingPrice } from "@/lib/marketplace/pricing";
import { createClient, hasSupabaseAuthCookie } from "@/lib/supabase/server";
import type {
  AvailabilityResult,
  PublicHost,
  PublicReview,
  ReservationSelection,
  SpaceAllowedUse,
  SpaceAmenity,
  SpaceCardData,
  SpaceDetailData,
  SpacePhoto,
  SpaceRule,
  SpaceSearchQuery,
  SpaceSearchResult,
} from "@/lib/types/marketplace";

type Experience = (typeof developmentExperiences)[number];
type Event = (typeof developmentEvents)[number];
type UnknownRow = Record<string, unknown>;

const PAGE_SIZE = 6;
const DEFAULT_PHOTO = "/images/hero-sinner-night.png";

function shouldUseDevelopmentFallback() {
  return process.env.NODE_ENV !== "production";
}

function shouldUseDevelopmentFixtures() {
  return shouldUseDevelopmentFallback() && process.env.SINNER_USE_DEVELOPMENT_FIXTURES === "true";
}

function asRows(value: unknown): UnknownRow[] {
  return Array.isArray(value) ? (value as UnknownRow[]) : [];
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
  if (/^https?:\/\//i.test(path)) {
    return path.includes("images.unsplash.com") && !path.includes("?")
      ? `${path}?auto=format&fit=crop&w=1600&q=84`
      : path;
  }
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return baseUrl ? `${baseUrl}/storage/v1/object/public/space-photos/${path.replace(/^\//, "")}` : DEFAULT_PHOTO;
}

function mapRpcCard(row: UnknownRow): SpaceCardData {
  const amenitySlugs = asStringArray(row.amenity_slugs);
  const amenityNames = asStringArray(row.amenity_names);
  const amenityCategories = asStringArray(row.amenity_categories);
  const amenityIcons = asStringArray(row.amenity_icons);
  const allowedUseSlugs = asStringArray(row.allowed_use_slugs);
  const allowedUseNames = asStringArray(row.allowed_use_names);

  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    shortDescription: String(row.short_description ?? "A private SINNER space with clear host rules."),
    spaceType: String(row.space_type ?? "Other"),
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    country: String(row.country ?? "Mexico"),
    approximateLocation: String(row.approximate_location ?? [row.city, row.state].filter(Boolean).join(", ")),
    maxGuests: asNumber(row.max_guests, 1),
    hourlyPrice: asNullableNumber(row.hourly_price),
    overnightPrice: asNullableNumber(row.overnight_price),
    fullDayPrice: asNullableNumber(row.full_day_price),
    cleaningFee: asNumber(row.cleaning_fee),
    minimumHours: asNumber(row.minimum_hours, 1),
    privacyScore: asNumber(row.privacy_score),
    instantBooking: Boolean(row.instant_booking),
    creatorFriendly: Boolean(row.creator_friendly),
    groupFriendly: Boolean(row.group_friendly),
    eventsAllowed: Boolean(row.events_allowed),
    featured: Boolean(row.featured),
    publishedAt: row.published_at ? String(row.published_at) : null,
    ratingAverage: asNumber(row.rating_average),
    reviewCount: asNumber(row.review_count),
    coverPhoto: resolvePhotoUrl(row.cover_photo),
    amenities: amenitySlugs.map((slug, index) => ({
      slug,
      name: amenityNames[index] ?? slug,
      category: amenityCategories[index] ?? "general",
      iconName: amenityIcons[index] ?? null,
    })),
    allowedUses: allowedUseSlugs.map((slug, index) => ({
      slug,
      name: allowedUseNames[index] ?? slug,
      allowed: true,
      details: null,
    })),
  };
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function normalizeSpaceType(value: string) {
  const normalized = normalize(value).replace(/\s+/g, "-");
  return ["private-suite", "apartment", "villa", "studio", "playroom", "venue"].includes(normalized)
    ? normalized
    : "other";
}

function developmentConflict(
  space: SpaceDetailData,
  selection: Pick<ReservationSelection, "date" | "start" | "duration">,
) {
  if (!selection.date || !selection.start) return false;
  const requestedStart = new Date(`${selection.date}T${selection.start}:00`);
  const requestedEnd = new Date(requestedStart.getTime() + selection.duration * 60 * 60 * 1000);
  const bufferMs = space.bufferMinutes * 60 * 1000;

  return getDevelopmentAvailabilityBlocks()
    .filter((block) => block.spaceId === space.id && block.date === selection.date)
    .some((block) => {
      const start = new Date(`${block.date}T${block.start}:00`);
      const end = new Date(`${block.date}T${block.end}:00`);
      if (end <= start) end.setDate(end.getDate() + 1);
      return requestedStart.getTime() < end.getTime() + bufferMs && requestedEnd.getTime() > start.getTime() - bufferMs;
    });
}

function searchDevelopmentSpaces(query: SpaceSearchQuery): SpaceSearchResult {
  const location = normalize(query.location);
  const filtered = developmentSpaces.filter((space) => {
    const startingPrice = getStartingPrice(space);
    const searchableLocation = normalize(`${space.city} ${space.state} ${space.country} ${space.approximateLocation}`);
    if (location && !searchableLocation.includes(location)) return false;
    if (space.maxGuests < query.guests) return false;
    if (query.minPrice !== null && (!startingPrice || startingPrice.value < query.minPrice)) return false;
    if (query.maxPrice !== null && (!startingPrice || startingPrice.value > query.maxPrice)) return false;
    if (query.privacy !== null && space.privacyScore < query.privacy) return false;
    if (query.type && normalizeSpaceType(space.spaceType) !== query.type) return false;
    if (query.amenities.some((slug) => !space.amenities.some((amenity) => amenity.slug === slug))) return false;
    if (query.allowedUses.some((slug) => !space.allowedUses.some((use) => use.slug === slug && use.allowed))) return false;
    if (query.creatorFriendly && !space.creatorFriendly) return false;
    if (query.groupFriendly && !space.groupFriendly) return false;
    if (query.eventsAllowed && !space.eventsAllowed) return false;
    if (query.instantBooking && !space.instantBooking) return false;
    if (query.date && query.start && developmentConflict(space, query)) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (query.sort === "rating") return b.ratingAverage - a.ratingAverage || b.reviewCount - a.reviewCount;
    if (query.sort === "privacy") return b.privacyScore - a.privacyScore;
    if (query.sort === "price-asc" || query.sort === "price-desc") {
      const aPrice = getStartingPrice(a)?.value ?? Number.MAX_SAFE_INTEGER;
      const bPrice = getStartingPrice(b)?.value ?? Number.MAX_SAFE_INTEGER;
      return query.sort === "price-asc" ? aPrice - bPrice : bPrice - aPrice;
    }
    if (query.sort === "newest") return String(b.publishedAt).localeCompare(String(a.publishedAt));
    return Number(b.featured) - Number(a.featured) || b.ratingAverage - a.ratingAverage || b.privacyScore - a.privacyScore || a.slug.localeCompare(b.slug);
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * PAGE_SIZE;
  return { spaces: filtered.slice(start, start + PAGE_SIZE), total, page, pageSize: PAGE_SIZE, totalPages };
}

export async function searchSpaces(query: SpaceSearchQuery): Promise<SpaceSearchResult> {
  if (shouldUseDevelopmentFixtures()) return searchDevelopmentSpaces(query);
  const supabase = await createClient();
  if (!supabase) return searchDevelopmentSpaces(query);

  const { data, error } = await supabase.rpc("search_public_spaces", {
    p_location: query.location || null,
    p_date: query.date || null,
    p_start: query.start || null,
    p_duration_hours: query.duration,
    p_guests: query.guests,
    p_min_price: query.minPrice,
    p_max_price: query.maxPrice,
    p_privacy: query.privacy,
    p_space_type: query.type || null,
    p_amenity_slugs: query.amenities,
    p_allowed_use_slugs: query.allowedUses,
    p_creator_friendly: query.creatorFriendly,
    p_group_friendly: query.groupFriendly,
    p_events_allowed: query.eventsAllowed,
    p_instant_booking: query.instantBooking,
    p_sort: query.sort,
    p_page: query.page,
    p_page_size: PAGE_SIZE,
  });

  if (error) {
    if (shouldUseDevelopmentFallback()) return searchDevelopmentSpaces(query);
    throw new Error(`Unable to search spaces: ${error.message}`);
  }

  const rows = asRows(data);
  const total = rows.length ? asNumber(rows[0].total_count) : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return {
    spaces: rows.map(mapRpcCard),
    total,
    page: Math.min(query.page, totalPages),
    pageSize: PAGE_SIZE,
    totalPages,
  };
}

export async function getFeaturedSpaces(limit = 3) {
  const result = await searchSpaces({
    location: "",
    date: "",
    start: "",
    duration: 4,
    guests: 2,
    minPrice: null,
    maxPrice: null,
    privacy: null,
    type: "",
    amenities: [],
    allowedUses: [],
    creatorFriendly: false,
    groupFriendly: false,
    eventsAllowed: false,
    instantBooking: false,
    sort: "recommended",
    page: 1,
  });
  return result.spaces.slice(0, limit);
}

export async function getSpaces() {
  return getFeaturedSpaces(3);
}

function mapNestedAmenity(row: UnknownRow): SpaceAmenity | null {
  const value = row.amenities;
  const amenity = Array.isArray(value) ? (value[0] as UnknownRow | undefined) : (value as UnknownRow | undefined);
  if (!amenity) return null;
  return {
    name: String(amenity.name),
    slug: String(amenity.slug),
    category: String(amenity.category ?? "general"),
    iconName: amenity.icon_name ? String(amenity.icon_name) : null,
  };
}

function mapNestedAllowedUse(row: UnknownRow): SpaceAllowedUse | null {
  const value = row.allowed_uses;
  const use = Array.isArray(value) ? (value[0] as UnknownRow | undefined) : (value as UnknownRow | undefined);
  if (!use) return null;
  return {
    name: String(use.name),
    slug: String(use.slug),
    allowed: Boolean(row.allowed),
    details: row.details ? String(row.details) : null,
  };
}

function mapRules(value: unknown, maxGuests: number): SpaceRule[] {
  if (Array.isArray(value)) {
    const rules = value
      .filter((item): item is UnknownRow => Boolean(item) && typeof item === "object")
      .map((item, index) => ({
        key: String(item.key ?? `rule-${index + 1}`),
        label: String(item.label ?? "House rule"),
        detail: String(item.detail ?? "Review with the host before arrival."),
        ...(typeof item.allowed === "boolean" ? { allowed: item.allowed } : {}),
      }));
    if (rules.length) return rules;
  }
  return [
    { key: "guests", label: "Maximum guests", detail: `Up to ${maxGuests} registered guests` },
    { key: "smoking", label: "Smoking", detail: "Confirm the host policy before booking" },
    { key: "noise", label: "Noise", detail: "Keep sound within the private space" },
  ];
}

async function fetchSpaceDetail(field: "slug" | "id", value: string): Promise<SpaceDetailData | null> {
  const fixture = developmentSpaces.find((space) => space[field] === value) ?? null;
  if (shouldUseDevelopmentFixtures()) return fixture;
  const supabase = await createClient();
  if (!supabase) return fixture;

  const detailSelect = `
    id,host_id,name,slug,short_description,description,space_type,city,state,country,approximate_location,
    max_guests,hourly_price,overnight_price,full_day_price,cleaning_fee,minimum_hours,privacy_score,
    instant_booking,creator_friendly,group_friendly,events_allowed,featured,published_at,rating_average,review_count,
    cancellation_policy,check_in_notes,minimum_booking_notice_minutes,buffer_minutes,house_rules,
    space_photos(id,storage_path,sort_order,is_cover,alt_text),
    space_amenities(amenities(name,slug,category,icon_name)),
    space_allowed_uses(allowed,details,allowed_uses(name,slug))
  `;
  const { data, error } = await supabase
    .from("spaces")
    .select(detailSelect)
    .eq(field, value)
    .eq("status", "approved")
    .maybeSingle();

  if (error) {
    if (shouldUseDevelopmentFallback()) return fixture;
    throw new Error(`Unable to load space: ${error.message}`);
  }
  if (!data) return null;

  const row = data as UnknownRow;
  const photoRows = asRows(row.space_photos).sort((a, b) => asNumber(a.sort_order) - asNumber(b.sort_order));
  const photos: SpacePhoto[] = photoRows.map((photo) => ({
    id: String(photo.id),
    url: resolvePhotoUrl(photo.storage_path),
    sortOrder: asNumber(photo.sort_order),
    isCover: Boolean(photo.is_cover),
    altText: photo.alt_text ? String(photo.alt_text) : null,
  }));
  const amenityRows = asRows(row.space_amenities);
  const allowedUseRows = asRows(row.space_allowed_uses);
  const hostId = row.host_id ? String(row.host_id) : null;

  const [hostResult, reviewsResult] = await Promise.all([
    hostId
      ? supabase.from("public_host_profiles").select("id,display_name,avatar_url,is_verified,created_at,host_rating").eq("id", hostId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("public_space_reviews")
      .select("id,space_id,overall_rating,comment,created_at,author_display_name,author_avatar_url")
      .eq("space_id", String(row.id))
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const hostRow = hostResult.data as UnknownRow | null;
  const host: PublicHost = hostRow
    ? {
        id: String(hostRow.id),
        displayName: String(hostRow.display_name ?? "SINNER host"),
        avatarUrl: hostRow.avatar_url ? String(hostRow.avatar_url) : null,
        verified: Boolean(hostRow.is_verified),
        memberSince: hostRow.created_at ? String(hostRow.created_at) : null,
        rating: asNullableNumber(hostRow.host_rating),
      }
    : { id: hostId, displayName: "SINNER partner", avatarUrl: null, verified: false, memberSince: null, rating: null };
  const reviews: PublicReview[] = asRows(reviewsResult.data).map((review) => ({
    id: String(review.id),
    rating: asNumber(review.overall_rating),
    comment: review.comment ? String(review.comment) : null,
    createdAt: String(review.created_at),
    authorName: String(review.author_display_name ?? "Verified guest"),
    authorAvatar: review.author_avatar_url ? String(review.author_avatar_url) : null,
  }));
  const maxGuests = asNumber(row.max_guests, 1);
  const cover = photos.find((photo) => photo.isCover) ?? photos[0];

  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    shortDescription: String(row.short_description ?? "A private SINNER space with clear host rules."),
    description: String(row.description ?? "A private SINNER space with discreet access and clear host rules."),
    spaceType: String(row.space_type ?? "Other"),
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    country: String(row.country ?? "Mexico"),
    approximateLocation: String(row.approximate_location ?? [row.city, row.state].filter(Boolean).join(", ")),
    maxGuests,
    hourlyPrice: asNullableNumber(row.hourly_price),
    overnightPrice: asNullableNumber(row.overnight_price),
    fullDayPrice: asNullableNumber(row.full_day_price),
    cleaningFee: asNumber(row.cleaning_fee),
    minimumHours: asNumber(row.minimum_hours, 1),
    privacyScore: asNumber(row.privacy_score),
    instantBooking: Boolean(row.instant_booking),
    creatorFriendly: Boolean(row.creator_friendly),
    groupFriendly: Boolean(row.group_friendly),
    eventsAllowed: Boolean(row.events_allowed),
    featured: Boolean(row.featured),
    publishedAt: row.published_at ? String(row.published_at) : null,
    ratingAverage: asNumber(row.rating_average),
    reviewCount: asNumber(row.review_count),
    coverPhoto: cover?.url ?? DEFAULT_PHOTO,
    photos: photos.length ? photos : [{ id: `${row.id}-placeholder`, url: DEFAULT_PHOTO, sortOrder: 0, isCover: true, altText: `${row.name} placeholder` }],
    amenities: amenityRows.map(mapNestedAmenity).filter((item): item is SpaceAmenity => Boolean(item)),
    allowedUses: allowedUseRows.map(mapNestedAllowedUse).filter((item): item is SpaceAllowedUse => Boolean(item)),
    rules: mapRules(row.house_rules, maxGuests),
    cancellationPolicy: String(row.cancellation_policy ?? "Review the cancellation terms before continuing."),
    checkInNotes: String(row.check_in_notes ?? "Access details are shared only after a reservation is confirmed."),
    minimumBookingNoticeMinutes: asNumber(row.minimum_booking_notice_minutes),
    bufferMinutes: asNumber(row.buffer_minutes),
    host,
    reviews,
  };
}

export function getSpaceBySlug(slug: string) {
  return fetchSpaceDetail("slug", slug);
}

export function getSpaceById(id: string) {
  return fetchSpaceDetail("id", id);
}

export async function getSpaceAmenities(spaceId: string) {
  return (await getSpaceById(spaceId))?.amenities ?? [];
}

export async function getSpaceAllowedUses(spaceId: string) {
  return (await getSpaceById(spaceId))?.allowedUses ?? [];
}

export async function getRelatedSpaces(space: SpaceDetailData, limit = 3) {
  const result = await searchSpaces({
    location: space.city,
    date: "",
    start: "",
    duration: 4,
    guests: 1,
    minPrice: null,
    maxPrice: null,
    privacy: null,
    type: "",
    amenities: [],
    allowedUses: [],
    creatorFriendly: false,
    groupFriendly: false,
    eventsAllowed: false,
    instantBooking: false,
    sort: "recommended",
    page: 1,
  });
  const nearby = result.spaces.filter((candidate) => candidate.id !== space.id);
  if (nearby.length >= limit) return nearby.slice(0, limit);

  const broaderResult = await searchSpaces({
    location: "",
    date: "",
    start: "",
    duration: 4,
    guests: 1,
    minPrice: null,
    maxPrice: null,
    privacy: null,
    type: "",
    amenities: [],
    allowedUses: [],
    creatorFriendly: false,
    groupFriendly: false,
    eventsAllowed: false,
    instantBooking: false,
    sort: "privacy",
    page: 1,
  });
  return [...nearby, ...broaderResult.spaces]
    .filter((candidate, index, candidates) => candidate.id !== space.id && candidates.findIndex((item) => item.id === candidate.id) === index)
    .slice(0, limit);
}

function invalidAvailability(message: string): AvailabilityResult {
  return { available: false, reason: "invalid", message };
}

export async function getSpaceAvailability(spaceId: string, selection: ReservationSelection): Promise<AvailabilityResult> {
  const space = await getSpaceById(spaceId);
  if (!space) return invalidAvailability("This space is not available.");
  if (selection.guests > space.maxGuests) {
    return { available: false, reason: "capacity", message: `This space allows up to ${space.maxGuests} guests.` };
  }
  if (!selection.date || !selection.start || selection.duration < space.minimumHours) {
    return invalidAvailability(`Choose a date, start time and at least ${space.minimumHours} hours.`);
  }

  const requestedStart = new Date(`${selection.date}T${selection.start}:00`);
  if (Number.isNaN(requestedStart.getTime())) return invalidAvailability("Choose a valid date and start time.");
  if (requestedStart.getTime() < Date.now() + space.minimumBookingNoticeMinutes * 60 * 1000) {
    return { available: false, reason: "notice", message: "This start time does not meet the host's minimum notice." };
  }

  const supabase = shouldUseDevelopmentFixtures() ? null : await createClient();
  if (supabase) {
    const { data, error } = await supabase.rpc("check_space_availability", {
      p_space_id: spaceId,
      p_date: selection.date,
      p_start: selection.start,
      p_duration_hours: selection.duration,
      p_guests: selection.guests,
    });
    if (!error) {
      return data
        ? { available: true, reason: "available", message: "This time is available." }
        : { available: false, reason: "conflict", message: "This time is not available." };
    }
    if (!shouldUseDevelopmentFallback()) throw new Error(`Unable to check availability: ${error.message}`);
  }

  return developmentConflict(space, selection)
    ? { available: false, reason: "conflict", message: "This time is not available." }
    : { available: true, reason: "available", message: "This time is available." };
}

function formatEventMoney(value: number | null, currency = "MXN") {
  if (value === null) return "Request quote";
  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  return currency === "MXN" ? `${formatted} MXN` : formatted;
}

export async function getExperiences(): Promise<Experience[]> {
  if (shouldUseDevelopmentFixtures()) return developmentExperiences;
  const supabase = await createClient();
  if (!supabase) return developmentExperiences;
  const { data, error } = await supabase.from("experiences").select("id,name,slug,description").eq("status", "approved").order("created_at", { ascending: false });
  if (error || (!data?.length && shouldUseDevelopmentFallback())) return developmentExperiences;
  return (data ?? []).map((row) => {
    const fallback = developmentExperiences.find((item) => item.slug === row.slug);
    return { id: String(row.id), slug: String(row.slug), name: String(row.name), description: String(row.description ?? "A private SINNER experience."), image: fallback?.image ?? "/images/experience-sensory.png" };
  });
}

export async function getEvents(): Promise<Event[]> {
  if (shouldUseDevelopmentFixtures()) return developmentEvents;
  const supabase = await createClient();
  if (!supabase) return developmentEvents;
  const { data, error } = await supabase.from("events").select("id,name,slug,description,city,event_date,ticket_price,currency,visibility").eq("status", "approved").order("event_date", { ascending: true });
  if (error || (!data?.length && shouldUseDevelopmentFallback())) return developmentEvents;
  return (data ?? []).map((row) => {
    const fallback = developmentEvents.find((item) => item.slug === row.slug);
    const eventDate = new Date(`${row.event_date}T00:00:00`);
    return {
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      date: Number.isNaN(eventDate.getTime()) ? String(row.event_date) : eventDate.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      city: String(row.city),
      type: fallback?.type ?? "Adult Experience",
      price: `From ${formatEventMoney(row.ticket_price === null ? null : Number(row.ticket_price), String(row.currency ?? "MXN"))}`,
      availability: fallback?.availability ?? "Open",
      badge: row.visibility === "invite_only" ? "Invite Only" : fallback?.badge ?? "Verified Event",
      image: fallback?.image ?? DEFAULT_PHOTO,
    };
  });
}

export async function getFavoriteSpaceIds() {
  if (!(await hasSupabaseAuthCookie())) return { authenticated: false, ids: [] as string[] };
  const supabase = await createClient();
  if (!supabase) return { authenticated: false, ids: [] as string[] };
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { authenticated: false, ids: [] as string[] };
  const { data } = await supabase.from("favorites").select("space_id").eq("user_id", userData.user.id);
  return { authenticated: true, ids: (data ?? []).map((favorite) => String(favorite.space_id)) };
}

export async function getFavoriteSpaces() {
  const { ids } = await getFavoriteSpaceIds();
  if (!ids.length) return [];
  const fixtureMatches = developmentSpaces.filter((space) => ids.includes(space.id));
  const supabase = await createClient();
  if (!supabase) return fixtureMatches;
  const spaces = await Promise.all(ids.slice(0, 50).map((id) => getSpaceById(id)));
  const matches = spaces.filter((space): space is SpaceDetailData => Boolean(space));
  return matches.length || !shouldUseDevelopmentFallback() ? matches : fixtureMatches;
}
