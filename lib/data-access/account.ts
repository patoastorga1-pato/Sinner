import { createClient } from "@/lib/supabase/server";
import type { HostApplicationRecord, NotificationRecord, PaymentRecord, Profile, UserPreferenceRecord } from "@/lib/types/database";

type UnknownRow = Record<string, unknown>;

function asRows(value: unknown): UnknownRow[] {
  return Array.isArray(value) ? (value as UnknownRow[]) : [];
}

export const defaultUserPreferences: Omit<UserPreferenceRecord, "user_id" | "created_at" | "updated_at"> = {
  language: "en",
  currency: "MXN",
  timezone: null,
  email_reservations: true,
  email_messages: true,
  email_verification: true,
  email_payments: true,
  email_security: true,
  in_app_reservations: true,
  in_app_messages: true,
  in_app_verification: true,
  in_app_payments: true,
  in_app_security: true,
  discreet_notifications: true,
  use_display_name: true,
};

export async function getCurrentProfile() {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", userData.user.id).maybeSingle();
  return data as Profile | null;
}

export async function getNotifications() {
  const supabase = await createClient();
  if (!supabase) return [] as NotificationRecord[];

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [] as NotificationRecord[];

  const { data } = await supabase
    .from("notifications")
    .select("id,user_id,type,title,body,read_at,data,created_at")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []) as NotificationRecord[];
}

export async function getCurrentUserPreferences(): Promise<Omit<UserPreferenceRecord, "user_id" | "created_at" | "updated_at">> {
  const supabase = await createClient();
  if (!supabase) return defaultUserPreferences;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return defaultUserPreferences;

  const { data, error } = await supabase
    .from("user_preferences")
    .select("language,currency,timezone,email_reservations,email_messages,email_verification,email_payments,email_security,in_app_reservations,in_app_messages,in_app_verification,in_app_payments,in_app_security,discreet_notifications,use_display_name")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error || !data) return defaultUserPreferences;

  return {
    ...defaultUserPreferences,
    ...(data as Partial<typeof defaultUserPreferences>),
  };
}

export async function getUnreadMessageCount() {
  const supabase = await createClient();
  if (!supabase) return 0;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 0;

  const { data: participantRows } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userData.user.id);
  const conversationIds = asRows(participantRows).map((row) => String(row.conversation_id));
  if (!conversationIds.length) return 0;

  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", conversationIds)
    .neq("sender_id", userData.user.id)
    .is("read_at", null);

  return count ?? 0;
}

export async function getCurrentUserPayments(): Promise<PaymentRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("payment_records")
    .select("id,booking_id,guest_id,space_id,provider,provider_reference,status,gross_amount,platform_fee,host_net_amount,currency,metadata,created_at,updated_at")
    .eq("guest_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return (data ?? []) as PaymentRecord[];
}

export async function getCurrentHostApplication(userId: string) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("host_applications")
    .select("id,user_id,status,applicant_email,request_note,decision_note,reviewed_by,reviewed_at,requested_at,updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  return data as HostApplicationRecord | null;
}
