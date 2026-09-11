"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeRedirectPath, withMessage } from "@/lib/auth/redirect";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

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
