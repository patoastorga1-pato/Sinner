-- Phase 3: production-oriented booking engine.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$
begin
  alter type public.booking_status add value if not exists 'expired' after 'cancelled';
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.booking_type as enum ('instant', 'request');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.booking_event_type as enum (
    'booking_created',
    'request_submitted',
    'host_approved',
    'host_declined',
    'hold_created',
    'hold_expired',
    'guest_cancelled',
    'booking_confirmed',
    'booking_completed'
  );
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings(key, value)
values
  ('sinner_service_fee_percent', '11'::jsonb),
  ('instant_hold_minutes', '15'::jsonb),
  ('host_approval_hold_minutes', '30'::jsonb)
on conflict (key) do nothing;

alter table public.spaces
  add column if not exists timezone text not null default 'America/Mexico_City';

do $$
begin
  alter table public.spaces add constraint spaces_timezone_check check (timezone ~ '^[A-Za-z_]+/[A-Za-z_]+(/[A-Za-z_]+)?$');
exception
  when duplicate_object then null;
end;
$$;

update public.spaces
set timezone = case
  when lower(state) = 'baja california' or lower(city) = 'tijuana' then 'America/Tijuana'
  when lower(state) = 'sonora' then 'America/Hermosillo'
  when lower(state) = 'quintana roo' or lower(city) in ('cancún', 'cancun') then 'America/Cancun'
  when lower(state) = 'yucatán' or lower(state) = 'yucatan' or lower(city) = 'mérida' then 'America/Merida'
  when lower(city) = 'monterrey' then 'America/Monterrey'
  else 'America/Mexico_City'
end
where timezone is null or timezone = 'America/Mexico_City';

grant select (timezone) on public.spaces to anon, authenticated;

create or replace function private.generate_booking_reference()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea;
  result text;
begin
  loop
    bytes := gen_random_bytes(6);
    result := 'SIN-';
    for i in 0..5 loop
      result := result || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.bookings where booking_reference = result);
  end loop;
  return result;
end;
$$;

alter table public.bookings
  add column if not exists booking_reference text,
  add column if not exists booking_type public.booking_type not null default 'request',
  add column if not exists timezone text not null default 'America/Mexico_City',
  add column if not exists duration_hours integer not null default 1 check (duration_hours > 0 and duration_hours <= 24),
  add column if not exists hourly_rate_snapshot numeric(12,2) not null default 0 check (hourly_rate_snapshot >= 0),
  add column if not exists guest_message text check (guest_message is null or char_length(guest_message) <= 1000),
  add column if not exists rules_accepted_at timestamptz,
  add column if not exists hold_expires_at timestamptz,
  add column if not exists cancellation_reason text check (cancellation_reason is null or char_length(cancellation_reason) <= 500),
  add column if not exists cancelled_at timestamptz,
  add column if not exists idempotency_key text,
  add column if not exists pricing_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists buffer_minutes_snapshot integer not null default 0 check (buffer_minutes_snapshot >= 0 and buffer_minutes_snapshot <= 1440);

update public.bookings b
set
  booking_reference = coalesce(booking_reference, 'SIN-' || upper(right(replace(b.id::text, '-', ''), 6))),
  duration_hours = greatest(1, ceil(extract(epoch from (end_datetime - start_datetime)) / 3600)::integer),
  hourly_rate_snapshot = case
    when hourly_rate_snapshot > 0 then hourly_rate_snapshot
    when extract(epoch from (end_datetime - start_datetime)) > 0 then round((base_amount / greatest(extract(epoch from (end_datetime - start_datetime)) / 3600, 1))::numeric, 2)
    else base_amount
  end,
  timezone = coalesce(nullif(b.timezone, ''), s.timezone, 'America/Mexico_City'),
  buffer_minutes_snapshot = coalesce(s.buffer_minutes, 0),
  rules_accepted_at = coalesce(rules_accepted_at, created_at),
  pricing_snapshot = case when pricing_snapshot = '{}'::jsonb then jsonb_build_object('source', 'phase_3_backfill') else pricing_snapshot end
from public.spaces s
where s.id = b.space_id;

alter table public.bookings
  alter column booking_reference set not null,
  alter column booking_reference set default private.generate_booking_reference();

