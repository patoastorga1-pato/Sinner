import { createClient } from "@/lib/supabase/server";
import type {
  BookingStatus,
  HostApplicationRecord,
  HostApplicationStatus,
  Json,
  ListingStatus,
  PaymentRecord,
  PaymentRecordStatus,
  PayoutRecord,
  PayoutRecordStatus,
  Profile,
  ReportStatus,
  SpaceStatus,
  SupportTicketRecord,
  UserRole,
} from "@/lib/types/database";

type ProfileSummary = Pick<Profile, "id" | "first_name" | "last_name" | "display_name" | "created_at">;
type UnknownRow = Record<string, unknown>;

export type AdminHostApplication = HostApplicationRecord & {
  profile: ProfileSummary | null;
};

export type AdminUser = ProfileSummary & {
  roles: UserRole[];
  identityStatus: string;
  ageStatus: string;
  listingCount: number;
  approvedListingCount: number;
  bookingCount: number;
  openReports: number;
  openSupportTickets: number;
  reviewCount: number;
};

export type AdminSpace = {
  id: string;
  hostId: string | null;
  hostName: string;
  name: string;
  slug: string;
  status: SpaceStatus;
  spaceType: string;
  city: string;
  state: string;
  country: string;
  locality: string | null;
  municipality: string | null;
  approximateLocation: string | null;
  exactAddress: string | null;
  maxGuests: number;
  privacyScore: number | null;
  instantBooking: boolean;
  creatorFriendly: boolean;
  groupFriendly: boolean;
  eventsAllowed: boolean;
  featured: boolean;
  ratingAverage: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  price: number | null;
  currency: string;
};

export type AdminPublication = {
  id: string;
  kind: "space" | "experience" | "event";
  ownerId: string | null;
  ownerName: string;
  name: string;
  slug: string;
  status: SpaceStatus | ListingStatus;
  city: string;
  state: string;
  detail: string;
  price: number | null;
  currency: string;
  createdAt: string;
  publishedAt: string | null;
  href: string | null;
};

export type AdminBooking = {
  id: string;
  bookingReference: string;
  status: BookingStatus;
  bookingType: string;
  guestId: string;
  guestName: string;
  spaceId: string;
  spaceName: string;
  hostId: string | null;
  hostName: string;
  totalAmount: number;
  currency: string;
  startDatetime: string;
  endDatetime: string;
  timezone: string;
  guestCount: number;
  durationHours: number;
  holdExpiresAt: string | null;
  createdAt: string;
};

export type AdminReport = {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
};

export type AdminReview = {
  id: string;
  spaceId: string;
  spaceName: string;
  bookingId: string;
  authorId: string;
  authorName: string;
  rating: number;
  privacyRating: number | null;
  discretionRating: number | null;
  comment: string | null;
  createdAt: string;
};

export type AdminPayment = PaymentRecord & {
  spaceName: string;
  guestName: string;
};

export type AdminPayout = PayoutRecord & {
  hostName: string;
};

export type AdminConversation = {
  id: string;
  spaceName: string;
  bookingReference: string | null;
  participants: string[];
  lastMessage: string | null;
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
};

export type AdminSetting = {
  key: string;
  value: Json;
  updatedAt: string;
};

export type AdminDashboard = {
  users: number;
  hosts: number;
  spaces: Record<SpaceStatus, number>;
  bookings: Record<BookingStatus, number>;
  reportsOpen: number;
  supportOpen: number;
  paymentsPending: number;
  payoutsPending: number;
  paymentGross: number;
  platformFees: number;
  hostNet: number;
};

const hostApplicationSelect = "id,user_id,status,applicant_email,request_note,decision_note,reviewed_by,reviewed_at,requested_at,updated_at";

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

function displayName(profile: UnknownRow | null | undefined, fallback = "SINNER member") {
  if (!profile) return fallback;
  const explicit = String(profile.display_name ?? "").trim();
  if (explicit) return explicit;
  const fullName = `${String(profile.first_name ?? "").trim()} ${String(profile.last_name ?? "").trim()}`.trim();
  return fullName || fallback;
}

function emptyBookingCounts(): Record<BookingStatus, number> {
  return {
    draft: 0,
    pending: 0,
    approved: 0,
    payment_pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    expired: 0,
    declined: 0,
    refunded: 0,
    disputed: 0,
  };
}

