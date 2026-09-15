export const bookingErrorMessages: Record<string, string> = {
  auth_required: "Log in to continue with this reservation.",
  invalid_input: "Choose a valid date, time, duration and guest count.",
  unavailable_space: "This space is no longer accepting reservations.",
  past_time: "This start time is no longer available.",
  invalid_interval: "Choose a valid start and end time.",
  minimum_hours: "Minimum booking duration is not met.",
  guest_limit: "Maximum guest limit exceeded.",
  unavailable_interval: "This time is no longer available.",
  manual_block: "This time is blocked by the host.",
  booking_processed: "This request has already been processed.",
  access_denied: "You do not have access to that booking.",
  hold_expired: "This reservation hold has expired.",
  duplicate_request: "This booking request was already submitted.",
  rules_required: "You must agree to the space rules before continuing.",
  pricing_unavailable: "Pricing is not available for this booking type.",
};

export function bookingErrorMessage(code?: string | null) {
  if (!code) return "Unable to create booking. Please try again.";
  const normalized = code.toLowerCase();
  if (bookingErrorMessages[code]) return bookingErrorMessages[code];
  if (normalized.includes("auth_required") || normalized.includes("jwt")) return bookingErrorMessages.auth_required;
  if (normalized.includes("rules_required")) return bookingErrorMessages.rules_required;
  if (normalized.includes("invalid_input") || normalized.includes("invalid input syntax")) return bookingErrorMessages.invalid_input;
  if (normalized.includes("unavailable_space") || normalized.includes("space_not_found")) return bookingErrorMessages.unavailable_space;
  if (normalized.includes("past_time") || normalized.includes("minimum_notice")) return bookingErrorMessages.past_time;
  if (normalized.includes("invalid_interval")) return bookingErrorMessages.invalid_interval;
  if (normalized.includes("minimum_hours")) return bookingErrorMessages.minimum_hours;
  if (normalized.includes("guest_limit") || normalized.includes("capacity")) return bookingErrorMessages.guest_limit;
  if (normalized.includes("unavailable_interval")) return bookingErrorMessages.unavailable_interval;
  if (normalized.includes("manual_block")) return bookingErrorMessages.manual_block;
  if (normalized.includes("booking_processed")) return bookingErrorMessages.booking_processed;
  if (normalized.includes("access_denied") || normalized.includes("row-level security") || normalized.includes("permission denied")) return bookingErrorMessages.access_denied;
  if (normalized.includes("hold_expired")) return bookingErrorMessages.hold_expired;
  if (normalized.includes("duplicate") || normalized.includes("idempotency")) return bookingErrorMessages.duplicate_request;
  if (normalized.includes("pricing_unavailable")) return bookingErrorMessages.pricing_unavailable;
  return "Unable to create booking. Please try again.";
}
