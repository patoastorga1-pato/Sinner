"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { approveBookingAction, cancelBookingAction, declineBookingAction } from "@/app/actions/bookings";

function ActionButton({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "ghost" | "danger" }) {
  const { pending } = useFormStatus();
  const classes = {
    gold: "bg-sinner-gold text-black hover:bg-sinner-goldSoft",
    ghost: "border border-sinner-gold/25 text-sinner-goldSoft hover:bg-sinner-gold/10",
    danger: "border border-rose-300/30 text-rose-200 hover:bg-rose-500/10",
  };
  return (
    <button type="submit" disabled={pending} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-65 ${classes[tone]}`}>
      {pending ? <LoaderCircle size={16} className="animate-spin" /> : null}
      {pending ? "Working..." : children}
    </button>
  );
}

export function ApproveBookingForm({ bookingId, returnPath }: { bookingId: string; returnPath: string }) {
  return (
    <form action={approveBookingAction}>
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="return_path" value={returnPath} />
      <ActionButton>Approve</ActionButton>
    </form>
  );
}

export function DeclineBookingForm({ bookingId, returnPath }: { bookingId: string; returnPath: string }) {
  return (
    <form action={declineBookingAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="return_path" value={returnPath} />
      <select name="reason" defaultValue="Dates unavailable" className="h-11 rounded-lg border hairline bg-black/30 px-3 text-sm text-sinner-ivory outline-none">
        {["Dates unavailable", "Guest count", "House rules", "Other"].map((reason) => <option key={reason} value={reason} className="bg-sinner-coal">{reason}</option>)}
      </select>
      <ActionButton tone="ghost">Decline</ActionButton>
    </form>
  );
}

export function CancelBookingForm({ bookingId, returnPath, label = "Cancel" }: { bookingId: string; returnPath: string; label?: string }) {
  return (
    <form
      action={cancelBookingAction}
      onSubmit={(event) => {
        if (!window.confirm("Cancel this request or temporary hold?")) event.preventDefault();
      }}
      className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
    >
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="return_path" value={returnPath} />
      <input name="reason" placeholder="Optional reason" className="h-11 rounded-lg border hairline bg-black/30 px-3 text-sm text-sinner-ivory outline-none placeholder:text-sinner-mist/60" />
      <ActionButton tone="danger">{label}</ActionButton>
    </form>
  );
}
