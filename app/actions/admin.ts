"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeRedirectPath, withMessage } from "@/lib/auth/redirect";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import type { ListingStatus, ReportStatus, SpaceStatus, SupportTicketStatus, VerificationStatus } from "@/lib/types/database";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

async function requireAdminSupabase(returnPath: string) {
  await requireRole("admin", returnPath);
  const supabase = await createClient();
  if (!supabase) redirect(withMessage(returnPath, "error", "Connect Supabase to continue."));
  return supabase;
}

function adminErrorMessage(error?: string) {
  if (error === "access_denied") return "Admin access required.";
  if (error === "host_request_not_pending") return "This host request is no longer pending.";
  return error || "Unable to update host request.";
}

export async function approveHostRequestAction(formData: FormData) {
  const returnPath = safeRedirectPath(value(formData, "return_path"), "/admin");
  const requestId = value(formData, "request_id");
  const supabase = await requireAdminSupabase(returnPath);

  const { error } = await supabase.rpc("approve_host_request", {
    p_request_id: requestId,
    p_decision_note: value(formData, "decision_note").trim() || null,
  });

  if (error) redirect(withMessage(returnPath, "error", adminErrorMessage(error.message)));

  revalidatePath("/admin");
  revalidatePath("/host/onboarding");
  redirect(withMessage(returnPath, "success", "Host request approved."));
}

export async function rejectHostRequestAction(formData: FormData) {
  const returnPath = safeRedirectPath(value(formData, "return_path"), "/admin");
  const requestId = value(formData, "request_id");
  const supabase = await requireAdminSupabase(returnPath);

  const { error } = await supabase.rpc("reject_host_request", {
    p_request_id: requestId,
    p_decision_note: value(formData, "decision_note").trim() || null,
  });

  if (error) redirect(withMessage(returnPath, "error", adminErrorMessage(error.message)));

  revalidatePath("/admin");
  revalidatePath("/host/onboarding");
  redirect(withMessage(returnPath, "success", "Host request rejected."));
}

function spaceStatus(value: string): SpaceStatus {
  return ["draft", "pending_review", "approved", "rejected", "suspended"].includes(value) ? (value as SpaceStatus) : "pending_review";
}

function listingStatus(value: string): ListingStatus {
  return ["draft", "pending_review", "approved", "rejected", "suspended"].includes(value) ? (value as ListingStatus) : "pending_review";
}

function reportStatus(value: string): ReportStatus {
  return ["open", "reviewing", "resolved", "dismissed"].includes(value) ? (value as ReportStatus) : "reviewing";
}

function supportStatus(value: string): SupportTicketStatus {
  return ["open", "in_progress", "resolved", "closed"].includes(value) ? (value as SupportTicketStatus) : "in_progress";
}

function verificationStatus(value: string): VerificationStatus {
  return ["unverified", "pending", "verified", "rejected"].includes(value) ? (value as VerificationStatus) : "pending";
}

export async function updateProfileVerificationAction(formData: FormData) {
  const returnPath = safeRedirectPath(value(formData, "return_path"), "/admin/profiles");
  const profileId = value(formData, "profile_id");
  const nextStatus = verificationStatus(value(formData, "age_status"));
  const rejectionReason = value(formData, "rejection_reason").trim() || null;
  const supabase = await requireAdminSupabase(returnPath);

  if (!profileId) {
    redirect(withMessage(returnPath, "error", "Profile id is required."));
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("gender,age_verification_document_path")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) redirect(withMessage(returnPath, "error", profileError.message));
  if (!profile) redirect(withMessage(returnPath, "error", "Profile not found."));

  if (nextStatus === "verified" && !profile.age_verification_document_path) {
    redirect(withMessage(returnPath, "error", "This profile needs an uploaded ID before it can be verified."));
  }

  if (nextStatus === "verified" && profile.gender !== "male" && profile.gender !== "female") {
    redirect(withMessage(returnPath, "error", "This profile needs hombre/mujer identity before it can be verified."));
  }

  const reviewed = nextStatus === "verified" || nextStatus === "rejected";
  const { error } = await supabase
    .from("profiles")
    .update({
      age_verification_status: nextStatus,
      age_verification_reviewed_at: reviewed ? new Date().toISOString() : null,
      age_verification_rejection_reason: nextStatus === "rejected" ? rejectionReason : null,
      identity_verification_status: profile.gender === "male" || profile.gender === "female" ? "verified" : "unverified",
    })
    .eq("id", profileId);

  if (error) redirect(withMessage(returnPath, "error", error.message));

  revalidatePath("/admin");
  revalidatePath("/admin/profiles");
  revalidatePath("/admin/users");
  revalidatePath("/profile");
  revalidatePath("/settings");
  redirect(withMessage(returnPath, "success", "Profile verification updated."));
}

