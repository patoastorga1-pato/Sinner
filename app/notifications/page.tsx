import { Bell } from "lucide-react";
import { markAllNotificationsReadAction } from "@/app/actions/auth";
import { AccountShell } from "@/components/account/AccountShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireUser } from "@/lib/auth/server";
import { getNotifications } from "@/lib/data-access/account";

export default async function NotificationsPage() {
  await requireUser("/notifications");
  const notifications = await getNotifications();

  return (
    <AccountShell title="Notifications" copy="Account, booking, message and verification updates.">
      {notifications.length ? (
        <div>
          <form action={markAllNotificationsReadAction} className="mb-5 flex justify-end"><button type="submit" className="rounded-lg border border-sinner-gold/25 px-4 py-2 text-sm text-sinner-goldSoft">Mark all as read</button></form>
          <div className="divide-y hairline border-y hairline">{notifications.map((item) => <article key={item.id} className={`py-5 ${item.read_at ? "opacity-65" : ""}`}><div className="flex items-start justify-between gap-5"><div><h2 className="font-semibold text-sinner-ivory">{item.title}</h2><p className="mt-2 text-sm leading-6 text-sinner-mist">{item.body}</p></div>{!item.read_at ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sinner-violet" /> : null}</div><time className="mt-3 block text-xs text-sinner-mist/60">{new Date(item.created_at).toLocaleString()}</time></article>)}</div>
        </div>
      ) : <EmptyState icon={Bell} title="You are all caught up." copy="New booking, message and verification updates will appear here." />}
    </AccountShell>
  );
}

