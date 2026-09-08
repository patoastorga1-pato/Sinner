import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { canGuestCancel, canHostApprove, canHostDecline, canTransitionBooking } from "../lib/bookings/constants.ts";
import { getSelectionEndLabel } from "../lib/bookings/time.ts";
import { calculatePriceEstimate } from "../lib/marketplace/pricing.ts";

test("booking state machine permits only expected Phase 3 transitions", () => {
  assert.equal(canTransitionBooking("draft", "pending"), true);
  assert.equal(canTransitionBooking("draft", "payment_pending"), true);
  assert.equal(canTransitionBooking("pending", "payment_pending"), true);
  assert.equal(canTransitionBooking("pending", "declined"), true);
  assert.equal(canTransitionBooking("payment_pending", "expired"), true);
  assert.equal(canTransitionBooking("payment_pending", "confirmed"), true);
  assert.equal(canTransitionBooking("pending", "confirmed"), false);
  assert.equal(canTransitionBooking("declined", "payment_pending"), false);
});

test("valid guest and host actions are status-specific", () => {
  assert.equal(canGuestCancel("pending"), true);
  assert.equal(canGuestCancel("payment_pending"), true);
  assert.equal(canGuestCancel("confirmed"), false);
  assert.equal(canHostApprove("pending"), true);
  assert.equal(canHostDecline("pending"), true);
  assert.equal(canHostApprove("payment_pending"), false);
});

test("pricing uses the configured centralized service fee", () => {
  process.env.NEXT_PUBLIC_SINNER_SERVICE_FEE_PERCENT = "11";
  const estimate = calculatePriceEstimate(
    { hourlyPrice: 350, overnightPrice: 6800, fullDayPrice: 9200, cleaningFee: 250 },
    { mode: "hourly", duration: 4 },
  );
  assert.deepEqual(estimate, {
    rate: 350,
    baseAmount: 1400,
    cleaningFee: 250,
    serviceFee: 180,
    total: 1830,
    serviceFeePercent: 11,
  });
});

test("local selection end labels support overnight hourly ranges", () => {
  assert.equal(getSelectionEndLabel({ date: "2026-10-18", start: "20:00", duration: 4 }), "00:00");
  assert.equal(getSelectionEndLabel({ date: "2026-10-18", start: "21:30", duration: 2 }), "23:30");
});

test("Phase 3 migration contains database-level overlap and hold guards", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260907230000_booking_engine_phase_3.sql", import.meta.url), "utf8");
  assert.match(sql, /bookings_no_active_overlap/);
  assert.match(sql, /exclude using gist/i);
  assert.match(sql, /status in \('payment_pending', 'confirmed'\)/);
  assert.match(sql, /expire_booking_holds/);
  assert.match(sql, /idempotency_key/);
  assert.match(sql, /at time zone space_row\.timezone/);
  assert.match(sql, /gen_random_bytes\(6\)/);
});
