import { notFound } from "next/navigation";
import { saveHostEventAction } from "@/app/actions/host-content";
import { AccountShell } from "@/components/account/AccountShell";
import { HostEventForm } from "@/components/host/HostContentForm";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { requireRole } from "@/lib/auth/server";
import { getHostEvent } from "@/lib/data-access/host-content";
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{error?:string}>}){const{id}=await params;await requireRole("host",`/host/events/${id}/edit`);const[e,q]=await Promise.all([getHostEvent(id),searchParams]);if(!e)notFound();return <AccountShell eyebrow="Host tools" title={`Edit ${e.name}`} copy="Manage event details, capacity and ticket inventory."><StatusMessage error={q.error}/><HostEventForm action={saveHostEventAction} event={e}/></AccountShell>}
