import { createClient } from "@/lib/supabase/server";
import type { SupportTicketRecord } from "@/lib/types/database";

type UnknownRow = Record<string, unknown>;

function asRows(value: unknown): UnknownRow[] {
  return Array.isArray(value) ? (value as UnknownRow[]) : [];
}

function mapTicket(row: UnknownRow): SupportTicketRecord {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    subject: String(row.subject ?? ""),
    category: String(row.category ?? "other"),
    description: String(row.description ?? ""),
    status: String(row.status ?? "open") as SupportTicketRecord["status"],
    admin_response: row.admin_response ? String(row.admin_response) : null,
    assigned_admin_id: row.assigned_admin_id ? String(row.assigned_admin_id) : null,
    resolved_at: row.resolved_at ? String(row.resolved_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getSupportTickets(): Promise<SupportTicketRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data } = await supabase
    .from("support_tickets")
    .select("id,user_id,subject,category,description,status,admin_response,assigned_admin_id,resolved_at,created_at,updated_at")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  return asRows(data).map(mapTicket);
}
