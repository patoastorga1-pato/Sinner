import { Calendar, ChevronDown, Clock, MapPin, Search, Users } from "lucide-react";

const fields = [
  { label: "Where", name: "where", value: "Guadalajara", icon: MapPin, options: ["Guadalajara", "Zapopan"] },
  { label: "Date", name: "date", value: "Tonight", icon: Calendar, options: ["Tonight", "Tomorrow", "This weekend"] },
  { label: "Time", name: "time", value: "By the hour", icon: Clock, options: ["By the hour", "Half day", "Full night"] },
  { label: "Guests", name: "guests", value: "2 guests", icon: Users, options: ["2 guests", "4 guests", "6 guests", "8 guests"] },
];

export function SearchBar({ compact = false }: { compact?: boolean }) {
  return (
    <form
      action="/spaces"
      className={`violet-haze grid gap-2 rounded-2xl border border-white/[0.09] bg-sinner-coal/95 p-2 shadow-[0_26px_70px_rgba(0,0,0,0.42),0_0_45px_rgba(84,27,112,0.1)] backdrop-blur-xl ${compact ? "md:grid-cols-[1fr_1fr_1fr_1fr_auto]" : "md:grid-cols-[1.2fr_1fr_1fr_1fr_auto]"}`}
    >
      {fields.map((field, index) => {
        const Icon = field.icon;
        return (
          <label
            key={field.label}
            className={`group flex min-h-[68px] items-center gap-3 rounded-xl bg-white/[0.025] px-4 text-left transition duration-200 hover:bg-white/[0.055] focus-within:bg-white/[0.06] focus-within:ring-1 focus-within:ring-sinner-purple/45 md:rounded-none md:bg-transparent ${index > 0 ? "md:border-l md:border-white/[0.08]" : ""}`}
          >
            <Icon size={17} className="shrink-0 text-sinner-gold" />
            <span className="min-w-0 flex-1">
              <span className="block text-[0.68rem] font-semibold uppercase text-sinner-mist/65">{field.label}</span>
              <span className="mt-1 flex items-center gap-2">
                <select name={field.name} defaultValue={field.value} aria-label={field.label} className="min-w-0 flex-1 appearance-none bg-transparent text-sm text-sinner-ivory outline-none">
                {field.options.map((option) => (
                  <option key={option} value={option} className="bg-sinner-coal text-white">
                    {option}
                  </option>
                ))}
                </select>
                <ChevronDown size={14} className="shrink-0 text-sinner-mist/55 transition group-hover:text-sinner-goldSoft" />
              </span>
            </span>
          </label>
        );
      })}
      <button type="submit" className="flex min-h-[68px] items-center justify-center gap-2 rounded-xl bg-sinner-gold px-7 font-semibold text-sinner-black shadow-[0_10px_28px_rgba(214,170,88,0.14)] transition duration-200 hover:bg-sinner-goldSoft focus:outline-none focus:ring-2 focus:ring-sinner-goldSoft/40">
        <Search size={18} />
        Search
      </button>
    </form>
  );
}
