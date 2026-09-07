import type { SupabaseClient } from "@supabase/supabase-js";
import { notificationTypes, type Json, type NotificationType } from "@/lib/types/database";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Json;
};

export async function createNotification(client: SupabaseClient, input: CreateNotificationInput) {
  if (!notificationTypes.includes(input.type)) {
    throw new Error("Unsupported notification type.");
  }

  return client.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    data: input.data ?? {},
  });
}

