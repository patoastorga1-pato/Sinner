import Link from "next/link";
import { BadgeCheck, FileCheck2, ShieldCheck } from "lucide-react";
import type { Profile, VerificationStatus } from "@/lib/types/database";

function statusLabel(status: VerificationStatus) {
  if (status === "unverified") return "Not verified";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusClass(status: VerificationStatus | "verified") {
  if (status === "verified") return "border-emerald-400/25 bg-emerald-400/5 text-emerald-200";
  if (status === "pending") return "border-sinner-gold/25 bg-sinner-gold/5 text-sinner-goldSoft";
  if (status === "rejected") return "border-rose-400/25 bg-rose-400/5 text-rose-200";
  return "border-white/[0.1] bg-white/[0.025] text-sinner-mist";
}

function VerificationRow({
  icon: Icon,
  label,
  detail,
  status,
}: {
  icon: typeof BadgeCheck;
  label: string;
  detail: string;
  status: VerificationStatus | "verified";
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border hairline bg-black/20 p-4">
      <div className="flex gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-sinner-gold/20 text-sinner-goldSoft">
          <Icon size={17} />
        </span>
        <div>
          <p className="font-medium text-sinner-ivory">{label}</p>
          <p className="mt-1 text-xs leading-5 text-sinner-mist">{detail}</p>
        </div>
      </div>
      <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(status)}`}>
        {status === "verified" ? "Verified" : statusLabel(status)}
      </span>
    </div>
  );
}

export function AccountVerificationPanel({ profile, compact = false }: { profile: Profile | null; compact?: boolean }) {
  const adultConfirmed = Boolean(profile?.adult_confirmation_at);
  const ageStatus = profile?.age_verification_status ?? "unverified";
  const identityStatus = profile?.identity_verification_status ?? "unverified";
  const completed = [adultConfirmed, ageStatus === "verified", identityStatus === "verified"].filter(Boolean).length;
  const progress = Math.round((completed / 3) * 100);
  const needsAction = ageStatus === "unverified" || ageStatus === "rejected" || identityStatus === "unverified" || identityStatus === "rejected";

  return (
    <section className="premium-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-sinner-goldSoft">Account verification</p>
          <h2 className="mt-2 font-display text-3xl text-sinner-ivory">Account setup</h2>
          <p className="mt-2 text-sm text-sinner-mist">{completed} of 3 completed</p>
        </div>
        {needsAction ? (
          <Link href="/verification" className="inline-flex min-h-10 items-center rounded-lg bg-sinner-gold px-4 text-sm font-semibold text-black transition hover:bg-sinner-goldSoft">
            Verify
          </Link>
        ) : null}
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-sinner-gold transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className={`mt-5 grid gap-3 ${compact ? "" : "xl:grid-cols-3"}`}>
        <VerificationRow
          icon={BadgeCheck}
          label="18+ confirmation"
          detail="Confirmed during account creation."
          status={adultConfirmed ? "verified" : "unverified"}
        />
        <VerificationRow
          icon={FileCheck2}
          label="Age verification"
          detail={profile?.age_verification_document_path ? "Identification photo received for admin review." : "Requires a private ID photo upload."}
          status={ageStatus}
        />
        <VerificationRow
          icon={ShieldCheck}
          label="Identity verification"
          detail={profile?.gender ? "Identity selection saved as hombre or mujer." : "Choose hombre or mujer in verification."}
          status={identityStatus}
        />
      </div>

      {profile?.age_verification_rejection_reason ? (
        <p className="mt-4 rounded-lg border border-rose-400/25 bg-rose-400/5 px-4 py-3 text-sm leading-6 text-rose-100">
          Rejection reason: {profile.age_verification_rejection_reason}
        </p>
      ) : null}
    </section>
  );
}
