import type { ReservationSelection } from "@/lib/types/marketplace";

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();
const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(cache: Map<string, Intl.DateTimeFormat>, timezone: string, options: Intl.DateTimeFormatOptions) {
  const key = `${timezone}:${JSON.stringify(options)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const created = new Intl.DateTimeFormat("en-US", { timeZone: timezone, ...options });
  cache.set(key, created);
  return created;
}

export function formatBookingDate(value: string, timezone: string) {
  return formatter(dateFormatterCache, timezone, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatBookingTime(value: string, timezone: string) {
  return formatter(dateTimeFormatterCache, timezone, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatBookingRange(start: string, end: string, timezone: string) {
  return `${formatBookingDate(start, timezone)} · ${formatBookingTime(start, timezone)}-${formatBookingTime(end, timezone)}`;
}

export function getSelectionEndLabel(selection: Pick<ReservationSelection, "date" | "start" | "duration">) {
  const [hours = "0", minutes = "0"] = selection.start.split(":");
  const date = new Date(`${selection.date}T00:00:00`);
  date.setHours(Number(hours), Number(minutes), 0, 0);
  date.setHours(date.getHours() + selection.duration);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function minutesUntil(value: string | null) {
  if (!value) return null;
  const diff = new Date(value).getTime() - Date.now();
  if (!Number.isFinite(diff)) return null;
  return Math.max(0, Math.ceil(diff / 60000));
}
