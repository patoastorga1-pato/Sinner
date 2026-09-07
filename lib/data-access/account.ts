import { createClient } from "@/lib/supabase/server";
import type { NotificationRecord, Profile } from "@/lib/types/database";

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