do $$
begin
  alter table public.bookings add constraint bookings_booking_reference_key unique (booking_reference);
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.bookings add constraint bookings_idempotency_key_key unique (guest_id, idempotency_key);
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.bookings add constraint bookings_timezone_check check (timezone ~ '^[A-Za-z_]+/[A-Za-z_]+(/[A-Za-z_]+)?$');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.bookings add constraint bookings_no_active_overlap
    exclude using gist (
      space_id with =,
      tstzrange(start_datetime, end_datetime + (buffer_minutes_snapshot * interval '1 minute'), '[)') with &&
    )
    where (status in ('payment_pending', 'confirmed'));
exception
  when duplicate_object then null;
end;
$$;

create index if not exists bookings_status_hold_idx on public.bookings(status, hold_expires_at);
create index if not exists bookings_guest_status_idx on public.bookings(guest_id, status, start_datetime desc);
create index if not exists bookings_space_status_idx on public.bookings(space_id, status, start_datetime desc);

create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type public.booking_event_type not null,
  from_status public.booking_status,
  to_status public.booking_status,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists booking_events_booking_created_idx on public.booking_events(booking_id, created_at);

alter table public.app_settings enable row level security;
alter table public.booking_events enable row level security;

drop policy if exists "app_settings_admin_select" on public.app_settings;
create policy "app_settings_admin_select" on public.app_settings
for select to authenticated
using (private.is_admin());

drop policy if exists "booking_events_parties_select" on public.booking_events;
create policy "booking_events_parties_select" on public.booking_events
for select to authenticated
using (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_id
      and (b.guest_id = (select auth.uid()) or private.owns_space(b.space_id) or private.is_admin())
  )
);

drop policy if exists "booking_events_no_client_insert" on public.booking_events;
drop policy if exists "booking_events_no_client_update" on public.booking_events;
drop policy if exists "booking_events_no_client_delete" on public.booking_events;

revoke all on public.app_settings from anon, authenticated;
revoke all on public.booking_events from anon, authenticated;
grant select on public.booking_events to authenticated;

revoke insert, update, delete on public.bookings from authenticated;
grant select on public.bookings to authenticated;

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (
  type in (
    'booking_requested','booking_approved','booking_declined','booking_cancelled','booking_confirmed',
    'booking_hold_expiring','booking_expired','new_message','new_review','event_reminder',
    'listing_approved','listing_rejected','verification_required'
  )
);

create or replace function private.setting_numeric(p_key text, p_fallback numeric)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select (value #>> '{}')::numeric from public.app_settings where key = p_key), p_fallback);
$$;

create or replace function private.setting_integer(p_key text, p_fallback integer)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select private.setting_numeric(p_key, p_fallback)::integer;
$$;

create or replace function private.active_booking_blocks(p_space_id uuid, p_start timestamptz, p_end timestamptz, p_buffer integer)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bookings b
    where b.space_id = p_space_id
      and (
        b.status = 'confirmed'
        or (b.status = 'payment_pending' and b.hold_expires_at > now())
      )
      and p_start < b.end_datetime + ((greatest(b.buffer_minutes_snapshot, p_buffer)) * interval '1 minute')
      and p_end > b.start_datetime
  );
$$;

create or replace function private.manual_block_conflicts(p_space_id uuid, p_start timestamptz, p_end timestamptz, p_timezone text, p_buffer integer)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.availability a
    where a.space_id = p_space_id
      and a.status in ('blocked', 'reserved')
      and p_start < (
        (a.date + a.end_time + case when a.end_time <= a.start_time then interval '1 day' else interval '0 day' end)
        at time zone p_timezone
      ) + (p_buffer * interval '1 minute')
      and p_end > ((a.date + a.start_time) at time zone p_timezone)
  );
$$;