function emptySpaceCounts(): Record<SpaceStatus, number> {
  return { draft: 0, pending_review: 0, approved: 0, rejected: 0, suspended: 0 };
}

function increment(map: Map<string, number>, key: unknown) {
  const normalized = String(key ?? "");
  if (!normalized) return;
  map.set(normalized, (map.get(normalized) ?? 0) + 1);
}

async function getProfileNames(userIds: string[]) {
  const supabase = await createClient();
  const names = new Map<string, string>();
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (!supabase || !uniqueIds.length) return names;

  const { data } = await supabase
    .from("profiles")
    .select("id,first_name,last_name,display_name,created_at")
    .in("id", uniqueIds);

  asRows(data).forEach((profile) => names.set(String(profile.id), displayName(profile)));
  return names;
}

export async function getAdminHostApplications() {
  const supabase = await createClient();
  if (!supabase) return [] as AdminHostApplication[];

  const { data } = await supabase
    .from("host_applications")
    .select(hostApplicationSelect)
    .order("requested_at", { ascending: false });

  const applications = (data ?? []) as HostApplicationRecord[];
  const userIds = Array.from(new Set(applications.map((application) => application.user_id)));
  const profilesById = new Map<string, ProfileSummary>();

  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,first_name,last_name,display_name,created_at")
      .in("id", userIds);

    ((profiles ?? []) as ProfileSummary[]).forEach((profile) => profilesById.set(profile.id, profile));
  }

  return applications.map((application) => ({
    ...application,
    profile: profilesById.get(application.user_id) ?? null,
  }));
}

export async function getHostApplicationCounts() {
  const applications = await getAdminHostApplications();
  const statuses: HostApplicationStatus[] = ["pending", "approved", "rejected", "suspended"];
  return Object.fromEntries(statuses.map((status) => [status, applications.filter((application) => application.status === status).length])) as Record<HostApplicationStatus, number>;
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const supabase = await createClient();
  const fallback = {
    users: 0,
    hosts: 0,
    spaces: emptySpaceCounts(),
    bookings: emptyBookingCounts(),
    reportsOpen: 0,
    supportOpen: 0,
    paymentsPending: 0,
    payoutsPending: 0,
    paymentGross: 0,
    platformFees: 0,
    hostNet: 0,
  };
  if (!supabase) return fallback;

  const [
    profilesResult,
    rolesResult,
    spacesResult,
    bookingsResult,
    reportsResult,
    supportResult,
    paymentsResult,
    payoutsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "host"),
    supabase.from("spaces").select("status"),
    supabase.from("bookings").select("status"),
    supabase.from("reports").select("id", { count: "exact", head: true }).in("status", ["open", "reviewing"]),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
    supabase.from("payment_records").select("status,gross_amount,platform_fee,host_net_amount"),
    supabase.from("payout_records").select("status,net_amount"),
  ]);

  const spaces = emptySpaceCounts();
  asRows(spacesResult.data).forEach((row) => {
    const status = String(row.status) as SpaceStatus;
    if (status in spaces) spaces[status] += 1;
  });

  const bookings = emptyBookingCounts();
  asRows(bookingsResult.data).forEach((row) => {
    const status = String(row.status) as BookingStatus;
    if (status in bookings) bookings[status] += 1;
  });

  const paymentRows = asRows(paymentsResult.data);
  const payoutRows = asRows(payoutsResult.data);

  return {
    users: profilesResult.count ?? 0,
    hosts: rolesResult.count ?? 0,
    spaces,
    bookings,
    reportsOpen: reportsResult.count ?? 0,
    supportOpen: supportResult.count ?? 0,
    paymentsPending: paymentRows.filter((payment) => payment.status === "pending").length,
    payoutsPending: payoutRows.filter((payout) => payout.status === "pending").length,
    paymentGross: paymentRows.reduce((total, payment) => total + asNumber(payment.gross_amount), 0),
    platformFees: paymentRows.reduce((total, payment) => total + asNumber(payment.platform_fee), 0),
    hostNet: paymentRows.reduce((total, payment) => total + asNumber(payment.host_net_amount), 0),
  };
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const [profilesResult, rolesResult, spacesResult, bookingsResult, reportsResult, supportResult, reviewsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,first_name,last_name,display_name,identity_verification_status,age_verification_status,created_at")
      .order("created_at", { ascending: false })
      .limit(150),
    supabase.from("user_roles").select("user_id,role"),
    supabase.from("spaces").select("host_id,status"),
    supabase.from("bookings").select("guest_id,status"),
    supabase.from("reports").select("reporter_id,status"),
    supabase.from("support_tickets").select("user_id,status"),
    supabase.from("reviews").select("author_id"),
  ]);

  const rolesByUser = new Map<string, UserRole[]>();
  asRows(rolesResult.data).forEach((row) => {
    const userId = String(row.user_id);
    const next = rolesByUser.get(userId) ?? [];
    next.push(String(row.role) as UserRole);
    rolesByUser.set(userId, next);
  });

  const listingCounts = new Map<string, number>();
  const approvedListingCounts = new Map<string, number>();
  asRows(spacesResult.data).forEach((row) => {
    increment(listingCounts, row.host_id);
    if (row.status === "approved") increment(approvedListingCounts, row.host_id);
  });

  const bookingCounts = new Map<string, number>();
  asRows(bookingsResult.data).forEach((row) => increment(bookingCounts, row.guest_id));

  const reportCounts = new Map<string, number>();
  asRows(reportsResult.data)
    .filter((row) => ["open", "reviewing"].includes(String(row.status)))
    .forEach((row) => increment(reportCounts, row.reporter_id));

  const supportCounts = new Map<string, number>();
  asRows(supportResult.data)
    .filter((row) => ["open", "in_progress"].includes(String(row.status)))
    .forEach((row) => increment(supportCounts, row.user_id));

  const reviewCounts = new Map<string, number>();
  asRows(reviewsResult.data).forEach((row) => increment(reviewCounts, row.author_id));

  return asRows(profilesResult.data).map((profile) => {
    const id = String(profile.id);
    return {
      id,
      first_name: String(profile.first_name ?? ""),
      last_name: String(profile.last_name ?? ""),
      display_name: profile.display_name ? String(profile.display_name) : null,
      created_at: String(profile.created_at),
      roles: rolesByUser.get(id) ?? [],
      identityStatus: String(profile.identity_verification_status ?? "unverified"),
      ageStatus: String(profile.age_verification_status ?? "unverified"),
      listingCount: listingCounts.get(id) ?? 0,
      approvedListingCount: approvedListingCounts.get(id) ?? 0,
      bookingCount: bookingCounts.get(id) ?? 0,
      openReports: reportCounts.get(id) ?? 0,
      openSupportTickets: supportCounts.get(id) ?? 0,
      reviewCount: reviewCounts.get(id) ?? 0,
    };
  });
}

