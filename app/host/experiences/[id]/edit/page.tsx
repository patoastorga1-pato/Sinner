import { notFound } from "next/navigation";
import { saveHostExperienceAction } from "@/app/actions/host-content";
import { AccountShell } from "@/components/account/AccountShell";
import { HostExperienceForm } from "@/components/host/HostContentForm";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { requireRole } from "@/lib/auth/server";
import { getExperienceCategories,getHostExperience } from "@/lib/data-access/host-content";
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{error?:string}>}){const{id}=await params;await requireRole("host",`/host/experiences/${id}/edit`);const[e,c,q]=await Promise.all([getHostExperience(id),getExperienceCategories(),searchParams]);if(!e)notFound();return <AccountShell eyebrow="Host tools" title={`Edit ${e.name}`} copy="Update the experience. Submitted changes return to moderation."><StatusMessage error={q.error}/><HostExperienceForm action={saveHostExperienceAction} experience={e} categories={c}/></AccountShell>}
