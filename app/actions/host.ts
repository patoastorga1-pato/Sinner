"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeRedirectPath, withMessage } from "@/lib/auth/redirect";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import type { Json, SpaceStatus } from "@/lib/types/database";

type SpaceWrite = {
  name: string;
  short_description: string | null;
  description: string | null;
  space_type: string;
  status: SpaceStatus;
  city: string;
  state: string;
  country: string;
  country_code: string;
  state_code: string | null;
  municipality: string | null;
  locality: string | null;
  postal_code: string | null;
  approximate_location: string | null;
  max_guests: number;
  hourly_price: number | null;
  overnight_price: number | null;
  full_day_price: number | null;
  cleaning_fee: number;
  minimum_hours: number;
  privacy_score: number | null;
  instant_booking: boolean;
  creator_friendly: boolean;
  group_friendly: boolean;
  events_allowed: boolean;
  cancellation_policy: string | null;
  check_in_notes: string | null;
  minimum_booking_notice_minutes: number;
  buffer_minutes: number;
  house_rules: Json;
};

type SpaceUpdate = Partial<SpaceWrite> & {
  exact_address?: string;
  latitude?: number;
  longitude?: number;
};

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const text = value(formData, key);
  return text.length ? text : null;
}

function numericValue(formData: FormData, key: string, fallback: number) {
  const result = Number(value(formData, key));
  return Number.isFinite(result) ? result : fallback;
}

function optionalNumericValue(formData: FormData, key: string) {
  const text = value(formData, key);
  if (!text) return null;
  const result = Number(text);
  return Number.isFinite(result) ? result : null;
}

function checked(formData: FormData, key: string) {
  return value(formData, key) === "on";
}

function slugify(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return `${base || "sinner-space"}-${crypto.randomUUID().slice(0, 8)}`;
}

function parseRules(formData: FormData) {
  return value(formData, "house_rules")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((detail, index) => ({ key: `rule-${index + 1}`, label: `Rule ${index + 1}`, detail }));
}

function buildSpacePayload(formData: FormData, status: SpaceStatus): SpaceWrite {
  return {
    name: value(formData, "name"),
    short_description: optionalText(formData, "short_description"),
    description: optionalText(formData, "description"),
    space_type: value(formData, "space_type") || "other",
    status,
    city: value(formData, "city"),
    state: value(formData, "state"),
    country: value(formData, "country") || "Mexico",
    country_code: value(formData, "country_code") || "MX",
    state_code: optionalText(formData, "state_code"),
    municipality: optionalText(formData, "municipality"),
    locality: optionalText(formData, "locality"),
    postal_code: optionalText(formData, "postal_code"),
    approximate_location: optionalText(formData, "approximate_location"),
    max_guests: Math.max(1, numericValue(formData, "max_guests", 2)),
    hourly_price: optionalNumericValue(formData, "hourly_price"),
    overnight_price: optionalNumericValue(formData, "overnight_price"),
    full_day_price: optionalNumericValue(formData, "full_day_price"),
    cleaning_fee: Math.max(0, numericValue(formData, "cleaning_fee", 0)),
    minimum_hours: Math.max(1, numericValue(formData, "minimum_hours", 1)),
    privacy_score: optionalNumericValue(formData, "privacy_score"),
    instant_booking: checked(formData, "instant_booking"),
    creator_friendly: checked(formData, "creator_friendly"),
    group_friendly: checked(formData, "group_friendly"),
    events_allowed: checked(formData, "events_allowed"),
    cancellation_policy: optionalText(formData, "cancellation_policy"),
    check_in_notes: optionalText(formData, "check_in_notes"),
    minimum_booking_notice_minutes: Math.max(0, numericValue(formData, "minimum_booking_notice_minutes", 120)),
    buffer_minutes: Math.max(0, numericValue(formData, "buffer_minutes", 30)),
    house_rules: parseRules(formData),
  };
}

function getSelectedIds(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter(Boolean);
}

function photoFiles(formData: FormData) {
  return formData.getAll("photos").filter((item): item is File => item instanceof File && item.size > 0);
}

function safePhotoName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "photo";
}

async function requireHostSupabase(returnPath: string) {
  const auth = await requireRole("host", returnPath);
  const supabase = await createClient();
  if (!supabase) redirect(withMessage(returnPath, "error", "Connect Supabase to continue."));
  return { supabase, userId: auth.user.id };
}

async function syncListingRelations(supabase: Awaited<ReturnType<typeof createClient>>, spaceId: string, amenityIds: string[], allowedUseIds: string[]) {
  if (!supabase) return;

  await supabase.from("space_amenities").delete().eq("space_id", spaceId);
  if (amenityIds.length) {
    await supabase.from("space_amenities").insert(amenityIds.map((amenityId) => ({ space_id: spaceId, amenity_id: amenityId })));
  }

  await supabase.from("space_allowed_uses").delete().eq("space_id", spaceId);
  if (allowedUseIds.length) {
    await supabase.from("space_allowed_uses").insert(allowedUseIds.map((allowedUseId) => ({ space_id: spaceId, allowed_use_id: allowedUseId, allowed: true })));
  }
}

