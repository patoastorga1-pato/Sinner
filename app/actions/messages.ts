"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeRedirectPath, withMessage } from "@/lib/auth/redirect";
import { requireUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireMessageSupabase(returnPath: string) {
  const auth = await requireUser(returnPath);
  const supabase = await createClient();
  if (!supabase) redirect(withMessage(returnPath, "error", "Connect Supabase to continue."));
  return { supabase, userId: auth.user.id };
}

export async function startSpaceConversationAction(formData: FormData) {
  const spaceId = value(formData, "space_id");
  const returnPath = safeRedirectPath(value(formData, "return_path"), spaceId ? `/book/${spaceId}` : "/spaces");
  const body = value(formData, "body");
  const { supabase } = await requireMessageSupabase(returnPath);

  if (!body) redirect(withMessage(returnPath, "error", "Write a message first."));

  const { data, error } = await supabase.rpc("start_space_conversation", {
    p_space_id: spaceId,
    p_body: body,
  });

  if (error || !data) redirect(withMessage(returnPath, "error", error?.message || "Unable to start conversation."));

  revalidatePath("/messages");
  revalidatePath("/host/messages");
  redirect(withMessage(`/messages?conversation=${data}`, "success", "Message sent."));
}

export async function sendMessageAction(formData: FormData) {
  const conversationId = value(formData, "conversation_id");
  const returnPath = safeRedirectPath(value(formData, "return_path"), conversationId ? `/messages?conversation=${conversationId}` : "/messages");
  const body = value(formData, "body");
  const { supabase, userId } = await requireMessageSupabase(returnPath);

  if (!body) redirect(withMessage(returnPath, "error", "Write a message first."));

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: userId,
    body,
  });

  if (error) redirect(withMessage(returnPath, "error", error.message));

  revalidatePath("/messages");
  revalidatePath("/host/messages");
  redirect(withMessage(returnPath, "success", "Message sent."));
}
