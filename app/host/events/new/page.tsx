import { saveHostEventAction } from "@/app/actions/host-content";
import { AccountShell } from "@/components/account/AccountShell";
import { HostEventForm } from "@/components/host/HostContentForm";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { requireRole } from "@/lib/auth/server";
export default async function Page({searchParams}:{searchParams:Promise<{error?:string}>}){await requireRole("host","/host/events/new");const q=await searchParams;return <AccountShell eyebrow="Host tools" title="New event" copy="Create an event, define its first ticket type and submit it for moderation."><StatusMessage error={q.error}/><HostEventForm action={saveHostEventAction}/></AccountShell>}
