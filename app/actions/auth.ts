"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/config/env";
import { safeRedirectPath, withMessage } from "@/lib/auth/redirect";
import {
  emailSchema,
  firstValidationError,
  loginSchema,
  profileSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

const identityDocumentBucket = "identity-documents";
const identityDocumentMaxBytes = 8 * 1024 * 1024;
const identityDocumentMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const avatarBucket = "avatars";
const avatarMaxBytes = 5 * 1024 * 1024;
const avatarMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const supportedLanguages = new Set(["es-MX", "en"]);
const supportedCurrencies = new Set(["MXN"]);
const supportedTimezones = new Set([
  "",
  "America/Mexico_City",
  "America/Cancun",
  "America/Monterrey",
  "America/Merida",
  "America/Bahia_Banderas",
  "America/Mazatlan",
  "America/Chihuahua",
  "America/Hermosillo",
  "America/Tijuana",
  "America/Ciudad_Juarez",
]);

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function uploadedFile(formData: FormData, key: string) {
  const entry = formData.get(key);
  return entry instanceof File && entry.size > 0 ? entry : null;
}

function documentExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function checked(formData: FormData, key: string) {
  return ["true", "1", "on", "yes"].includes(value(formData, key).toLowerCase());
}

function avatarStoragePathFromPublicUrl(publicUrl: string | null | undefined) {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${avatarBucket}/`;
  const index = publicUrl.indexOf(marker);
  return index >= 0 ? decodeURIComponent(publicUrl.slice(index + marker.length)) : null;
}

async function requireSupabase(returnPath: string) {
  const supabase = await createClient();

  if (!supabase) {
    redirect(withMessage(returnPath, "error", "Connect Supabase in .env.local to enable accounts."));
  }

  return supabase;
}

export async function loginAction(formData: FormData) {
  const requestedRedirect = safeRedirectPath(value(formData, "redirect"), "/");
  const parsed = loginSchema.safeParse({ email: value(formData, "email"), password: value(formData, "password") });

  if (!parsed.success) {
    redirect(withMessage(`/login?redirect=${encodeURIComponent(requestedRedirect)}`, "error", firstValidationError(parsed.error)));
  }

  const supabase = await requireSupabase(`/login?redirect=${encodeURIComponent(requestedRedirect)}`);
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(withMessage(`/login?redirect=${encodeURIComponent(requestedRedirect)}`, "error", error.message));
  }

  revalidatePath("/", "layout");
  redirect(requestedRedirect);
}

export async function signupAction(formData: FormData) {
  const parsed = signupSchema.safeParse({
    firstName: value(formData, "firstName"),
    lastName: value(formData, "lastName"),
    email: value(formData, "email"),
    password: value(formData, "password"),
    confirmPassword: value(formData, "confirmPassword"),
    dateOfBirth: value(formData, "dateOfBirth"),
    adultConfirmation: value(formData, "adultConfirmation"),
    legalAcceptance: value(formData, "legalAcceptance"),
  });

  if (!parsed.success) {
    redirect(withMessage("/signup", "error", firstValidationError(parsed.error)));
  }

  const supabase = await requireSupabase("/signup");
  const acceptedAt = new Date().toISOString();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/profile`,
      data: {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        display_name: `${parsed.data.firstName} ${parsed.data.lastName}`,
        date_of_birth: parsed.data.dateOfBirth,
        terms_accepted_at: acceptedAt,
        privacy_accepted_at: acceptedAt,
        adult_confirmation_at: acceptedAt,
      },
    },
  });

  if (error) {
    redirect(withMessage("/signup", "error", error.message));
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/profile?success=Account+created.");
  }

  redirect("/login?success=Check+your+email+to+verify+your+account.");
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = emailSchema.safeParse({ email: value(formData, "email") });

  if (!parsed.success) {
    redirect(withMessage("/forgot-password", "error", firstValidationError(parsed.error)));
  }

  const supabase = await requireSupabase("/forgot-password");
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
  });

  if (error) {
    redirect(withMessage("/forgot-password", "error", error.message));
  }

  redirect("/forgot-password?success=Password+reset+instructions+have+been+sent.");
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    password: value(formData, "password"),
    confirmPassword: value(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    redirect(withMessage("/reset-password", "error", firstValidationError(parsed.error)));
  }

  const supabase = await requireSupabase("/reset-password");
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    redirect(withMessage("/reset-password", "error", error.message));
  }

  redirect("/login?success=Password+updated.+You+can+now+log+in.");
}

