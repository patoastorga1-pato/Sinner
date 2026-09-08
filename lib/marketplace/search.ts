import {
  SORT_OPTIONS,
  SPACE_TYPES,
  type RawSearchParams,
  type SortOption,
  type ReservationSelection,
  type SpaceSearchQuery,
  type SpaceType,
} from "@/lib/types/marketplace";

const ALLOWED_USE_PARAMS: Record<string, string> = {
  photography: "photography",
  video: "video_recording",
  commercialContent: "commercial_content",
  groups: "groups",
  events: "events",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parseReservationParams(raw: RawSearchParams, minimumHours = 1): ReservationSelection {
  const rawMode = first(raw.mode);
  const mode = rawMode === "overnight" || rawMode === "full-day" ? rawMode : "hourly";
  return {
    date: validDate(first(raw.date)),
    start: validTime(first(raw.start)) || "20:00",
    duration: mode === "overnight" ? 12 : mode === "full-day" ? 24 : number(raw.duration, Math.max(4, minimumHours), minimumHours, 24),
    guests: Math.floor(number(raw.guests, 2, 1, 30)),
    mode,
  };
}

function list(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return Array.from(new Set(values.flatMap((item) => item.split(",")).map((item) => item.trim()).filter(Boolean)));
}

function number(value: string | string[] | undefined, fallback: number, min: number, max: number) {
  const raw = first(value);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function optionalNumber(value: string | string[] | undefined, min: number, max: number) {
  const raw = first(value);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : null;
}

function boolean(value: string | string[] | undefined) {
  return ["true", "1", "on", "yes"].includes(first(value).toLowerCase());
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "" : value;
}

function validTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : "";
}

export function getLocalDateInputValue(date = new Date(), timezone = "America/Mexico_City") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function parseSpaceSearchParams(raw: RawSearchParams): SpaceSearchQuery {
  const rawType = first(raw.type);
  const type = SPACE_TYPES.some((item) => item.value === rawType) ? (rawType as SpaceType) : "";
  const rawSort = first(raw.sort);
  const sort = SORT_OPTIONS.some((item) => item.value === rawSort) ? (rawSort as SortOption) : "recommended";
  const allowedUses = Object.entries(ALLOWED_USE_PARAMS)
    .filter(([parameter]) => boolean(raw[parameter]))
    .map(([, slug]) => slug);

  return {
    location: first(raw.location).trim().slice(0, 120),
    date: validDate(first(raw.date)),
    start: validTime(first(raw.start)),
    duration: number(raw.duration, 4, 1, 24),
    guests: number(raw.guests, 2, 1, 30),
    minPrice: optionalNumber(raw.minPrice, 0, 1_000_000),
    maxPrice: optionalNumber(raw.maxPrice, 0, 1_000_000),
    privacy: optionalNumber(raw.privacy, 0, 10),
    type,
    amenities: list(raw.amenities),
    allowedUses,
    creatorFriendly: boolean(raw.creatorFriendly),
    groupFriendly: boolean(raw.groupFriendly),
    eventsAllowed: boolean(raw.eventsAllowed),
    instantBooking: boolean(raw.instantBooking),
    sort,
    page: Math.floor(number(raw.page, 1, 1, 10_000)),
  };
}

export function searchQueryToParams(query: SpaceSearchQuery, includePage = true) {
  const params = new URLSearchParams();
  if (query.location) params.set("location", query.location);
  if (query.date) params.set("date", query.date);
  if (query.start) params.set("start", query.start);
  if (query.duration !== 4) params.set("duration", String(query.duration));
  if (query.guests !== 2) params.set("guests", String(query.guests));
  if (query.minPrice !== null) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== null) params.set("maxPrice", String(query.maxPrice));
  if (query.privacy !== null) params.set("privacy", String(query.privacy));
  if (query.type) params.set("type", query.type);
  query.amenities.forEach((amenity) => params.append("amenities", amenity));
  if (query.creatorFriendly) params.set("creatorFriendly", "true");
  if (query.groupFriendly) params.set("groupFriendly", "true");
  if (query.eventsAllowed) params.set("eventsAllowed", "true");
  if (query.instantBooking) params.set("instantBooking", "true");
  for (const [parameter, slug] of Object.entries(ALLOWED_USE_PARAMS)) {
    if (query.allowedUses.includes(slug)) params.set(parameter, "true");
  }
  if (query.sort !== "recommended") params.set("sort", query.sort);
  if (includePage && query.page > 1) params.set("page", String(query.page));
  return params;
}

export function hasActiveFilters(query: SpaceSearchQuery) {
  return Boolean(
    query.location ||
      query.date ||
      query.start ||
      query.guests !== 2 ||
      query.minPrice !== null ||
      query.maxPrice !== null ||
      query.privacy !== null ||
      query.type ||
      query.amenities.length ||
      query.allowedUses.length ||
      query.creatorFriendly ||
      query.groupFriendly ||
      query.eventsAllowed ||
      query.instantBooking,
  );
}