export async function updateSpaceStatusAction(formData: FormData) {
  const returnPath = safeRedirectPath(value(formData, "return_path"), "/admin/listings");
  const supabase = await requireAdminSupabase(returnPath);

  const { error } = await supabase.rpc("admin_update_space_status", {
    p_space_id: value(formData, "space_id"),
    p_status: spaceStatus(value(formData, "status")),
  });

  if (error) redirect(withMessage(returnPath, "error", error.message));

  revalidatePath("/admin");
  revalidatePath("/admin/listing-reviews");
  revalidatePath("/admin/listings");
  revalidatePath("/spaces");
  redirect(withMessage(returnPath, "success", "Listing status updated."));
}

export async function updatePublicationStatusAction(formData: FormData) {
  const returnPath = safeRedirectPath(value(formData, "return_path"), "/admin/listings");
  const kind = value(formData, "kind");
  const id = value(formData, "publication_id");
  const reason = value(formData, "reason").trim();
  const nextStatus = listingStatus(value(formData, "status"));
  const supabase = await requireAdminSupabase(returnPath);

  if (!reason) redirect(withMessage(returnPath, "error", "A reason is required for moderation decisions."));

  if (kind === "space") {
    const { error } = await supabase.rpc("admin_update_space_status", {
      p_space_id: id,
      p_status: spaceStatus(nextStatus),
    });

    if (error) redirect(withMessage(returnPath, "error", error.message));
  } else if (kind === "experience" || kind === "event") {
    const table = kind === "experience" ? "experiences" : "events";
    const { error } = await supabase.from(table).update({ status: nextStatus }).eq("id", id);

    if (error) redirect(withMessage(returnPath, "error", error.message));
  } else {
    redirect(withMessage(returnPath, "error", "Unknown publication type."));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/listing-reviews");
  revalidatePath("/admin/listings");
  revalidatePath("/spaces");
  revalidatePath("/experiences");
  revalidatePath("/events");
  redirect(withMessage(returnPath, "success", "Publication status updated."));
}

export async function updateReportStatusAction(formData: FormData) {
  const returnPath = safeRedirectPath(value(formData, "return_path"), "/admin/reports");
  const supabase = await requireAdminSupabase(returnPath);

  const { error } = await supabase
    .from("reports")
    .update({ status: reportStatus(value(formData, "status")) })
    .eq("id", value(formData, "report_id"));

  if (error) redirect(withMessage(returnPath, "error", error.message));

  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  redirect(withMessage(returnPath, "success", "Report updated."));
}

export async function updateSupportTicketAction(formData: FormData) {
  const returnPath = safeRedirectPath(value(formData, "return_path"), "/admin/support");
  const supabase = await requireAdminSupabase(returnPath);

  const { error } = await supabase.rpc("update_support_ticket_admin", {
    p_ticket_id: value(formData, "ticket_id"),
    p_status: supportStatus(value(formData, "status")),
    p_admin_response: value(formData, "admin_response") || null,
  });

  if (error) redirect(withMessage(returnPath, "error", error.message));

  revalidatePath("/admin");
  revalidatePath("/admin/support");
  revalidatePath("/support");
  redirect(withMessage(returnPath, "success", "Support ticket updated."));
}
