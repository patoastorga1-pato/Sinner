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

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
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
  const parsed = profileSchema.safeParse({
    firstName: value(formData, "firstName"),
    lastName: value(formData, "lastName"),
    displayName: value(formData, "displayName"),
    bio: value(formData, "bio"),
  });

  if (!parsed.success) {
    redirect(withMessage("/settings", "error", firstValidationError(parsed.error)));
  }

  const supabase = await requireSupabase("/settings");
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login?redirect=/settings");

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      display_name: parsed.data.displayName || null,
      bio: parsed.data.bio || null,
    })
    .eq("id", data.user.id);

  if (error) {
    redirect(withMessage("/settings", "error", error.message));
  }

  revalidatePath("/", "layout");
  redirect("/settings?success=Profile+updated.");
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
  const parsed = resetPasswordSchema.safeParse({
    password: value(formData, "password"),
    confirmPassword: value(formData, "confirmPassword"),
  });

  if (!parsed.success) redirect(withMessage("/settings", "error", firstValidationError(parsed.error)));
  const supabase = await requireSupabase("/settings");
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) redirect(withMessage("/settings", "error", error.message));
  redirect("/settings?success=Password+updated.");
}

export async function configurationAvailable() {
  return isSupabaseConfigured();
}
