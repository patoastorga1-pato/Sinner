import { createClient } from "@/lib/supabase/server";
import { bookingErrorMessage } from "@/lib/bookings/errors";
import { toAppBookingStatus, type AppBookingStatus, type BookingType } from "@/lib/bookings/constants";

type UnknownRow = Record<string, unknown>;

const DEFAULT_PHOTO = "/images/hero-sinner-night.png";

export type BookingSpaceSummary = {
  id: string;
  slug: string;
  name: string;
  approximateLocation: string;
  timezone: string;
  coverPhoto: string;
  hostId: string | null;
  hostName: string;
};

export type BookingCard = {
  id: string;
  bookingReference: string;
  status: AppBookingStatus;
  bookingType: BookingType;
  startDatetime: string;
  endDatetime: string;
  timezone: string;
  durationHours: number;
  guestCount: number;
  hourlyRateSnapshot: number;
  baseAmount: number;
  cleaningFee: number;
  serviceFee: number;
  totalAmount: number;
  currency: string;
  holdExpiresAt: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  guestMessage: string | null;
  createdAt: string;
  space: BookingSpaceSummary;
  guestDisplayName?: string;
};

export type BookingEvent = {
  id: string;
  eventType: string;
  fromStatus: AppBookingStatus | null;
  toStatus: AppBookingStatus | null;
  createdAt: string;
};

export type BookingDetail = BookingCard & {
  rulesAcceptedAt: string | null;
  events: BookingEvent[];
};

export type HostAvailabilityBlock = {
  id: string;
  spaceName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "available" | "blocked" | "reserved";
};

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

function resolvePhotoUrl(storagePath: unknown) {
  const path = String(storagePath ?? "").trim();
  if (!path) return DEFAULT_PHOTO;
  if (/^https?:\/\//i.test(path)) return path.includes("images.unsplash.com") && !path.includes("?") ? `${path}?auto=format&fit=crop&w=1600&q=84` : path;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return baseUrl ? `${baseUrl}/storage/v1/object/public/space-photos/${path.replace(/^\//, "")}` : DEFAULT_PHOTO;
}

function mapSpace(value: unknown): BookingSpaceSummary {
  const row = asObject(value) ?? {};
  const photos = asRows(row.space_photos);
  const cover = photos.find((photo) => Boolean(photo.is_cover)) ?? photos[0];

  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? "SINNER space"),
    approximateLocation: String(row.approximate_location ?? [row.city, row.state].filter(Boolean).join(", ")),
    timezone: String(row.timezone ?? "America/Mexico_City"),
    coverPhoto: resolvePhotoUrl(cover?.storage_path),
    hostId: row.host_id ? String(row.host_id) : null,
    hostName: "SINNER host",
  };
}

function mapBooking(row: UnknownRow): BookingCard {
  const space = mapSpace(row.spaces);
  const timezone = String(row.timezone ?? space.timezone ?? "America/Mexico_City");
  return {
    id: String(row.id),
    bookingReference: String(row.booking_reference ?? row.id),
    status: toAppBookingStatus(String(row.status)),
    bookingType: String(row.booking_type) === "instant" ? "instant" : "request",
    startDatetime: String(row.start_datetime),
    endDatetime: String(row.end_datetime),
    timezone,
    durationHours: asNumber(row.duration_hours),
    guestCount: asNumber(row.guest_count, 1),
    hourlyRateSnapshot: asNumber(row.hourly_rate_snapshot),
    baseAmount: asNumber(row.base_amount),
    cleaningFee: asNumber(row.cleaning_fee),
    serviceFee: asNumber(row.service_fee),
    totalAmount: asNumber(row.total_amount),
    currency: String(row.currency ?? "MXN"),
    holdExpiresAt: row.hold_expires_at ? String(row.hold_expires_at) : null,
    cancellationReason: row.cancellation_reason ? String(row.cancellation_reason) : null,
    cancelledAt: row.cancelled_at ? String(row.cancelled_at) : null,
    guestMessage: row.guest_message ? String(row.guest_message) : null,
    createdAt: String(row.created_at),
    space,
    guestDisplayName: row.guest_display_name ? String(row.guest_display_name) : undefined,
  };
}