export async function getAdminSpaces(): Promise<AdminSpace[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("spaces")
    .select(`
      id,host_id,name,slug,status,space_type,city,state,country,locality,municipality,
      approximate_location,exact_address,max_guests,hourly_price,overnight_price,full_day_price,
      cleaning_fee,minimum_hours,privacy_score,instant_booking,creator_friendly,group_friendly,
      events_allowed,featured,rating_average,review_count,created_at,updated_at,published_at
    `)
    .order("created_at", { ascending: false })
    .limit(150);

  const hostIds = Array.from(new Set(asRows(data).map((row) => String(row.host_id ?? "")).filter(Boolean)));
  const hostsById = await getProfileNames(hostIds);

  return asRows(data).map((row) => {
    const hostId = row.host_id ? String(row.host_id) : null;
    return {
      id: String(row.id),
      hostId,
      hostName: hostId ? hostsById.get(hostId) ?? "SINNER host" : "Unassigned",
      name: String(row.name ?? "Untitled space"),
      slug: String(row.slug ?? ""),
      status: String(row.status ?? "draft") as SpaceStatus,
      spaceType: String(row.space_type ?? "other"),
      city: String(row.city ?? ""),
      state: String(row.state ?? ""),
      country: String(row.country ?? "Mexico"),
      locality: row.locality ? String(row.locality) : null,
      municipality: row.municipality ? String(row.municipality) : null,
      approximateLocation: row.approximate_location ? String(row.approximate_location) : null,
      exactAddress: row.exact_address ? String(row.exact_address) : null,
      maxGuests: asNumber(row.max_guests, 1),
      privacyScore: asNullableNumber(row.privacy_score),
      instantBooking: Boolean(row.instant_booking),
      creatorFriendly: Boolean(row.creator_friendly),
      groupFriendly: Boolean(row.group_friendly),
      eventsAllowed: Boolean(row.events_allowed),
      featured: Boolean(row.featured),
      ratingAverage: asNumber(row.rating_average),
      reviewCount: asNumber(row.review_count),
      price: row.hourly_price ? asNumber(row.hourly_price) : row.overnight_price ? asNumber(row.overnight_price) : row.full_day_price ? asNumber(row.full_day_price) : null,
      currency: "MXN",
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      publishedAt: row.published_at ? String(row.published_at) : null,
    };
  });
}

