import { saveHostExperienceAction } from "@/app/actions/host-content";
import { AccountShell } from "@/components/account/AccountShell";
import { HostExperienceForm } from "@/components/host/HostContentForm";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { requireRole } from "@/lib/auth/server";
import { getExperienceCategories } from "@/lib/data-access/host-content";
export default async function Page({searchParams}:{searchParams:Promise<{error?:string}>}){await requireRole("host","/host/experiences/new");const [categories,q]=await Promise.all([getExperienceCategories(),searchParams]);return <AccountShell eyebrow="Host tools" title="New experience" copy="Create a classified experience and submit it for moderation."><StatusMessage error={q.error}/><HostExperienceForm action={saveHostExperienceAction} categories={categories}/></AccountShell>}