export async function expireBookingHolds() {
  const supabase = await createClient();
  if (!supabase) return;
  await supabase.rpc("expire_booking_holds");
}

const bookingSelect = `
  id,booking_reference,booking_type,status,start_datetime,end_datetime,timezone,duration_hours,guest_count,
  hourly_rate_snapshot,base_amount,cleaning_fee,service_fee,total_amount,currency,hold_expires_at,
  cancellation_reason,cancelled_at,guest_message,created_at,rules_accepted_at,
  spaces(id,host_id,name,slug,city,state,approximate_location,timezone,space_photos(storage_path,is_cover,sort_order))
`;

export async function getGuestBookings(userId: string): Promise<BookingCard[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  await expireBookingHolds();
  const { data, error } = await supabase
    .from("bookings")
    .select(bookingSelect)
    .eq("guest_id", userId)
    .order("start_datetime", { ascending: false });
  if (error) throw new Error(bookingErrorMessage("access_denied"));
  return asRows(data).map(mapBooking);
}

export async function getHostBookings(): Promise<BookingCard[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  await expireBookingHolds();

  const { data: rpcData, error: rpcError } = await supabase.rpc("get_host_booking_dashboard");
  if (!rpcError && rpcData) return asRows(rpcData).map((row) => mapBooking({ ...row, spaces: row.space }));

  const { data, error } = await supabase
    .from("bookings")
    .select(bookingSelect)
    .order("start_datetime", { ascending: false });
  if (error) throw new Error(bookingErrorMessage("access_denied"));
  return asRows(data).map(mapBooking);
}

export async function getBookingDetail(bookingId: string): Promise<BookingDetail | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  await expireBookingHolds();

  const { data, error } = await supabase
    .from("bookings")
    .select(bookingSelect)
    .eq("id", bookingId)
    .maybeSingle();
  if (error) throw new Error(bookingErrorMessage("access_denied"));
  if (!data) return null;

  const { data: events } = await supabase
    .from("booking_events")
    .select("id,event_type,from_status,to_status,created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  const row = data as UnknownRow;
  const mapped = mapBooking(row);
  if (mapped.space.hostId) {
    const { data: host } = await supabase
      .from("public_host_profiles")
      .select("display_name")
      .eq("id", mapped.space.hostId)
      .maybeSingle();
    if (host?.display_name) mapped.space.hostName = String(host.display_name);
  }
  return {
    ...mapped,
    rulesAcceptedAt: row.rules_accepted_at ? String(row.rules_accepted_at) : null,
    events: asRows(events).map((event) => ({
      id: String(event.id),
      eventType: String(event.event_type),
      fromStatus: event.from_status ? toAppBookingStatus(String(event.from_status)) : null,
      toStatus: event.to_status ? toAppBookingStatus(String(event.to_status)) : null,
      createdAt: String(event.created_at),
    })),
  };
}

export async function getHostAvailabilityBlocks(): Promise<HostAvailabilityBlock[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("availability")
    .select("id,date,start_time,end_time,status,spaces!inner(name)")
    .gte("date", new Date().toISOString().slice(0, 10))
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(24);
  if (error) return [];
  return asRows(data).map((row) => {
    const space = asObject(row.spaces);
    return {
      id: String(row.id),
      spaceName: String(space?.name ?? "SINNER space"),
      date: String(row.date),
      startTime: String(row.start_time).slice(0, 5),
      endTime: String(row.end_time).slice(0, 5),
      status: ["available", "blocked", "reserved"].includes(String(row.status)) ? (String(row.status) as HostAvailabilityBlock["status"]) : "blocked",
    };
  });
}
