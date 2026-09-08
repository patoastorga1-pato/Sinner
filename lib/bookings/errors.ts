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
  return bookingErrorMessages[code] ?? "Unable to create booking. Please try again.";
}
