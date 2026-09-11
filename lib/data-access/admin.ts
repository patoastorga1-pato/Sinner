import { createClient } from "@/lib/supabase/server";
import type { BookingStatus, HostApplicationRecord, HostApplicationStatus, PaymentRecord, Profile, ReportStatus, SpaceStatus, SupportTicketRecord, UserRole } from "@/lib/types/database";

type ProfileSummary = Pick<Profile, "id" | "first_name" | "last_name" | "display_name" | "created_at">;
type UnknownRow = Record<string, unknown>;

export type AdminHostApplication = HostApplicationRecord & {
  profile: ProfileSummary | null;
};

export type AdminUser = ProfileSummary & {
  email?: string | null;
  roles: UserRole[];
  identityStatus: string;
  ageStatus: string;
};

export type AdminSpace = {
  id: string;
  hostId: string | null;
  hostName: string;
  name: string;
  slug: string;
  status: SpaceStatus;
  city: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  price: number | null;
};

export type AdminBooking = {
  id: string;
  bookingReference: string;
  status: BookingStatus;
  guestId: string;
  spaceId: string;
  spaceName: string;
  totalAmount: number;
  currency: string;
  startDatetime: string;
  createdAt: string;
};

export type AdminReport = {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
};

export type AdminReview = {
  id: string;
  spaceId: string;
  bookingId: string;
  authorId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type AdminDashboard = {
  users: number;
  hosts: number;
  spaces: Record<SpaceStatus, number>;
  bookings: Record<BookingStatus, number>;
  reportsOpen: number;
  supportOpen: number;
  paymentsPending: number;
};

const hostApplicationSelect = "id,user_id,status,applicant_email,request_note,decision_note,reviewed_by,reviewed_at,requested_at,updated_at";

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

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const supabase = await createClient();
  const fallback = { users: 0, hosts: 0, spaces: emptySpaceCounts(), bookings: emptyBookingCounts(), reportsOpen: 0, supportOpen: 0, paymentsPending: 0 };
  if (!supabase) return fallback;

  const [profilesResult, rolesResult, spacesResult, bookingsResult, reportsResult, supportResult, paymentsResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "host"),
    supabase.from("spaces").select("status"),
    supabase.from("bookings").select("status"),
    supabase.from("reports").select("id", { count: "exact", head: true }).in("status", ["open", "reviewing"]),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
    supabase.from("payment_records").select("id", { count: "exact", head: true }).eq("status", "pending"),
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

  return {
    users: profilesResult.count ?? 0,
    hosts: rolesResult.count ?? 0,
    spaces,
    bookings,
    reportsOpen: reportsResult.count ?? 0,
    supportOpen: supportResult.count ?? 0,
    paymentsPending: paymentsResult.count ?? 0,
  };
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,first_name,last_name,display_name,identity_verification_status,age_verification_status,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("user_roles").select("user_id,role"),
  ]);

  const rolesByUser = new Map<string, UserRole[]>();
  asRows(roles).forEach((row) => {
    const userId = String(row.user_id);
    const next = rolesByUser.get(userId) ?? [];
    next.push(String(row.role) as UserRole);
    rolesByUser.set(userId, next);
  });

  return asRows(profiles).map((profile) => ({
    id: String(profile.id),
    first_name: String(profile.first_name ?? ""),
    last_name: String(profile.last_name ?? ""),
    display_name: profile.display_name ? String(profile.display_name) : null,
    created_at: String(profile.created_at),
    roles: rolesByUser.get(String(profile.id)) ?? [],
    identityStatus: String(profile.identity_verification_status ?? "unverified"),
    ageStatus: String(profile.age_verification_status ?? "unverified"),
  }));
}

export async function getAdminSpaces(): Promise<AdminSpace[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("spaces")
    .select("id,host_id,name,slug,status,city,state,hourly_price,overnight_price,full_day_price,created_at,updated_at,published_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const hostIds = Array.from(new Set(asRows(data).map((row) => String(row.host_id ?? "")).filter(Boolean)));
  const hostsById = new Map<string, string>();
  if (hostIds.length) {
    const { data: hosts } = await supabase.from("public_profiles").select("id,display_name").in("id", hostIds);
    asRows(hosts).forEach((host) => hostsById.set(String(host.id), String(host.display_name ?? "SINNER host")));
  }

  return asRows(data).map((row) => {
    const hostId = row.host_id ? String(row.host_id) : null;
    return {
      id: String(row.id),
      hostId,
      hostName: hostId ? hostsById.get(hostId) ?? "SINNER host" : "Unassigned",
      name: String(row.name ?? "Untitled space"),
      slug: String(row.slug ?? ""),
      status: String(row.status ?? "draft") as SpaceStatus,
      city: String(row.city ?? ""),
      state: String(row.state ?? ""),
      price: row.hourly_price ? asNumber(row.hourly_price) : row.overnight_price ? asNumber(row.overnight_price) : row.full_day_price ? asNumber(row.full_day_price) : null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      publishedAt: row.published_at ? String(row.published_at) : null,
    };
  });
}

export async function getAdminBookings(): Promise<AdminBooking[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("bookings")
    .select("id,booking_reference,status,guest_id,space_id,total_amount,currency,start_datetime,created_at,spaces(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return asRows(data).map((row) => {
    const space = asObject(row.spaces);
    return {
      id: String(row.id),
      bookingReference: String(row.booking_reference ?? row.id),
      status: String(row.status ?? "draft") as BookingStatus,
      guestId: String(row.guest_id ?? ""),
      spaceId: String(row.space_id ?? ""),
      spaceName: String(space?.name ?? "SINNER space"),
      totalAmount: asNumber(row.total_amount),
      currency: String(row.currency ?? "MXN"),
      startDatetime: String(row.start_datetime),
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

  return asRows(data).map((row) => ({
    id: String(row.id),
    reporterId: String(row.reporter_id),
    targetType: String(row.target_type),
    targetId: String(row.target_id),
    reason: String(row.reason),
    description: row.description ? String(row.description) : null,
    status: String(row.status ?? "open") as ReportStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export async function getAdminSupportTickets(): Promise<SupportTicketRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("support_tickets")
    .select("id,user_id,subject,category,description,status,admin_response,assigned_admin_id,resolved_at,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []) as SupportTicketRecord[];
}

export async function getAdminReviews(): Promise<AdminReview[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("reviews")
    .select("id,booking_id,author_id,space_id,overall_rating,comment,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return asRows(data).map((row) => ({
    id: String(row.id),
    bookingId: String(row.booking_id),
    authorId: String(row.author_id),
    spaceId: String(row.space_id),
    rating: asNumber(row.overall_rating),
    comment: row.comment ? String(row.comment) : null,
    createdAt: String(row.created_at),
  }));
}

export async function getAdminPayments(): Promise<PaymentRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("payment_records")
    .select("id,booking_id,guest_id,space_id,provider,provider_reference,status,gross_amount,platform_fee,host_net_amount,currency,metadata,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []) as PaymentRecord[];
}
