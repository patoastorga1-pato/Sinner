import { BadgeCheck, CalendarDays, ShieldCheck, UserRound } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { requireUser } from "@/lib/auth/server";
import { getCurrentProfile } from "@/lib/data-access/account";

export default async function ProfilePage() {
  const [auth, profile] = await Promise.all([requireUser("/profile"), getCurrentProfile()]);

  return (
    <AccountShell title="Profile" copy="Your private account information and verification status.">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="premium-panel p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-sinner-gold/25 text-sinner-goldSoft"><UserRound size={25} /></span>
            <div>
              <h2 className="font-display text-3xl text-sinner-ivory">{profile?.display_name || `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "SINNER member"}</h2>
              <p className="mt-1 text-sm text-sinner-mist">{auth.user.email}</p>
            </div>
          </div>
          <p className="mt-7 max-w-2xl leading-7 text-sinner-mist">{profile?.bio || "Add a short private bio from Settings."}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            {auth.roles.map((role) => <span key={role} className="rounded-full border border-sinner-gold/20 px-3 py-1.5 text-xs font-semibold uppercase text-sinner-goldSoft">{role}</span>)}
          </div>
        </section>
        <aside className="premium-panel p-6">
          <h2 className="font-semibold text-sinner-ivory">Account status</h2>
          <div className="mt-5 grid gap-4 text-sm">
            <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sinner-mist"><BadgeCheck size={16} /> Age verification</span><span className="capitalize text-sinner-goldSoft">{profile?.age_verification_status ?? "unverified"}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sinner-mist"><ShieldCheck size={16} /> Identity</span><span className="capitalize text-sinner-goldSoft">{profile?.identity_verification_status ?? "unverified"}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sinner-mist"><CalendarDays size={16} /> Member since</span><span className="text-sinner-ivory">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Pending"}</span></div>
          </div>
        </aside>
      </div>
    </AccountShell>
  );
}

