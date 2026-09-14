import Link from "next/link";
import { Bell, CalendarDays, Heart, MessageCircle, UserRound } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountVerificationPanel } from "@/components/account/AccountVerificationPanel";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { requireUser } from "@/lib/auth/server";
import { formatBookingDate, formatBookingTime } from "@/lib/bookings/time";
import { getCurrentProfile, getUnreadMessageCount } from "@/lib/data-access/account";
import { getGuestBookings } from "@/lib/data-access/bookings";
import { getConversations } from "@/lib/data-access/messages";
import { getFavoriteSpaces } from "@/lib/data-access/marketplace";

function displayName(profile: Awaited<ReturnType<typeof getCurrentProfile>>) {
  return profile?.display_name || `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "SINNER member";
}

function memberSince(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Pending";
}

function Avatar({ src, name }: { src?: string | null; name: string }) {
  if (src) {
    return <img src={src} alt={`${name} avatar`} className="h-20 w-20 rounded-full border border-sinner-gold/25 object-cover" />;
  }
  return (
    <span className="grid h-20 w-20 place-items-center rounded-full border border-sinner-gold/25 bg-sinner-gold/10 text-sinner-goldSoft">
      <UserRound size={34} />
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, detail, href }: { icon: typeof CalendarDays; label: string; value: string; detail: string; href: string }) {
  return (
    <Link href={href} className="group rounded-2xl border hairline bg-white/[0.018] p-5 transition duration-200 hover:border-sinner-gold/25 hover:bg-white/[0.035]">
      <span className="grid h-10 w-10 place-items-center rounded-full border border-sinner-gold/20 text-sinner-goldSoft">
        <Icon size={18} />
      </span>
      <p className="mt-5 text-xs font-semibold uppercase text-sinner-mist/70">{label}</p>
      <h3 className="mt-2 font-display text-3xl leading-tight text-sinner-ivory">{value}</h3>
      <p className="mt-2 text-sm leading-6 text-sinner-mist">{detail}</p>
    </Link>
  );
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const [auth, params] = await Promise.all([requireUser("/profile"), searchParams]);
  const [profile, bookings, conversationsResult, favorites, unreadMessages] = await Promise.all([
    getCurrentProfile(),
    getGuestBookings(auth.user.id),
    getConversations(),
    getFavoriteSpaces(),
    getUnreadMessageCount(),
  ]);
  const name = displayName(profile);
  const nextBooking = bookings
    .filter((booking) => booking.status === "confirmed" && new Date(booking.startDatetime).getTime() >= Date.now())
    .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())[0];

  return (
    <AccountShell title="Account" copy="Manage your profile, bookings, privacy and account settings.">
      <StatusMessage error={params.error} success={params.success} />
      <div className="grid gap-6">
        <section className="premium-panel p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-5">
              <Avatar src={profile?.avatar_url} name={name} />
              <div className="min-w-0">
                <h2 className="font-display text-4xl leading-tight text-sinner-ivory">{name}</h2>
                <p className="mt-2 break-all text-sm text-sinner-mist">{auth.user.email}</p>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-sinner-mist">{profile?.bio || "Add a short private bio from Settings."}</p>
                <p className="mt-4 text-xs uppercase text-sinner-mist/60">Member since {memberSince(profile?.created_at)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/settings" className="inline-flex min-h-11 items-center rounded-lg bg-sinner-gold px-4 text-sm font-semibold text-black transition hover:bg-sinner-goldSoft">Edit profile</Link>
              {auth.roles.includes("host") ? <Link href="/host/dashboard" className="inline-flex min-h-11 items-center rounded-lg border border-sinner-gold/25 px-4 text-sm font-semibold text-sinner-goldSoft transition hover:bg-sinner-gold/10">Host dashboard</Link> : null}
              {auth.roles.includes("admin") ? <Link href="/admin" className="inline-flex min-h-11 items-center rounded-lg border border-sinner-gold/25 px-4 text-sm font-semibold text-sinner-goldSoft transition hover:bg-sinner-gold/10">Admin panel</Link> : null}
            </div>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-3">
          <MetricCard
            icon={CalendarDays}
            label="Next booking"
            value={nextBooking?.space.name ?? "No upcoming booking"}
            detail={nextBooking ? `${formatBookingDate(nextBooking.startDatetime, nextBooking.timezone)} · ${formatBookingTime(nextBooking.startDatetime, nextBooking.timezone)}` : "Confirmed reservations will appear here."}
            href="/bookings?tab=upcoming"
          />
          <MetricCard
            icon={MessageCircle}
            label="Unread messages"
            value={String(unreadMessages)}
            detail={conversationsResult.conversations.length ? `${conversationsResult.conversations.length} private conversations` : "No conversations yet."}
            href="/messages"
          />
          <MetricCard
            icon={Heart}
            label="Favorites"
            value={favorites.length ? `${favorites.length} saved ${favorites.length === 1 ? "space" : "spaces"}` : "No saved spaces"}
            detail={favorites.length ? "Saved listings are ready from your account." : "Save spaces from the catalog to compare later."}
            href="/favorites"
          />
        </div>

        {auth.unreadNotifications ? (
          <Link href="/notifications" className="flex items-center gap-3 rounded-xl border border-sinner-gold/20 bg-sinner-gold/5 p-4 text-sm text-sinner-goldSoft">
            <Bell size={18} />
            You have {auth.unreadNotifications} unread {auth.unreadNotifications === 1 ? "notification" : "notifications"}.
          </Link>
        ) : null}

        <AccountVerificationPanel profile={profile} />
      </div>
    </AccountShell>
  );
}
