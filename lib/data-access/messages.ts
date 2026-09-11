import { createClient } from "@/lib/supabase/server";

type UnknownRow = Record<string, unknown>;

function asRows(value: unknown): UnknownRow[] {
  return Array.isArray(value) ? (value as UnknownRow[]) : [];
}

function asObject(value: unknown): UnknownRow | null {
  if (!value || typeof value !== "object") return null;
  return Array.isArray(value) ? ((value[0] as UnknownRow | undefined) ?? null) : (value as UnknownRow);
}

export type ConversationSummary = {
  id: string;
  spaceId: string | null;
  spaceName: string;
  spaceSlug: string | null;
  participantName: string;
  lastMessage: string | null;
  lastMessageAt: string;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

export async function getConversations() {
  const supabase = await createClient();
  if (!supabase) return { conversations: [] as ConversationSummary[], selected: null as string | null, messages: [] as ConversationMessage[] };
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { conversations: [] as ConversationSummary[], selected: null as string | null, messages: [] as ConversationMessage[] };

  const { data: participantRows } = await supabase
    .from("conversation_participants")
    .select("conversation_id,user_id")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  const conversationIds = asRows(participantRows).map((row) => String(row.conversation_id));
  if (!conversationIds.length) return { conversations: [], selected: null, messages: [] };

  const [{ data: conversationsData }, { data: allParticipants }, { data: latestMessages }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id,space_id,booking_id,created_at,updated_at,spaces(name,slug)")
      .in("id", conversationIds)
      .order("updated_at", { ascending: false }),
    supabase.from("conversation_participants").select("conversation_id,user_id").in("conversation_id", conversationIds),
    supabase.from("messages").select("id,conversation_id,sender_id,body,created_at").in("conversation_id", conversationIds).order("created_at", { ascending: false }),
  ]);

  const otherIds = Array.from(new Set(asRows(allParticipants).map((row) => String(row.user_id)).filter((id) => id !== userData.user.id)));
  const profilesById = new Map<string, string>();
  if (otherIds.length) {
    const { data: profiles } = await supabase.from("public_profiles").select("id,display_name").in("id", otherIds);
    asRows(profiles).forEach((profile) => profilesById.set(String(profile.id), String(profile.display_name ?? "SINNER member")));
  }

  const latestByConversation = new Map<string, UnknownRow>();
  asRows(latestMessages).forEach((message) => {
    const conversationId = String(message.conversation_id);
    if (!latestByConversation.has(conversationId)) latestByConversation.set(conversationId, message);
  });

  const participantByConversation = new Map<string, string>();
  asRows(allParticipants).forEach((participant) => {
    const conversationId = String(participant.conversation_id);
    const participantId = String(participant.user_id);
    if (participantId !== userData.user.id && !participantByConversation.has(conversationId)) participantByConversation.set(conversationId, participantId);
  });

  const conversations = asRows(conversationsData).map((conversation) => {
    const space = asObject(conversation.spaces);
    const latest = latestByConversation.get(String(conversation.id));
    const otherId = participantByConversation.get(String(conversation.id));
    return {
      id: String(conversation.id),
      spaceId: conversation.space_id ? String(conversation.space_id) : null,
      spaceName: String(space?.name ?? "Private conversation"),
      spaceSlug: space?.slug ? String(space.slug) : null,
      participantName: otherId ? profilesById.get(otherId) ?? "SINNER member" : "SINNER member",
      lastMessage: latest?.body ? String(latest.body) : null,
      lastMessageAt: String(latest?.created_at ?? conversation.updated_at ?? conversation.created_at),
    };
  });

  return { conversations, selected: conversations[0]?.id ?? null, messages: [] as ConversationMessage[] };
}

export async function getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data } = await supabase
    .from("messages")
    .select("id,conversation_id,sender_id,body,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return asRows(data).map((message) => ({
    id: String(message.id),
    conversationId: String(message.conversation_id),
    senderId: String(message.sender_id),
    body: String(message.body ?? ""),
    createdAt: String(message.created_at),
    mine: String(message.sender_id) === userData.user.id,
  }));
}
