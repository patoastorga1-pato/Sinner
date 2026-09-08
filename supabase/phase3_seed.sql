-- Development-only Phase 3 booking seed. Apply after all Phase 3 migrations.
-- Do not use these demo records in production data.

insert into public.bookings(
  id, booking_reference, guest_id, space_id, booking_type, start_datetime, end_datetime, timezone, duration_hours,
  guest_count, status, hourly_rate_snapshot, base_amount, cleaning_fee, service_fee, total_amount, currency,
  guest_message, rules_accepted_at, hold_expires_at, cancellation_reason, cancelled_at, idempotency_key,
  pricing_snapshot, buffer_minutes_snapshot
) values
  ('40000000-0000-4000-8000-000000000005', 'SIN-DEMO01', '31000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'request', (current_date + 14 + time '20:00') at time zone 'America/Mexico_City', (current_date + 14 + time '23:00') at time zone 'America/Mexico_City', 'America/Mexico_City', 3, 2, 'pending', 350, 1050, 250, 140, 1440, 'MXN', 'Flexible on arrival time if needed.', now(), null, null, null, 'demo-pending-request', '{"source":"phase_3_demo"}', 45),
  ('40000000-0000-4000-8000-000000000006', 'SIN-DEMO02', '31000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'request', (current_date + 14 + time '20:30') at time zone 'America/Mexico_City', (current_date + 14 + time '22:30') at time zone 'America/Mexico_City', 'America/Mexico_City', 2, 2, 'declined', 350, 700, 250, 100, 1050, 'MXN', 'Overlapping request used for workflow testing.', now(), null, 'Dates unavailable', null, 'demo-declined-request', '{"source":"phase_3_demo"}', 45),
  ('40000000-0000-4000-8000-000000000007', 'SIN-DEMO03', '31000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'instant', (current_date + 12 + time '21:00') at time zone 'America/Mexico_City', (current_date + 12 + time '23:00') at time zone 'America/Mexico_City', 'America/Mexico_City', 2, 2, 'payment_pending', 280, 560, 200, 80, 840, 'MXN', 'Instant booking hold demo.', now(), now() + interval '15 minutes', null, null, 'demo-payment-hold', '{"source":"phase_3_demo"}', 30),
  ('40000000-0000-4000-8000-000000000008', 'SIN-DEMO04', '31000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000004', 'instant', (current_date + 10 + time '18:00') at time zone 'America/Cancun', (current_date + 10 + time '20:00') at time zone 'America/Cancun', 'America/Cancun', 2, 2, 'expired', 620, 1240, 180, 160, 1580, 'MXN', 'Expired Cancun hold demo.', now() - interval '1 hour', now() - interval '30 minutes', null, null, 'demo-expired-hold', '{"source":"phase_3_demo"}', 30),
  ('40000000-0000-4000-8000-000000000009', 'SIN-DEMO05', '31000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000007', 'request', (current_date + 16 + time '20:00') at time zone 'America/Tijuana', (current_date + 16 + time '22:00') at time zone 'America/Tijuana', 'America/Tijuana', 2, 4, 'cancelled', 1250, 2500, 450, 320, 3270, 'MXN', 'Cancelled Tijuana request demo.', now() - interval '2 hours', null, 'Guest changed schedule', now() - interval '1 hour', 'demo-cancelled-request', '{"source":"phase_3_demo"}', 60)
on conflict (id) do update set
  booking_reference = excluded.booking_reference,
  booking_type = excluded.booking_type,
  start_datetime = excluded.start_datetime,
  end_datetime = excluded.end_datetime,
  timezone = excluded.timezone,
  duration_hours = excluded.duration_hours,
  guest_count = excluded.guest_count,
  status = excluded.status,
  hourly_rate_snapshot = excluded.hourly_rate_snapshot,
  base_amount = excluded.base_amount,
  cleaning_fee = excluded.cleaning_fee,
  service_fee = excluded.service_fee,
  total_amount = excluded.total_amount,
  currency = excluded.currency,
  guest_message = excluded.guest_message,
  rules_accepted_at = excluded.rules_accepted_at,
  hold_expires_at = excluded.hold_expires_at,
  cancellation_reason = excluded.cancellation_reason,
  cancelled_at = excluded.cancelled_at,
  idempotency_key = excluded.idempotency_key,
  pricing_snapshot = excluded.pricing_snapshot,
  buffer_minutes_snapshot = excluded.buffer_minutes_snapshot;

insert into public.booking_events(booking_id, actor_id, event_type, from_status, to_status, metadata)
select b.id, b.guest_id, 'booking_created', null, b.status, jsonb_build_object('source', 'phase_3_seed')
from public.bookings b
where b.id in (
  '40000000-0000-4000-8000-000000000005',
  '40000000-0000-4000-8000-000000000006',
  '40000000-0000-4000-8000-000000000007',
  '40000000-0000-4000-8000-000000000008',
  '40000000-0000-4000-8000-000000000009'
)
  and not exists (
    select 1 from public.booking_events existing
    where existing.booking_id = b.id and existing.event_type = 'booking_created'
  );
