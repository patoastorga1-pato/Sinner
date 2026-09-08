import { Calendar, ChevronDown, Clock, Hourglass, MapPin, Search, Users } from "lucide-react";
import { LocationAutocomplete } from "@/components/location/LocationAutocomplete";
import { getLocalDateInputValue, searchQueryToParams } from "@/lib/marketplace/search";
import type { SpaceSearchQuery } from "@/lib/types/marketplace";

const startTimes = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
const guestOptions = Array.from({ length: 30 }, (_, index) => index + 1);

function FieldShell({ id, label, icon: Icon, divider, children }: { id: string; label: string; icon: typeof MapPin; divider?: boolean; children: React.ReactNode }) {
  return (
    <div className={`group flex min-h-[76px] min-w-0 items-center gap-3.5 rounded-[1rem] bg-white/[0.028] px-5 text-left transition duration-300 hover:bg-white/[0.052] focus-within:bg-white/[0.06] focus-within:ring-1 focus-within:ring-sinner-gold/25 xl:rounded-none xl:bg-transparent ${divider ? "xl:border-l xl:border-white/[0.055]" : ""}`}>
      <Icon size={18} className="shrink-0 text-sinner-gold" />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-[0.7rem] font-semibold uppercase text-sinner-mist/70">{label}</label>
        <div className="mt-1.5 flex min-w-0 items-center gap-2.5">{children}</div>
      </div>
    </div>
  );
}

export function SearchBar({ compact = false, query }: { compact?: boolean; query?: SpaceSearchQuery }) {
  const preserved = query ? searchQueryToParams(query) : new URLSearchParams();
  ["location", "date", "start", "duration", "guests", "page"].forEach((key) => preserved.delete(key));
  const start = query?.start || "20:00";
  const duration = query?.duration ?? 4;
  const guests = query?.guests ?? 2;

  return (
    <form action="/spaces" method="get" className={`violet-haze grid gap-2.5 rounded-[1.35rem] border border-white/[0.065] bg-sinner-coal/95 p-2.5 shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_58px_rgba(84,27,112,0.12)] backdrop-blur-2xl md:grid-cols-2 xl:grid-cols-[minmax(190px,1.2fr)_minmax(155px,1fr)_minmax(124px,.72fr)_minmax(124px,.72fr)_minmax(116px,.65fr)_auto] ${compact ? "mt-8" : ""}`}>
      {Array.from(preserved.entries()).map(([name, value]) => <input key={`${name}-${value}`} type="hidden" name={name} value={value} />)}
      <FieldShell id="space-location" label="Where" icon={MapPin}>
        <LocationAutocomplete id="space-location" defaultValue={query?.location} />
      </FieldShell>
      <FieldShell id="space-date" label="Date" icon={Calendar} divider>
        <input id="space-date" type="date" name="date" min={getLocalDateInputValue()} defaultValue={query?.date} className="min-w-0 flex-1 bg-transparent text-[0.95rem] text-sinner-ivory outline-none [color-scheme:dark]" />
      </FieldShell>
      <FieldShell id="space-start" label="Start" icon={Clock} divider>
        <select id="space-start" name="start" defaultValue={start} className="min-w-0 flex-1 appearance-none bg-transparent text-[0.95rem] text-sinner-ivory outline-none">
          {startTimes.map((time) => <option key={time} value={time} className="bg-sinner-coal text-white">{time}</option>)}
        </select><ChevronDown size={14} className="shrink-0 text-sinner-mist/55" />
      </FieldShell>
      <FieldShell id="space-duration" label="Duration" icon={Hourglass} divider>
        <select id="space-duration" name="duration" defaultValue={duration} className="min-w-0 flex-1 appearance-none bg-transparent text-[0.95rem] text-sinner-ivory outline-none">
          {Array.from({ length: 12 }, (_, index) => index + 1).map((hours) => <option key={hours} value={hours} className="bg-sinner-coal text-white">{hours} {hours === 1 ? "hour" : "hours"}</option>)}
        </select><ChevronDown size={14} className="shrink-0 text-sinner-mist/55" />
      </FieldShell>
      <FieldShell id="space-guests" label="Guests" icon={Users} divider>
        <select id="space-guests" name="guests" defaultValue={guests} className="min-w-0 flex-1 appearance-none bg-transparent text-[0.95rem] text-sinner-ivory outline-none">
          {guestOptions.map((count) => <option key={count} value={count} className="bg-sinner-coal text-white">{count} {count === 1 ? "guest" : "guests"}</option>)}
        </select><ChevronDown size={14} className="shrink-0 text-sinner-mist/55" />
      </FieldShell>
      <button type="submit" className="flex min-h-[76px] items-center justify-center gap-2.5 rounded-[1rem] bg-sinner-gold px-8 font-semibold text-sinner-black shadow-[0_14px_34px_rgba(214,170,88,0.26),inset_0_1px_0_rgba(255,255,255,0.28)] transition duration-300 hover:bg-sinner-goldSoft hover:shadow-[0_18px_42px_rgba(214,170,88,0.34),inset_0_1px_0_rgba(255,255,255,0.32)] focus:outline-none focus:ring-2 focus:ring-sinner-goldSoft/40 md:col-span-2 xl:col-span-1"><Search size={18} />Search</button>
    </form>
  );
}
