import Link from "next/link";
import { MessageCircle, Send } from "lucide-react";
import { sendMessageAction } from "@/app/actions/messages";
import { AccountShell } from "@/components/account/AccountShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { requireUser } from "@/lib/auth/server";
import { getConversationMessages, getConversations } from "@/lib/data-access/messages";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ conversation?: string; error?: string; success?: string }> }) {
  const [, params, conversationsResult] = await Promise.all([requireUser("/messages"), searchParams, getConversations()]);
  const selectedId = params.conversation ?? conversationsResult.selected;
  const selected = conversationsResult.conversations.find((conversation) => conversation.id === selectedId) ?? conversationsResult.conversations[0];
  const messages = selected ? await getConversationMessages(selected.id) : [];

  return (
    <AccountShell title="Messages" copy="Private conversations with hosts and event organizers.">
      <StatusMessage error={params.error} success={params.success} />
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="premium-panel max-h-[680px] overflow-y-auto p-3">
          {conversationsResult.conversations.map((conversation) => (
            <Link key={conversation.id} href={`/messages?conversation=${conversation.id}`} className={`block rounded-lg p-4 transition ${selected?.id === conversation.id ? "bg-sinner-gold/10 text-sinner-ivory" : "text-sinner-mist hover:bg-white/[0.04]"}`}>
              <p className="truncate font-medium">{conversation.participantName}</p>
              <p className="mt-1 truncate text-xs">{conversation.spaceName}</p>
              <p className="mt-2 line-clamp-2 text-sm">{conversation.lastMessage || "No messages yet."}</p>
            </Link>
          ))}
          {!conversationsResult.conversations.length ? <p className="p-4 text-sm text-sinner-mist">No conversations yet.</p> : null}
        </aside>
        <section className="premium-panel min-h-[520px] p-5">
          {selected ? (
            <>
              <div className="border-b hairline pb-4">
                <p className="text-xs font-semibold uppercase text-sinner-goldSoft">{selected.spaceName}</p>
                <h2 className="mt-1 font-display text-3xl text-sinner-ivory">{selected.participantName}</h2>
              </div>
              <div className="mt-5 grid gap-3">
                {messages.map((message) => (
                  <div key={message.id} className={`max-w-[82%] rounded-xl border hairline p-4 text-sm leading-6 ${message.mine ? "ml-auto bg-sinner-gold/10 text-sinner-ivory" : "bg-black/25 text-sinner-mist"}`}>
                    <p>{message.body}</p>
                    <p className="mt-2 text-xs text-sinner-mist/60">{new Date(message.createdAt).toLocaleString()}</p>
                  </div>
                ))}
                {!messages.length ? <p className="text-sm text-sinner-mist">No visible messages in this conversation.</p> : null}
              </div>
              <form action={sendMessageAction} className="mt-6 grid gap-3 border-t hairline pt-5">
                <input type="hidden" name="conversation_id" value={selected.id} />
                <input type="hidden" name="return_path" value={`/messages?conversation=${selected.id}`} />
                <textarea name="body" rows={4} required placeholder="Write a discreet message..." className="rounded-lg border hairline bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-sinner-mist/50 focus:border-sinner-gold/45" />
                <button type="submit" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-sinner-gold px-4 text-sm font-semibold text-black transition hover:bg-sinner-goldSoft"><Send size={16} />Send</button>
              </form>
            </>
          ) : <EmptyState icon={MessageCircle} title="No conversations yet." copy="Start a conversation from a space detail page or after a booking." />}
        </section>
      </div>
    </AccountShell>
  );
}