export async function logoutAction() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateProfileAction(formData: FormData) {
  const returnPath = safeRedirectPath(value(formData, "return_path"), "/settings");
  const parsed = profileSchema.safeParse({
    firstName: value(formData, "firstName"),
    lastName: value(formData, "lastName"),
    displayName: value(formData, "displayName"),
    avatarUrl: value(formData, "avatarUrl"),
    bio: value(formData, "bio"),
  });

  if (!parsed.success) {
    redirect(withMessage(returnPath, "error", firstValidationError(parsed.error)));
  }

  const supabase = await requireSupabase(returnPath);
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      display_name: parsed.data.displayName || null,
      avatar_url: parsed.data.avatarUrl || null,
      bio: parsed.data.bio || null,
    })
    .eq("id", data.user.id);

  if (error) {
    redirect(withMessage(returnPath, "error", error.message));
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  revalidatePath("/settings");
  redirect(withMessage(returnPath, "success", "Profile updated."));
}

export async function updateSettingsAction(formData: FormData) {
  const returnPath = "/settings";
  const parsed = profileSchema.safeParse({
    firstName: value(formData, "firstName"),
    lastName: value(formData, "lastName"),
    displayName: value(formData, "displayName"),
    avatarUrl: "",
    bio: value(formData, "bio"),
  });

  if (!parsed.success) {
    redirect(withMessage(returnPath, "error", firstValidationError(parsed.error)));
  }

  const language = value(formData, "language") || "en";
  const currency = value(formData, "currency") || "MXN";
  const timezone = value(formData, "timezone");

  if (!supportedLanguages.has(language)) redirect(withMessage(returnPath, "error", "Choose a supported language."));
  if (!supportedCurrencies.has(currency)) redirect(withMessage(returnPath, "error", "Choose a supported currency."));
  if (!supportedTimezones.has(timezone)) redirect(withMessage(returnPath, "error", "Choose a supported time zone."));

  const supabase = await requireSupabase(returnPath);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login?redirect=/settings");

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userData.user.id)
    .maybeSingle();

  let avatarUrl: string | null | undefined;
  const removeAvatar = checked(formData, "removeAvatar");
  const avatar = uploadedFile(formData, "avatar");

  if (avatar) {
    if (!avatarMimeTypes.has(avatar.type)) {
      redirect(withMessage(returnPath, "error", "Upload a JPG, PNG or WEBP profile photo."));
    }

    if (avatar.size > avatarMaxBytes) {
      redirect(withMessage(returnPath, "error", "Profile photo must be 5 MB or smaller."));
    }

    const storagePath = `${userData.user.id}/${crypto.randomUUID()}.${documentExtension(avatar)}`;
    const { error: uploadError } = await supabase.storage
      .from(avatarBucket)
      .upload(storagePath, avatar, {
        contentType: avatar.type,
        upsert: false,
      });

    if (uploadError) redirect(withMessage(returnPath, "error", "We could not update your profile photo right now."));

    avatarUrl = supabase.storage.from(avatarBucket).getPublicUrl(storagePath).data.publicUrl;
  } else if (removeAvatar) {
    avatarUrl = null;
  }

  const profileUpdate: {
    first_name: string;
    last_name: string;
    display_name: string | null;
    bio: string | null;
    avatar_url?: string | null;
  } = {
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    display_name: parsed.data.displayName || null,
    bio: parsed.data.bio || null,
  };

  if (avatarUrl !== undefined) profileUpdate.avatar_url = avatarUrl;

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userData.user.id);

  if (profileError) redirect(withMessage(returnPath, "error", profileError.message));

  const { error: preferencesError } = await supabase
    .from("user_preferences")
    .upsert({
      user_id: userData.user.id,
      language,
      currency,
      timezone: timezone || null,
      email_reservations: checked(formData, "email_reservations"),
      email_messages: checked(formData, "email_messages"),
      email_verification: checked(formData, "email_verification"),
      email_payments: checked(formData, "email_payments"),
      email_security: checked(formData, "email_security"),
      in_app_reservations: checked(formData, "in_app_reservations"),
      in_app_messages: checked(formData, "in_app_messages"),
      in_app_verification: checked(formData, "in_app_verification"),
      in_app_payments: checked(formData, "in_app_payments"),
      in_app_security: checked(formData, "in_app_security"),
      discreet_notifications: checked(formData, "discreet_notifications"),
      use_display_name: checked(formData, "use_display_name"),
    }, { onConflict: "user_id" });

  if (preferencesError) redirect(withMessage(returnPath, "error", "We could not save preferences right now."));

  const oldAvatarPath = avatarUrl !== undefined ? avatarStoragePathFromPublicUrl(String(currentProfile?.avatar_url ?? "")) : null;
  if (oldAvatarPath && oldAvatarPath.startsWith(`${userData.user.id}/`)) {
    await supabase.storage.from(avatarBucket).remove([oldAvatarPath]);
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  revalidatePath("/settings");
  redirect(withMessage(returnPath, "success", "Settings saved."));
}