create or replace function private.create_booking_event(
  p_booking_id uuid,
  p_actor_id uuid,
  p_event_type public.booking_event_type,
  p_from_status public.booking_status,
  p_to_status public.booking_status,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.booking_events(booking_id, actor_id, event_type, from_status, to_status, metadata)
  values (p_booking_id, p_actor_id, p_event_type, p_from_status, p_to_status, coalesce(p_metadata, '{}'::jsonb));
$$;

create or replace function private.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_data jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications(user_id, type, title, body, data)
  values (p_user_id, p_type, p_title, p_body, coalesce(p_data, '{}'::jsonb));
$$;

create or replace function public.expire_booking_holds()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  expired_count integer := 0;
  expired_row record;
begin
  for expired_row in
    update public.bookings
    set status = 'expired',
        updated_at = now()
    where status = 'payment_pending'
      and hold_expires_at <= now()
    returning id, guest_id, booking_reference
  loop
    expired_count := expired_count + 1;
    perform private.create_booking_event(expired_row.id, null, 'hold_expired', 'payment_pending', 'expired', '{}'::jsonb);
    perform private.create_notification(
      expired_row.guest_id,
      'booking_expired',
      'Reservation hold expired',
      expired_row.booking_reference || ' is no longer being held.',
      jsonb_build_object('booking_id', expired_row.id, 'booking_reference', expired_row.booking_reference)
    );
  end loop;
  return expired_count;
end;
$$;

create or replace function public.check_space_availability(
  p_space_id uuid,
  p_date date,
  p_start time,
  p_duration_hours integer,
  p_guests integer default 1
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  requested_start timestamptz;
  requested_end timestamptz;
  space_capacity integer;
  minimum_duration integer;
  notice_minutes integer;
  turnover_minutes integer;
  space_timezone text;
begin
  if p_date is null or p_start is null or p_duration_hours is null or p_duration_hours <= 0 or p_duration_hours > 24 or p_guests <= 0 then
    return false;
  end if;

  select max_guests, minimum_hours, minimum_booking_notice_minutes, buffer_minutes, timezone
  into space_capacity, minimum_duration, notice_minutes, turnover_minutes, space_timezone
  from public.spaces
  where id = p_space_id and status = 'approved';

  if not found or p_guests > space_capacity or p_duration_hours < minimum_duration then
    return false;
  end if;

  requested_start := (p_date + p_start) at time zone space_timezone;
  requested_end := requested_start + make_interval(hours => p_duration_hours);

  if requested_start < now() + make_interval(mins => notice_minutes) then
    return false;
  end if;

  return not private.manual_block_conflicts(p_space_id, requested_start, requested_end, space_timezone, turnover_minutes)
    and not private.active_booking_blocks(p_space_id, requested_start, requested_end, turnover_minutes);
end;
$$;

create or replace function private.validate_booking_transition(p_from public.booking_status, p_to public.booking_status)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_from = 'draft' and p_to in ('pending', 'payment_pending') then true
    when p_from = 'pending' and p_to in ('payment_pending', 'declined', 'cancelled') then true
    when p_from = 'payment_pending' and p_to in ('confirmed', 'expired', 'cancelled') then true
    when p_from = 'confirmed' and p_to in ('completed', 'cancelled', 'refunded', 'disputed') then true
    else false
  end;
$$;

create or replace function private.calculate_booking_pricing(
  p_booking_type public.booking_type,
  p_duration_hours integer,
  p_hourly_price numeric,
  p_overnight_price numeric,
  p_full_day_price numeric,
  p_cleaning_fee numeric
)
returns table (
  hourly_rate_snapshot numeric,
  base_amount numeric,
  cleaning_fee numeric,
  service_fee numeric,
  total_amount numeric,
  currency char(3),
  pricing_snapshot jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  service_percent numeric := private.setting_numeric('sinner_service_fee_percent', 11);
  selected_rate numeric;
begin
  selected_rate := case
    when p_duration_hours >= 24 and p_full_day_price is not null then p_full_day_price
    when p_duration_hours >= 12 and p_overnight_price is not null then p_overnight_price
    else p_hourly_price
  end;

  if selected_rate is null then
    raise exception 'pricing_unavailable';
  end if;

  hourly_rate_snapshot := case when p_duration_hours >= 12 and selected_rate <> p_hourly_price then coalesce(p_hourly_price, selected_rate) else selected_rate end;
  base_amount := case when selected_rate = p_hourly_price then selected_rate * p_duration_hours else selected_rate end;
  cleaning_fee := coalesce(p_cleaning_fee, 0);
  service_fee := round(((base_amount + cleaning_fee) * (service_percent / 100)) / 10) * 10;
  total_amount := base_amount + cleaning_fee + service_fee;
  currency := 'MXN';
  pricing_snapshot := jsonb_build_object(
    'booking_type', p_booking_type,
    'duration_hours', p_duration_hours,
    'rate', selected_rate,
    'service_fee_percent', service_percent,
    'calculated_at', now()
  );
  return next;
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
  where id = p_space_id
  for share;

  if not found or space_row.status <> 'approved' then raise exception 'unavailable_space'; end if;
  if p_guest_count > space_row.max_guests then raise exception 'guest_limit'; end if;
  if p_duration_hours < space_row.minimum_hours then raise exception 'minimum_hours'; end if;

  desired_type := case when p_booking_type = 'instant' then 'instant'::public.booking_type else 'request'::public.booking_type end;
  if desired_type = 'instant' and not space_row.instant_booking then raise exception 'unavailable_space'; end if;
  desired_status := case when desired_type = 'instant' then 'payment_pending'::public.booking_status else 'pending'::public.booking_status end;

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

  hold_minutes := case when desired_type = 'instant' then private.setting_integer('instant_hold_minutes', 15) else null end;

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
      p_idempotency_key, pricing_row.pricing_snapshot, space_row.buffer_minutes
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

  perform private.create_booking_event(created_booking.id, current_user_id, 'booking_created', null, created_booking.status, jsonb_build_object('booking_type', desired_type));
  if created_booking.status = 'pending' then
    perform private.create_booking_event(created_booking.id, current_user_id, 'request_submitted', 'draft', 'pending', '{}'::jsonb);
    perform private.create_notification(space_row.host_id, 'booking_requested', 'New booking request', space_row.name || ' · ' || to_char(requested_start at time zone space_row.timezone, 'Mon DD · HH24:MI'), jsonb_build_object('booking_id', created_booking.id, 'booking_reference', created_booking.booking_reference));
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
  hold_minutes integer := private.setting_integer('host_approval_hold_minutes', 30);
begin
  if current_user_id is null then raise exception 'auth_required'; end if;
  perform public.expire_booking_holds();

  select * into booking_row from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'access_denied'; end if;
  select * into space_row from public.spaces where id = booking_row.space_id for share;
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
    set status = 'payment_pending',
        hold_expires_at = now() + make_interval(mins => hold_minutes),
        updated_at = now()
    where public.bookings.id = booking_row.id
      and private.validate_booking_transition(booking_row.status, 'payment_pending')
    returning * into booking_row;
  exception
    when exclusion_violation then raise exception 'unavailable_interval';
  end;

  perform private.create_booking_event(booking_row.id, current_user_id, 'host_approved', 'pending', 'payment_pending', '{}'::jsonb);
  perform private.create_booking_event(booking_row.id, current_user_id, 'hold_created', 'pending', 'payment_pending', jsonb_build_object('hold_expires_at', booking_row.hold_expires_at));
  perform private.create_notification(booking_row.guest_id, 'booking_approved', 'Your booking request was approved', 'Complete payment before your reservation hold expires.', jsonb_build_object('booking_id', booking_row.id, 'booking_reference', booking_row.booking_reference));

  id := booking_row.id;
  booking_reference := booking_row.booking_reference;
  status := booking_row.status;
  hold_expires_at := booking_row.hold_expires_at;
  return next;
end;
$$;

create or replace function public.decline_booking_request(p_booking_id uuid, p_reason text default null)
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
begin
  if current_user_id is null then raise exception 'auth_required'; end if;
  select * into booking_row from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'access_denied'; end if;
  select * into space_row from public.spaces where id = booking_row.space_id for share;
  if space_row.host_id <> current_user_id and not private.is_admin() then raise exception 'access_denied'; end if;
  if booking_row.status <> 'pending' then raise exception 'booking_processed'; end if;

  update public.bookings
  set status = 'declined',
      cancellation_reason = nullif(trim(coalesce(p_reason, '')), ''),
      updated_at = now()
  where public.bookings.id = booking_row.id
    and private.validate_booking_transition(booking_row.status, 'declined')
  returning * into booking_row;

  perform private.create_booking_event(booking_row.id, current_user_id, 'host_declined', 'pending', 'declined', jsonb_build_object('reason', p_reason));
  perform private.create_notification(booking_row.guest_id, 'booking_declined', 'Your booking request was declined', coalesce(nullif(trim(coalesce(p_reason, '')), ''), 'The host declined this request.'), jsonb_build_object('booking_id', booking_row.id, 'booking_reference', booking_row.booking_reference));

  id := booking_row.id;
  booking_reference := booking_row.booking_reference;
  status := booking_row.status;
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
begin
  if current_user_id is null then raise exception 'auth_required'; end if;
  select * into booking_row from public.bookings where id = p_booking_id for update;
  if not found or booking_row.guest_id <> current_user_id then raise exception 'access_denied'; end if;
  if booking_row.status not in ('pending', 'payment_pending') then raise exception 'booking_processed'; end if;
  select * into space_row from public.spaces where id = booking_row.space_id for share;
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

  perform private.create_booking_event(booking_row.id, current_user_id, 'guest_cancelled', previous_status, 'cancelled', jsonb_build_object('reason', p_reason));
  perform private.create_notification(space_row.host_id, 'booking_cancelled', 'Booking cancelled', booking_row.booking_reference || ' was cancelled before payment.', jsonb_build_object('booking_id', booking_row.id, 'booking_reference', booking_row.booking_reference));

  id := booking_row.id;
  booking_reference := booking_row.booking_reference;
  status := booking_row.status;
  return next;
end;
$$;

create or replace function public.get_host_booking_dashboard()
returns table (
  id uuid,
  booking_reference text,
  booking_type public.booking_type,
  status public.booking_status,
  start_datetime timestamptz,
  end_datetime timestamptz,
  timezone text,
  duration_hours integer,
  guest_count integer,
  hourly_rate_snapshot numeric,
  base_amount numeric,
  cleaning_fee numeric,
  service_fee numeric,
  total_amount numeric,
  currency char(3),
  hold_expires_at timestamptz,
  cancellation_reason text,
  cancelled_at timestamptz,
  guest_message text,
  created_at timestamptz,
  guest_display_name text,
  space jsonb
)
language sql
security definer
set search_path = ''
as $$
  select
    b.id, b.booking_reference, b.booking_type, b.status, b.start_datetime, b.end_datetime, b.timezone,
    b.duration_hours, b.guest_count, b.hourly_rate_snapshot, b.base_amount, b.cleaning_fee, b.service_fee,
    b.total_amount, b.currency, b.hold_expires_at, b.cancellation_reason, b.cancelled_at, b.guest_message,
    b.created_at,
    coalesce(nullif(p.display_name, ''), p.first_name, 'Verified guest') as guest_display_name,
    jsonb_build_object(
      'id', s.id,
      'host_id', s.host_id,
      'name', s.name,
      'slug', s.slug,
      'city', s.city,
      'state', s.state,
      'approximate_location', s.approximate_location,
      'timezone', s.timezone,
      'space_photos', coalesce((
        select jsonb_agg(jsonb_build_object('storage_path', sp.storage_path, 'is_cover', sp.is_cover, 'sort_order', sp.sort_order) order by sp.is_cover desc, sp.sort_order)
        from public.space_photos sp
        where sp.space_id = s.id
      ), '[]'::jsonb)
    ) as space
  from public.bookings b
  join public.spaces s on s.id = b.space_id
  left join public.profiles p on p.id = b.guest_id
  where s.host_id = (select auth.uid()) or private.is_admin()
  order by b.start_datetime desc;
$$;

revoke all on function public.expire_booking_holds() from public;
revoke all on function public.create_booking_request(uuid, text, date, time, integer, integer, text, boolean, text) from public;
revoke all on function public.approve_booking_request(uuid) from public;
revoke all on function public.decline_booking_request(uuid, text) from public;
revoke all on function public.cancel_booking_before_payment(uuid, text) from public;
revoke all on function public.get_host_booking_dashboard() from public;

grant execute on function public.expire_booking_holds() to authenticated;
grant execute on function public.create_booking_request(uuid, text, date, time, integer, integer, text, boolean, text) to authenticated;
grant execute on function public.approve_booking_request(uuid) to authenticated;
grant execute on function public.decline_booking_request(uuid, text) to authenticated;
grant execute on function public.cancel_booking_before_payment(uuid, text) to authenticated;
grant execute on function public.get_host_booking_dashboard() to authenticated;

comment on constraint bookings_no_active_overlap on public.bookings is
  'Database-level inventory guard. Prevents overlapping payment_pending/confirmed intervals for the same space, including the stored cleaning buffer.';

comment on table public.booking_events is
  'Immutable booking audit history. Normal users may read relevant events but cannot insert, update or delete them directly.';
