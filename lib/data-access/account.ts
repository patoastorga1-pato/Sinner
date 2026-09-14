import { createClient } from "@/lib/supabase/server";
import type { HostApplicationRecord, NotificationRecord, PaymentRecord, Profile } from "@/lib/types/database";

type UnknownRow = Record<string, unknown>;

function asRows(value: unknown): UnknownRow[] {
  return Array.isArray(value) ? (value as UnknownRow[]) : [];
}

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