export async function getAdminPublications(): Promise<AdminPublication[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const [spaces, experiencesResult, eventsResult] = await Promise.all([
    getAdminSpaces(),
    supabase
      .from("experiences")
      .select("id,host_id,name,slug,status,city,state,duration_minutes,max_guests,price,currency,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("events")
      .select("id,organizer_id,name,slug,status,city,state,event_date,start_time,capacity,ticket_price,currency,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const ownerIds = [
    ...asRows(experiencesResult.data).map((row) => String(row.host_id ?? "")),
    ...asRows(eventsResult.data).map((row) => String(row.organizer_id ?? "")),
  ].filter(Boolean);
  const ownerNames = await getProfileNames(ownerIds);

  const spacePublications: AdminPublication[] = spaces.map((space) => ({
    id: space.id,
    kind: "space",
    ownerId: space.hostId,
    ownerName: space.hostName,
    name: space.name,
    slug: space.slug,
    status: space.status,
    city: space.city,
    state: space.state,
    detail: `${space.spaceType} · ${space.maxGuests} guests · ${space.reviewCount} reviews${space.exactAddress ? ` · ${space.exactAddress}` : ""}`,
    price: space.price,
    currency: space.currency,
    createdAt: space.createdAt,
    publishedAt: space.publishedAt,
    href: space.slug ? `/spaces/${space.slug}` : null,
  }));

  const experiencePublications: AdminPublication[] = asRows(experiencesResult.data).map((row) => {
    const ownerId = row.host_id ? String(row.host_id) : null;
    return {
      id: String(row.id),
      kind: "experience",
      ownerId,
      ownerName: ownerId ? ownerNames.get(ownerId) ?? "SINNER host" : "Unassigned",
      name: String(row.name ?? "Untitled experience"),
      slug: String(row.slug ?? ""),
      status: String(row.status ?? "draft") as ListingStatus,
      city: String(row.city ?? ""),
      state: String(row.state ?? ""),
      detail: `${asNumber(row.duration_minutes)} minutes · ${asNumber(row.max_guests, 1)} guests`,
      price: asNullableNumber(row.price),
      currency: String(row.currency ?? "MXN"),
      createdAt: String(row.created_at),
      publishedAt: null,
      href: row.slug ? `/experiences/${String(row.slug)}` : null,
    };
  });

  const eventPublications: AdminPublication[] = asRows(eventsResult.data).map((row) => {
    const ownerId = row.organizer_id ? String(row.organizer_id) : null;
    return {
      id: String(row.id),
      kind: "event",
      ownerId,
      ownerName: ownerId ? ownerNames.get(ownerId) ?? "SINNER host" : "Unassigned",
      name: String(row.name ?? "Untitled event"),
      slug: String(row.slug ?? ""),
      status: String(row.status ?? "draft") as ListingStatus,
      city: String(row.city ?? ""),
      state: String(row.state ?? ""),
      detail: `${String(row.event_date ?? "No date")} · ${String(row.start_time ?? "").slice(0, 5)} · ${asNumber(row.capacity, 1)} capacity`,
      price: asNullableNumber(row.ticket_price),
      currency: String(row.currency ?? "MXN"),
      createdAt: String(row.created_at),
      publishedAt: null,
      href: row.slug ? `/events/${String(row.slug)}` : null,
    };
  });

  return [...spacePublications, ...experiencePublications, ...eventPublications].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function getAdminBookings(): Promise<AdminBooking[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("bookings")
    .select(`
      id,booking_reference,booking_type,status,guest_id,space_id,total_amount,currency,
      start_datetime,end_datetime,timezone,duration_hours,guest_count,hold_expires_at,created_at,
      spaces(id,name,slug,host_id,city,state)
    `)
    .order("created_at", { ascending: false })
    .limit(150);

  const rows = asRows(data);
  const guestIds = rows.map((row) => String(row.guest_id ?? "")).filter(Boolean);
  const hostIds = rows.map((row) => String(asObject(row.spaces)?.host_id ?? "")).filter(Boolean);
  const names = await getProfileNames([...guestIds, ...hostIds]);

  return rows.map((row) => {
    const space = asObject(row.spaces);
    const hostId = space?.host_id ? String(space.host_id) : null;
    const guestId = String(row.guest_id ?? "");
    return {
      id: String(row.id),
      bookingReference: String(row.booking_reference ?? row.id),
      status: String(row.status ?? "draft") as BookingStatus,
      bookingType: String(row.booking_type ?? "request"),
      guestId,
      guestName: names.get(guestId) ?? "SINNER guest",
      spaceId: String(row.space_id ?? ""),
      spaceName: String(space?.name ?? "SINNER space"),
      hostId,
      hostName: hostId ? names.get(hostId) ?? "SINNER host" : "Unassigned",
      totalAmount: asNumber(row.total_amount),
      currency: String(row.currency ?? "MXN"),
      startDatetime: String(row.start_datetime),
      endDatetime: String(row.end_datetime ?? row.start_datetime),
      timezone: String(row.timezone ?? "America/Mexico_City"),
      guestCount: asNumber(row.guest_count, 1),
      durationHours: asNumber(row.duration_hours, 1),
      holdExpiresAt: row.hold_expires_at ? String(row.hold_expires_at) : null,
      createdAt: String(row.created_at),
    };
  });
}

export async function getAdminReports(): Promise<AdminReport[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("reports")
    .select("id,reporter_id,target_type,target_id,reason,description,status,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = asRows(data);
  const reporterNames = await getProfileNames(rows.map((row) => String(row.reporter_id ?? "")).filter(Boolean));

  return rows.map((row) => ({
    id: String(row.id),
    reporterId: String(row.reporter_id),
    reporterName: reporterNames.get(String(row.reporter_id)) ?? "SINNER member",
    targetType: String(row.target_type),
    targetId: String(row.target_id),
    targetLabel: `${String(row.target_type)} · ${String(row.target_id).slice(0, 8)}`,
    reason: String(row.reason),
    description: row.description ? String(row.description) : null,
    status: String(row.status ?? "open") as ReportStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export async function getAdminSupportTickets(): Promise<Array<SupportTicketRecord & { userName: string }>> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("support_tickets")
    .select("id,user_id,subject,category,description,status,admin_response,assigned_admin_id,resolved_at,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const tickets = (data ?? []) as SupportTicketRecord[];
  const names = await getProfileNames(tickets.map((ticket) => ticket.user_id));
  return tickets.map((ticket) => ({ ...ticket, userName: names.get(ticket.user_id) ?? "SINNER member" }));
}

export async function getAdminReviews(): Promise<AdminReview[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("reviews")
    .select("id,booking_id,author_id,space_id,overall_rating,privacy_rating,discretion_rating,comment,created_at,spaces(name,slug)")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = asRows(data);
  const names = await getProfileNames(rows.map((row) => String(row.author_id ?? "")).filter(Boolean));

  return rows.map((row) => {
    const space = asObject(row.spaces);
    const authorId = String(row.author_id);
    return {
      id: String(row.id),
      bookingId: String(row.booking_id),
      authorId,
      authorName: names.get(authorId) ?? "SINNER member",
      spaceId: String(row.space_id),
      spaceName: String(space?.name ?? "SINNER space"),
      rating: asNumber(row.overall_rating),
      privacyRating: asNullableNumber(row.privacy_rating),
      discretionRating: asNullableNumber(row.discretion_rating),
      comment: row.comment ? String(row.comment) : null,
      createdAt: String(row.created_at),
    };
  });
}

export async function getAdminPayments(): Promise<AdminPayment[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("payment_records")
    .select("id,booking_id,guest_id,space_id,provider,provider_reference,status,gross_amount,platform_fee,host_net_amount,currency,metadata,created_at,updated_at,spaces(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = asRows(data);
  const names = await getProfileNames(rows.map((row) => String(row.guest_id ?? "")).filter(Boolean));

  return rows.map((row) => {
    const guestId = String(row.guest_id ?? "");
    const space = asObject(row.spaces);
    return {
      id: String(row.id),
      booking_id: String(row.booking_id),
      guest_id: guestId,
      space_id: String(row.space_id),
      provider: String(row.provider ?? "pending_provider"),
      provider_reference: row.provider_reference ? String(row.provider_reference) : null,
      status: String(row.status ?? "pending") as PaymentRecordStatus,
      gross_amount: asNumber(row.gross_amount),
      platform_fee: asNumber(row.platform_fee),
      host_net_amount: asNumber(row.host_net_amount),
      currency: String(row.currency ?? "MXN"),
      metadata: (row.metadata ?? {}) as Json,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      spaceName: String(space?.name ?? "SINNER space"),
      guestName: names.get(guestId) ?? "SINNER guest",
    };
  });
}

export async function getAdminPayouts(): Promise<AdminPayout[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("payout_records")
    .select("id,host_id,payment_id,status,gross_amount,platform_fee,net_amount,currency,paid_at,metadata,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = asRows(data);
  const names = await getProfileNames(rows.map((row) => String(row.host_id ?? "")).filter(Boolean));

  return rows.map((row) => {
    const hostId = String(row.host_id ?? "");
    return {
      id: String(row.id),
      host_id: hostId,
      payment_id: row.payment_id ? String(row.payment_id) : null,
      status: String(row.status ?? "pending") as PayoutRecordStatus,
      gross_amount: asNumber(row.gross_amount),
      platform_fee: asNumber(row.platform_fee),
      net_amount: asNumber(row.net_amount),
      currency: String(row.currency ?? "MXN"),
      paid_at: row.paid_at ? String(row.paid_at) : null,
      metadata: (row.metadata ?? {}) as Json,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      hostName: names.get(hostId) ?? "SINNER host",
    };
  });
}

export async function getAdminConversations(): Promise<AdminConversation[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id,space_id,booking_id,created_at,updated_at,spaces(name),bookings(booking_reference)")
    .order("updated_at", { ascending: false })
    .limit(100);

  const conversationRows = asRows(conversations);
  const conversationIds = conversationRows.map((row) => String(row.id));
  if (!conversationIds.length) return [];

  const [participantsResult, messagesResult] = await Promise.all([
    supabase.from("conversation_participants").select("conversation_id,user_id").in("conversation_id", conversationIds),
    supabase.from("messages").select("id,conversation_id,sender_id,body,created_at").in("conversation_id", conversationIds).order("created_at", { ascending: false }),
  ]);

  const participantRows = asRows(participantsResult.data);
  const messageRows = asRows(messagesResult.data);
  const participantNames = await getProfileNames(participantRows.map((row) => String(row.user_id ?? "")).filter(Boolean));

  const participantsByConversation = new Map<string, string[]>();
  participantRows.forEach((participant) => {
    const conversationId = String(participant.conversation_id);
    const userId = String(participant.user_id);
    const next = participantsByConversation.get(conversationId) ?? [];
    next.push(participantNames.get(userId) ?? "SINNER member");
    participantsByConversation.set(conversationId, next);
  });

  const latestMessageByConversation = new Map<string, UnknownRow>();
  const messageCounts = new Map<string, number>();
  messageRows.forEach((message) => {
    const conversationId = String(message.conversation_id);
    messageCounts.set(conversationId, (messageCounts.get(conversationId) ?? 0) + 1);
    if (!latestMessageByConversation.has(conversationId)) latestMessageByConversation.set(conversationId, message);
  });

  return conversationRows.map((conversation) => {
    const id = String(conversation.id);
    const space = asObject(conversation.spaces);
    const booking = asObject(conversation.bookings);
    const latest = latestMessageByConversation.get(id);
    return {
      id,
      spaceName: String(space?.name ?? "Private conversation"),
      bookingReference: booking?.booking_reference ? String(booking.booking_reference) : null,
      participants: participantsByConversation.get(id) ?? [],
      lastMessage: latest?.body ? String(latest.body) : null,
      lastMessageAt: String(latest?.created_at ?? conversation.updated_at ?? conversation.created_at),
      messageCount: messageCounts.get(id) ?? 0,
      createdAt: String(conversation.created_at),
    };
  });
}

export async function getAdminSettings(): Promise<AdminSetting[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("app_settings")
    .select("key,value,updated_at")
    .order("key", { ascending: true });

  return asRows(data).map((row) => ({
    key: String(row.key),
    value: (row.value ?? null) as Json,
    updatedAt: String(row.updated_at),
  }));
}
