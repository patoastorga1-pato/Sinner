"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeRedirectPath, withMessage } from "@/lib/auth/redirect";
import { requireUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

const categories = new Set(["account", "booking", "host", "payment", "safety", "technical", "other"]);

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createSupportTicketAction(formData: FormData) {
  const returnPath = safeRedirectPath(value(formData, "return_path"), "/support");
  const auth = await requireUser(returnPath);
  const supabase = await createClient();
  if (!supabase) redirect(withMessage(returnPath, "error", "Connect Supabase to continue."));

  const subject = value(formData, "subject");
  const category = categories.has(value(formData, "category")) ? value(formData, "category") : "other";
  const description = value(formData, "description");

  if (subject.length < 3 || description.length < 10) {
    redirect(withMessage(returnPath, "error", "Add a subject and a clear description."));
  }

  const { error } = await supabase.from("support_tickets").insert({
    user_id: auth.user.id,
    subject,
    category,
    description,
  });

  if (error) redirect(withMessage(returnPath, "error", error.message));

  revalidatePath("/support");
  revalidatePath("/admin/support");
  redirect(withMessage(returnPath, "success", "Support request created."));
}
