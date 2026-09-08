export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "guest" | "host" | "admin";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type SpaceStatus = "draft" | "pending_review" | "approved" | "rejected" | "suspended";
export type AvailabilityStatus = "available" | "blocked" | "reserved";
export type BookingStatus =
  | "draft"
  | "pending"
  | "approved"
  | "payment_pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "expired"
  | "declined"
  | "refunded"
  | "disputed";
export type ListingStatus = "draft" | "pending_review" | "approved" | "rejected" | "suspended";
export type EventVisibility = "public" | "private" | "invite_only";
export type TicketStatus = "valid" | "used" | "cancelled" | "refunded";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  date_of_birth: string;
  identity_verification_status: VerificationStatus;
  age_verification_status: VerificationStatus;
  terms_accepted_at: string;
  privacy_accepted_at: string;
  adult_confirmation_at: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  data: Json;
  created_at: string;
}

export const notificationTypes = [
  "booking_requested",
  "booking_approved",
  "booking_declined",
  "booking_cancelled",
  "booking_confirmed",
  "booking_hold_expiring",
  "booking_expired",
  "new_message",
  "new_review",
  "event_reminder",
  "listing_approved",
  "listing_rejected",
  "verification_required",
] as const;

export type NotificationType = (typeof notificationTypes)[number];
