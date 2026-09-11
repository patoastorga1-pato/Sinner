"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeRedirectPath, withMessage } from "@/lib/auth/redirect";
import { requireUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function rating(formData: FormData, key: string) {
  const result = Number(value(formData, key));
  return Number.isInteger(result) && result >= 1 && result <= 5 ? result : null;
}

export async function createReviewAction(formData: FormData) {
  const bookingId = value(formData, "booking_id");
  const returnPath = safeRedirectPath(value(formData, "return_path"), bookingId ? `/bookings/${bookingId}` : "/bookings");
  const auth = await requireUser(returnPath);
  const supabase = await createClient();
  if (!supabase) redirect(withMessage(returnPath, "error", "Connect Supabase to continue."));

  const overall = rating(formData, "overall_rating");
  if (!overall) redirect(withMessage(returnPath, "error", "Choose an overall rating."));

  const { data: booking } = await supabase
    .from("bookings")
    .select("id,space_id,guest_id,status")
    .eq("id", bookingId)
    .eq("guest_id", auth.user.id)
    .maybeSingle();

  if (!booking || booking.status !== "completed") {
    redirect(withMessage(returnPath, "error", "Only completed bookings can be reviewed."));
  }

  const { error } = await supabase.from("reviews").insert({
    booking_id: bookingId,
    author_id: auth.user.id,
    space_id: booking.space_id,
    overall_rating: overall,
    cleanliness_rating: rating(formData, "cleanliness_rating"),
    privacy_rating: rating(formData, "privacy_rating"),
    accuracy_rating: rating(formData, "accuracy_rating"),
    host_rating: rating(formData, "host_rating"),
    discretion_rating: rating(formData, "discretion_rating"),
    comment: value(formData, "comment") || null,
  });

  if (error) redirect(withMessage(returnPath, "error", error.message));

  revalidatePath(returnPath);
  revalidatePath(`/spaces/${booking.space_id}`);
  redirect(withMessage(returnPath, "success", "Review published."));
}