async function uploadListingPhotos(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, spaceId: string, files: File[]) {
  if (!supabase || !files.length) return false;

  let uploaded = false;
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const path = `${userId}/${spaceId}/${crypto.randomUUID()}-${safePhotoName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("space-photos").upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (!uploadError) {
      const { error: insertError } = await supabase.from("space_photos").insert({
        space_id: spaceId,
        storage_path: path,
        sort_order: index,
        is_cover: index === 0,
        alt_text: file.name,
      });
      uploaded = uploaded || !insertError;
    }
  }

  return uploaded;
}

export async function createHostListingAction(formData: FormData) {
  const returnPath = safeRedirectPath(value(formData, "return_path"), "/host/listings/new");
  const intent = value(formData, "intent");
  const status: SpaceStatus = intent === "submit" ? "pending_review" : "draft";
  const { supabase, userId } = await requireHostSupabase(returnPath);
  const payload = buildSpacePayload(formData, status);

  if (!payload.name || !payload.city || !payload.state) {
    redirect(withMessage(returnPath, "error", "Name, city and state are required."));
  }

  const { data, error } = await supabase
    .from("spaces")
    .insert({
      ...payload,
      host_id: userId,
      slug: slugify(payload.name),
      exact_address: optionalText(formData, "exact_address"),
      latitude: optionalNumericValue(formData, "latitude"),
      longitude: optionalNumericValue(formData, "longitude"),
    })
    .select("id")
    .single();

  if (error || !data?.id) redirect(withMessage(returnPath, "error", error?.message || "Unable to create listing."));

  await syncListingRelations(supabase, String(data.id), getSelectedIds(formData, "amenities"), getSelectedIds(formData, "allowed_uses"));
  const uploaded = await uploadListingPhotos(supabase, userId, String(data.id), photoFiles(formData));

  revalidatePath("/host/listings");
  revalidatePath("/admin/listings");
  const message = status === "pending_review" ? "Listing submitted for admin review." : "Draft listing saved.";
  redirect(withMessage("/host/listings", "success", uploaded ? message : `${message} Photos can be added after the storage bucket migration is active.`));
}

export async function updateHostListingAction(formData: FormData) {
  const listingId = value(formData, "listing_id");
  const returnPath = safeRedirectPath(value(formData, "return_path"), listingId ? `/host/listings/${listingId}/edit` : "/host/listings");
  const intent = value(formData, "intent");
  const status: SpaceStatus = intent === "submit" ? "pending_review" : "draft";
  const { supabase, userId } = await requireHostSupabase(returnPath);
  const payload = buildSpacePayload(formData, status);
  const exactAddress = optionalText(formData, "exact_address");
  const latitude = optionalNumericValue(formData, "latitude");
  const longitude = optionalNumericValue(formData, "longitude");

  const updatePayload: SpaceUpdate = { ...payload };
  if (!value(formData, "postal_code")) delete updatePayload.postal_code;
  if (exactAddress) updatePayload.exact_address = exactAddress;
  if (latitude !== null) updatePayload.latitude = latitude;
  if (longitude !== null) updatePayload.longitude = longitude;
  const { error } = await supabase.from("spaces").update(updatePayload).eq("id", listingId).eq("host_id", userId);
  if (error) redirect(withMessage(returnPath, "error", error.message));

  await syncListingRelations(supabase, listingId, getSelectedIds(formData, "amenities"), getSelectedIds(formData, "allowed_uses"));
  await uploadListingPhotos(supabase, userId, listingId, photoFiles(formData));

  revalidatePath("/host/listings");
  revalidatePath(`/host/listings/${listingId}/edit`);
  revalidatePath("/admin/listings");
  redirect(withMessage("/host/listings", "success", status === "pending_review" ? "Listing changes submitted for review." : "Listing saved as draft."));
}

export async function updateHostListingStatusAction(formData: FormData) {
  const listingId = value(formData, "listing_id");
  const returnPath = safeRedirectPath(value(formData, "return_path"), "/host/listings");
  const intent = value(formData, "intent");
  const { supabase, userId } = await requireHostSupabase(returnPath);

  if (intent === "delete") {
    const { error } = await supabase.from("spaces").delete().eq("id", listingId).eq("host_id", userId);
    if (error) redirect(withMessage(returnPath, "error", "Only draft listings can be deleted."));
    revalidatePath("/host/listings");
    redirect(withMessage(returnPath, "success", "Draft listing deleted."));
  }

  const nextStatus: SpaceStatus = intent === "submit" ? "pending_review" : "draft";
  const { error } = await supabase.from("spaces").update({ status: nextStatus }).eq("id", listingId).eq("host_id", userId);
  if (error) redirect(withMessage(returnPath, "error", error.message));

  revalidatePath("/host/listings");
  revalidatePath("/admin/listings");
  redirect(withMessage(returnPath, "success", nextStatus === "pending_review" ? "Listing submitted for review." : "Listing moved to draft."));
}
