"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { bookingErrorMessage } from "@/lib/bookings/errors";
import { safeRedirectPath, withMessage } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

async function requireBookingSupabase(returnPath: string) {
  const supabase = await createClient();
  if (!supabase) redirect(withMessage(returnPath, "error", "Connect Supabase to continue."));
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);
  return supabase;
}

function rpcMessage(error: { message?: string } | null | undefined) {
  return bookingErrorMessage(error?.message);
}

export async function createBookingAction(formData: FormData) {
  const spaceId = value(formData, "space_id");
  const returnPath = safeRedirectPath(value(formData, "return_path"), spaceId ? `/book/${spaceId}` : "/spaces");
  const rulesAccepted = value(formData, "rules_accepted") === "on";

  if (!rulesAccepted) redirect(withMessage(returnPath, "error", bookingErrorMessage("rules_required")));

  const supabase = await requireBookingSupabase(returnPath);
  const { data, error } = await supabase.rpc("create_booking_request", {
    p_space_id: spaceId,
    p_booking_type: value(formData, "booking_type"),
    p_local_date: value(formData, "date"),
    p_start_time: value(formData, "start"),
    p_duration_hours: Number(value(formData, "duration")),
    p_guest_count: Number(value(formData, "guests")),
    p_guest_message: value(formData, "guest_message").trim() || null,
    p_rules_accepted: rulesAccepted,
    p_idempotency_key: value(formData, "idempotency_key"),
  });

  if (error) redirect(withMessage(returnPath, "error", rpcMessage(error)));
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) redirect(withMessage(returnPath, "error", bookingErrorMessage()));

  revalidatePath("/bookings");
  revalidatePath("/host/bookings");
  const success = row.status === "pending"
    ? "Request sent. Your host will review it."
    : "Reservation temporarily held. Payment will be required to confirm it.";
  redirect(withMessage(`/bookings/${row.id}`, "success", success));
}

export async function approveBookingAction(formData: FormData) {
  const bookingId = value(formData, "booking_id");
  const returnPath = safeRedirectPath(value(formData, "return_path"), "/host/bookings");
  const supabase = await requireBookingSupabase(returnPath);
  const { data, error } = await supabase.rpc("approve_booking_request", { p_booking_id: bookingId });
  if (error) redirect(withMessage(returnPath, "error", rpcMessage(error)));
  const row = Array.isArray(data) ? data[0] : data;
  revalidatePath("/host/bookings");
  revalidatePath("/bookings");
  redirect(withMessage(returnPath, "success", row?.booking_reference ? `Approved ${row.booking_reference}. A temporary hold was created.` : "Booking request approved."));
}

export async function declineBookingAction(formData: FormData) {
  const bookingId = value(formData, "booking_id");
  const returnPath = safeRedirectPath(value(formData, "return_path"), "/host/bookings");
  const supabase = await requireBookingSupabase(returnPath);
  const { data, error } = await supabase.rpc("decline_booking_request", {
    p_booking_id: bookingId,
    p_reason: value(formData, "reason") || null,
  });
  if (error) redirect(withMessage(returnPath, "error", rpcMessage(error)));
  const row = Array.isArray(data) ? data[0] : data;
  revalidatePath("/host/bookings");
  revalidatePath("/bookings");
  redirect(withMessage(returnPath, "success", row?.booking_reference ? `Declined ${row.booking_reference}.` : "Booking request declined."));
}

export async function cancelBookingAction(formData: FormData) {
  const bookingId = value(formData, "booking_id");
  const returnPath = safeRedirectPath(value(formData, "return_path"), "/bookings");
  const supabase = await requireBookingSupabase(returnPath);
  const { data, error } = await supabase.rpc("cancel_booking_before_payment", {
    p_booking_id: bookingId,
    p_reason: value(formData, "reason") || null,
  });
  if (error) redirect(withMessage(returnPath, "error", rpcMessage(error)));
  const row = Array.isArray(data) ? data[0] : data;
  revalidatePath("/bookings");
  revalidatePath("/host/bookings");
  redirect(withMessage(returnPath, "success", row?.booking_reference ? `Cancelled ${row.booking_reference}.` : "Booking cancelled."));
}