export async function updateVerificationAction(formData: FormData) {
  const returnPath = safeRedirectPath(value(formData, "return_path"), "/verification");
  const gender = value(formData, "gender");

  if (gender !== "male" && gender !== "female") {
    redirect(withMessage(returnPath, "error", "Choose hombre or mujer for identity."));
  }

  const supabase = await requireSupabase(returnPath);
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("age_verification_document_path,age_verification_status")
    .eq("id", data.user.id)
    .maybeSingle();

  const document = uploadedFile(formData, "ageDocument");
  const needsDocument =
    !profile?.age_verification_document_path || profile.age_verification_status === "rejected";

  const updates: {
    gender: "male" | "female";
    identity_verification_status: "verified";
    age_verification_document_path?: string;
    age_verification_status?: "pending";
    age_verification_submitted_at?: string;
    age_verification_reviewed_at?: null;
    age_verification_rejection_reason?: null;
  } = {
    gender,
    identity_verification_status: "verified",
  };

  if (document) {
    if (!identityDocumentMimeTypes.has(document.type)) {
      redirect(withMessage(returnPath, "error", "Upload a JPG, PNG or WEBP identification photo."));
    }

    if (document.size > identityDocumentMaxBytes) {
      redirect(withMessage(returnPath, "error", "Identification photo must be 8 MB or smaller."));
    }

    const storagePath = `${data.user.id}/${crypto.randomUUID()}.${documentExtension(document)}`;
    const { error: uploadError } = await supabase.storage
      .from(identityDocumentBucket)
      .upload(storagePath, document, {
        contentType: document.type,
        upsert: false,
      });

    if (uploadError) {
      redirect(withMessage(returnPath, "error", uploadError.message));
    }

    updates.age_verification_document_path = storagePath;
    updates.age_verification_status = "pending";
    updates.age_verification_submitted_at = new Date().toISOString();
    updates.age_verification_reviewed_at = null;
    updates.age_verification_rejection_reason = null;
  } else if (needsDocument) {
    redirect(withMessage(returnPath, "error", "Upload a photo of your identification to verify your age."));
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", data.user.id);

  if (error) {
    redirect(withMessage(returnPath, "error", error.message));
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  revalidatePath("/verification");
  revalidatePath("/settings");
  revalidatePath("/admin/profiles");
  redirect(withMessage(returnPath, "success", "Verification information saved."));
}

export async function becomeHostAction() {
  const supabase = await requireSupabase("/host/onboarding");
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?redirect=/host/onboarding");

  const { data: requestData, error } = await supabase.rpc("request_host_role", {
    p_request_note: null,
  });
  if (error) redirect(withMessage("/host/onboarding", "error", error.message));

  revalidatePath("/", "layout");
  revalidatePath("/host/onboarding");
  revalidatePath("/admin");
  const row = Array.isArray(requestData) ? requestData[0] : requestData;
  if (row?.status === "approved") redirect("/host/dashboard?success=Host+access+active.");
  redirect("/host/onboarding?success=Host+request+submitted.+An+admin+will+review+it.");
}

export async function markAllNotificationsReadAction() {
  const supabase = await requireSupabase("/notifications");
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?redirect=/notifications");

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", data.user.id)
    .is("read_at", null);

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function updatePasswordAction(formData: FormData) {
  const returnPath = safeRedirectPath(value(formData, "return_path"), "/security");
  const parsed = resetPasswordSchema.safeParse({
    password: value(formData, "password"),
    confirmPassword: value(formData, "confirmPassword"),
  });

  if (!parsed.success) redirect(withMessage(returnPath, "error", firstValidationError(parsed.error)));
  const supabase = await requireSupabase(returnPath);
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) redirect(withMessage(returnPath, "error", error.message));
  redirect(withMessage(returnPath, "success", "Password updated."));
}

export async function configurationAvailable() {
  return isSupabaseConfigured();
}
