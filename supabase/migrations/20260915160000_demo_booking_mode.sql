-- SINNER demo booking mode.
-- Keeps bookings fully testable before the real payment provider is connected.

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings(key, value, updated_at)
values ('sinner_demo_booking_mode', 'true'::jsonb, now())
on conflict (key) do update
set value = excluded.value,
    updated_at = now();

create or replace function private.setting_boolean(p_key text, p_fallback boolean)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select (value #>> '{}')::boolean from public.app_settings where key = p_key), p_fallback);
$$;

create or replace function private.validate_booking_transition(p_from public.booking_status, p_to public.booking_status)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_from = 'draft' and p_to in ('pending', 'payment_pending', 'confirmed') then true
    when p_from = 'pending' and p_to in ('payment_pending', 'confirmed', 'declined', 'cancelled') then true
    when p_from = 'payment_pending' and p_to in ('confirmed', 'expired', 'cancelled') then true
    when p_from = 'confirmed' and p_to in ('completed', 'cancelled', 'refunded', 'disputed') then true
    else false
  end;
$$;

create or replace function public.create_booking_request(
  p_space_id uuid,
  p_booking_type text,
  p_local_date date,
  p_start_time time,
  p_duration_hours integer,
  p_guest_count integer,
  p_guest_message text,
  p_rules_accepted boolean,
  p_idempotency_key text
)
returns table(id uuid, booking_reference text, status public.booking_status, hold_expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  space_row public.spaces%rowtype;
  pricing_row record;
  requested_start timestamptz;
  requested_end timestamptz;
  desired_type public.booking_type;
  desired_status public.booking_status;
  demo_mode boolean := private.setting_boolean('sinner_demo_booking_mode', true);
  hold_minutes integer;
  existing_booking public.bookings%rowtype;
  created_booking public.bookings%rowtype;
begin
  if current_user_id is null then raise exception 'auth_required'; end if;
  if not coalesce(p_rules_accepted, false) then raise exception 'rules_required'; end if;
  if p_local_date is null or p_start_time is null or p_duration_hours is null or p_duration_hours <= 0 or p_duration_hours > 24 or p_guest_count is null or p_guest_count < 1 then
    raise exception 'invalid_input';
  end if;
  if nullif(trim(coalesce(p_idempotency_key, '')), '') is null then raise exception 'invalid_input'; end if;

  select * into space_row
  from public.spaces
  where public.spaces.id = p_space_id
  for share;

  if not found or space_row.status <> 'approved' then raise exception 'unavailable_space'; end if;
  if p_guest_count > space_row.max_guests then raise exception 'guest_limit'; end if;
  if p_duration_hours < space_row.minimum_hours then raise exception 'minimum_hours'; end if;

  desired_type := case when p_booking_type = 'instant' then 'instant'::public.booking_type else 'request'::public.booking_type end;
  if desired_type = 'instant' and not space_row.instant_booking then raise exception 'unavailable_space'; end if;
  desired_status := case
    when desired_type = 'request' then 'pending'::public.booking_status
    when demo_mode then 'confirmed'::public.booking_status
    else 'payment_pending'::public.booking_status
  end;

  select * into existing_booking
  from public.bookings b
  where b.guest_id = current_user_id and b.idempotency_key = p_idempotency_key;
  if found then
    id := existing_booking.id;
    booking_reference := existing_booking.booking_reference;
    status := existing_booking.status;
    hold_expires_at := existing_booking.hold_expires_at;
    return next;
    return;
  end if;

  requested_start := (p_local_date + p_start_time) at time zone space_row.timezone;
  requested_end := requested_start + make_interval(hours => p_duration_hours);
  if requested_start < now() + make_interval(mins => space_row.minimum_booking_notice_minutes) then raise exception 'past_time'; end if;
  if requested_end <= requested_start then raise exception 'invalid_interval'; end if;

  perform public.expire_booking_holds();

  if private.manual_block_conflicts(p_space_id, requested_start, requested_end, space_row.timezone, space_row.buffer_minutes) then
    raise exception 'manual_block';
  end if;
  if private.active_booking_blocks(p_space_id, requested_start, requested_end, space_row.buffer_minutes) then
    raise exception 'unavailable_interval';
  end if;

  select * into pricing_row
  from private.calculate_booking_pricing(desired_type, p_duration_hours, space_row.hourly_price, space_row.overnight_price, space_row.full_day_price, space_row.cleaning_fee);

  hold_minutes := case when desired_status = 'payment_pending' then private.setting_integer('instant_hold_minutes', 15) else null end;

  begin
    insert into public.bookings(
      guest_id, space_id, booking_type, status, start_datetime, end_datetime, timezone, duration_hours,
      guest_count, hourly_rate_snapshot, base_amount, cleaning_fee, service_fee, total_amount, currency,
      guest_message, rules_accepted_at, hold_expires_at, idempotency_key, pricing_snapshot, buffer_minutes_snapshot
    )
    values (
      current_user_id, p_space_id, desired_type, desired_status, requested_start, requested_end, space_row.timezone, p_duration_hours,
      p_guest_count, pricing_row.hourly_rate_snapshot, pricing_row.base_amount, pricing_row.cleaning_fee, pricing_row.service_fee, pricing_row.total_amount, pricing_row.currency,
      nullif(trim(coalesce(p_guest_message, '')), ''), now(), case when hold_minutes is null then null else now() + make_interval(mins => hold_minutes) end,
      p_idempotency_key, pricing_row.pricing_snapshot || jsonb_build_object('demo_mode', demo_mode), space_row.buffer_minutes
    )
    returning * into created_booking;
  exception
    when exclusion_violation then raise exception 'unavailable_interval';
    when unique_violation then
      select * into existing_booking from public.bookings b where b.guest_id = current_user_id and b.idempotency_key = p_idempotency_key;
      if found then
        id := existing_booking.id;
        booking_reference := existing_booking.booking_reference;
        status := existing_booking.status;
        hold_expires_at := existing_booking.hold_expires_at;
        return next;
        return;
      end if;
      raise exception 'duplicate_request';
  end;

  perform private.create_booking_event(created_booking.id, current_user_id, 'booking_created', null, created_booking.status, jsonb_build_object('booking_type', desired_type, 'demo_mode', demo_mode));
  if created_booking.status = 'pending' then
    perform private.create_booking_event(created_booking.id, current_user_id, 'request_submitted', 'draft', 'pending', jsonb_build_object('demo_mode', demo_mode));
    perform private.create_notification(space_row.host_id, 'booking_requested', 'New booking request', space_row.name || ' · ' || to_char(requested_start at time zone space_row.timezone, 'Mon DD · HH24:MI'), jsonb_build_object('booking_id', created_booking.id, 'booking_reference', created_booking.booking_reference, 'demo_mode', demo_mode));
  elsif created_booking.status = 'confirmed' then
    perform private.create_booking_event(created_booking.id, current_user_id, 'booking_confirmed', 'draft', 'confirmed', jsonb_build_object('demo_mode', true));
    perform private.create_notification(current_user_id, 'booking_confirmed', 'Demo reservation confirmed', 'No payment was processed for this demo reservation.', jsonb_build_object('booking_id', created_booking.id, 'booking_reference', created_booking.booking_reference, 'demo_mode', true));
    perform private.create_notification(space_row.host_id, 'booking_confirmed', 'New demo reservation', space_row.name || ' · ' || to_char(requested_start at time zone space_row.timezone, 'Mon DD · HH24:MI'), jsonb_build_object('booking_id', created_booking.id, 'booking_reference', created_booking.booking_reference, 'demo_mode', true));
  else
    perform private.create_booking_event(created_booking.id, current_user_id, 'hold_created', 'draft', 'payment_pending', jsonb_build_object('hold_expires_at', created_booking.hold_expires_at));
    perform private.create_notification(current_user_id, 'booking_approved', 'Reservation temporarily held', 'Complete payment before your reservation hold expires.', jsonb_build_object('booking_id', created_booking.id, 'booking_reference', created_booking.booking_reference));
  end if;

  id := created_booking.id;
  booking_reference := created_booking.booking_reference;
  status := created_booking.status;
  hold_expires_at := created_booking.hold_expires_at;
  return next;
end;
$$;

create or replace function public.approve_booking_request(p_booking_id uuid)
returns table(id uuid, booking_reference text, status public.booking_status, hold_expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  booking_row public.bookings%rowtype;
  space_row public.spaces%rowtype;
  demo_mode boolean := private.setting_boolean('sinner_demo_booking_mode', true);
  next_status public.booking_status := case when private.setting_boolean('sinner_demo_booking_mode', true) then 'confirmed'::public.booking_status else 'payment_pending'::public.booking_status end;
  hold_minutes integer := private.setting_integer('host_approval_hold_minutes', 30);
begin
  if current_user_id is null then raise exception 'auth_required'; end if;
  perform public.expire_booking_holds();

  select * into booking_row from public.bookings where public.bookings.id = p_booking_id for update;
  if not found then raise exception 'access_denied'; end if;
  select * into space_row from public.spaces where public.spaces.id = booking_row.space_id for share;
  if space_row.host_id <> current_user_id and not private.is_admin() then raise exception 'access_denied'; end if;
  if booking_row.status <> 'pending' then raise exception 'booking_processed'; end if;
  if private.manual_block_conflicts(booking_row.space_id, booking_row.start_datetime, booking_row.end_datetime, booking_row.timezone, booking_row.buffer_minutes_snapshot) then
    raise exception 'manual_block';
  end if;
  if private.active_booking_blocks(booking_row.space_id, booking_row.start_datetime, booking_row.end_datetime, booking_row.buffer_minutes_snapshot) then
    raise exception 'unavailable_interval';
  end if;

  begin
    update public.bookings
    set status = next_status,
        hold_expires_at = case when next_status = 'payment_pending' then now() + make_interval(mins => hold_minutes) else null end,
        pricing_snapshot = coalesce(pricing_snapshot, '{}'::jsonb) || jsonb_build_object('demo_mode', demo_mode),
        updated_at = now()
    where public.bookings.id = booking_row.id
      and private.validate_booking_transition(booking_row.status, next_status)
    returning * into booking_row;
  exception
    when exclusion_violation then raise exception 'unavailable_interval';
  end;

  if booking_row.id is null then raise exception 'booking_processed'; end if;

  if next_status = 'confirmed' then
    perform private.create_booking_event(booking_row.id, current_user_id, 'host_approved', 'pending', 'confirmed', jsonb_build_object('demo_mode', true));
    perform private.create_booking_event(booking_row.id, current_user_id, 'booking_confirmed', 'pending', 'confirmed', jsonb_build_object('demo_mode', true));
    perform private.create_notification(booking_row.guest_id, 'booking_confirmed', 'Your demo reservation was approved', 'No payment was processed for this demo reservation.', jsonb_build_object('booking_id', booking_row.id, 'booking_reference', booking_row.booking_reference, 'demo_mode', true));
  else
    perform private.create_booking_event(booking_row.id, current_user_id, 'host_approved', 'pending', 'payment_pending', '{}'::jsonb);
    perform private.create_booking_event(booking_row.id, current_user_id, 'hold_created', 'pending', 'payment_pending', jsonb_build_object('hold_expires_at', booking_row.hold_expires_at));
    perform private.create_notification(booking_row.guest_id, 'booking_approved', 'Your booking request was approved', 'Complete payment before your reservation hold expires.', jsonb_build_object('booking_id', booking_row.id, 'booking_reference', booking_row.booking_reference));
  end if;

  id := booking_row.id;
  booking_reference := booking_row.booking_reference;
  status := booking_row.status;
  hold_expires_at := booking_row.hold_expires_at;
  return next;
end;
$$;

create or replace function public.cancel_booking_before_payment(p_booking_id uuid, p_reason text default null)
returns table(id uuid, booking_reference text, status public.booking_status)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  booking_row public.bookings%rowtype;
  space_row public.spaces%rowtype;
  previous_status public.booking_status;
  demo_mode boolean := private.setting_boolean('sinner_demo_booking_mode', true);
begin
  if current_user_id is null then raise exception 'auth_required'; end if;
  select * into booking_row from public.bookings where public.bookings.id = p_booking_id for update;
  if not found or booking_row.guest_id <> current_user_id then raise exception 'access_denied'; end if;
  if booking_row.status not in ('pending', 'payment_pending') and not (demo_mode and booking_row.status = 'confirmed') then
    raise exception 'booking_processed';
  end if;
  select * into space_row from public.spaces where public.spaces.id = booking_row.space_id for share;
  previous_status := booking_row.status;

  update public.bookings
  set status = 'cancelled',
      hold_expires_at = null,
      cancelled_at = now(),
      cancellation_reason = nullif(trim(coalesce(p_reason, '')), ''),
      updated_at = now()
  where public.bookings.id = booking_row.id
    and private.validate_booking_transition(booking_row.status, 'cancelled')
  returning * into booking_row;

  if booking_row.id is null then raise exception 'booking_processed'; end if;

  perform private.create_booking_event(booking_row.id, current_user_id, 'guest_cancelled', previous_status, 'cancelled', jsonb_build_object('reason', p_reason, 'demo_mode', demo_mode));
  perform private.create_notification(space_row.host_id, 'booking_cancelled', 'Booking cancelled', booking_row.booking_reference || ' was cancelled.', jsonb_build_object('booking_id', booking_row.id, 'booking_reference', booking_row.booking_reference, 'demo_mode', demo_mode));

  id := booking_row.id;
  booking_reference := booking_row.booking_reference;
  status := booking_row.status;
  return next;
end;
$$;

revoke all on function private.setting_boolean(text, boolean) from PUBLIC, anon, authenticated;
revoke all on function private.validate_booking_transition(public.booking_status, public.booking_status) from PUBLIC, anon, authenticated;
revoke all on function public.create_booking_request(uuid, text, date, time, integer, integer, text, boolean, text) from PUBLIC;
revoke all on function public.approve_booking_request(uuid) from PUBLIC;
revoke all on function public.cancel_booking_before_payment(uuid, text) from PUBLIC;

grant execute on function public.create_booking_request(uuid, text, date, time, integer, integer, text, boolean, text) to authenticated;
grant execute on function public.approve_booking_request(uuid) to authenticated;
grant execute on function public.cancel_booking_before_payment(uuid, text) to authenticated;

notify pgrst, 'reload schema';
