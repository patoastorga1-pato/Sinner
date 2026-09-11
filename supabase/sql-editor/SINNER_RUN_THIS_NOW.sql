-- SINNER - SQL UNICO PARA CORREGIR EL ERROR ACTUAL DE PHASE 3
-- Copia y ejecuta TODO este archivo en Supabase SQL Editor.

create extension if not exists pgcrypto;

create or replace function private.generate_booking_reference()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  crypto_schema text;
  bytes bytea;
  result text;
begin
  select n.nspname
  into crypto_schema
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where p.proname = 'gen_random_bytes'
    and p.pronargs = 1
  order by case n.nspname
    when 'extensions' then 0
    when 'public' then 1
    else 2
  end
  limit 1;

  if crypto_schema is null then
    raise exception 'pgcrypto_unavailable';
  end if;

  loop
    execute format('select %I.gen_random_bytes($1)', crypto_schema)
    into bytes
    using 6;

    result := 'SIN-';

    for i in 0..5 loop
      result := result || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
    end loop;

    exit when not exists (
      select 1
      from public.bookings
      where booking_reference = result
    );
  end loop;

  return result;
end;
$$;

alter table public.bookings
  alter column booking_reference set default private.generate_booking_reference();

do $$
begin
  begin
    revoke all on function private.generate_booking_reference() from PUBLIC, anon, authenticated;
  exception when undefined_function then
    null;
  end;

  begin
    revoke all on function private.set_booking_blocking_interval() from PUBLIC, anon, authenticated;
  exception when undefined_function then
    null;
  end;

  begin
    revoke all on function private.setting_numeric(text, numeric) from PUBLIC, anon, authenticated;
  exception when undefined_function then
    null;
  end;

  begin
    revoke all on function private.setting_integer(text, integer) from PUBLIC, anon, authenticated;
  exception when undefined_function then
    null;
  end;

  begin
    revoke all on function private.active_booking_blocks(uuid, timestamptz, timestamptz, integer) from PUBLIC, anon, authenticated;
  exception when undefined_function then
    null;
  end;

  begin
    revoke all on function private.manual_block_conflicts(uuid, timestamptz, timestamptz, text, integer) from PUBLIC, anon, authenticated;
  exception when undefined_function then
    null;
  end;

  begin
    revoke all on function private.create_booking_event(uuid, uuid, public.booking_event_type, public.booking_status, public.booking_status, jsonb) from PUBLIC, anon, authenticated;
  exception when undefined_function then
    null;
  end;

  begin
    revoke all on function private.create_notification(uuid, text, text, text, jsonb) from PUBLIC, anon, authenticated;
  exception when undefined_function then
    null;
  end;

  begin
    revoke all on function private.validate_booking_transition(public.booking_status, public.booking_status) from PUBLIC, anon, authenticated;
  exception when undefined_function then
    null;
  end;

  begin
    revoke all on function private.calculate_booking_pricing(public.booking_type, integer, numeric, numeric, numeric, numeric) from PUBLIC, anon, authenticated;
  exception when undefined_function then
    null;
  end;
end;
$$;

do $$
begin
  if to_regclass('public.booking_events') is null then
    raise exception 'SINNER repair failed: public.booking_events is missing. Run the full Phase 3 repair SQL first.';
  end if;

  if private.generate_booking_reference() !~ '^SIN-[A-Z2-9]{6}$' then
    raise exception 'SINNER repair failed: booking reference generation is broken.';
  end if;

  if to_regprocedure('private.create_booking_event(uuid,uuid,public.booking_event_type,public.booking_status,public.booking_status,jsonb)') is not null
     and (
       has_function_privilege('anon', 'private.create_booking_event(uuid,uuid,public.booking_event_type,public.booking_status,public.booking_status,jsonb)'::regprocedure, 'EXECUTE')
       or has_function_privilege('authenticated', 'private.create_booking_event(uuid,uuid,public.booking_event_type,public.booking_status,public.booking_status,jsonb)'::regprocedure, 'EXECUTE')
     ) then
    raise exception 'SINNER repair failed: create_booking_event is executable by clients.';
  end if;

  if to_regprocedure('private.create_notification(uuid,text,text,text,jsonb)') is not null
     and (
       has_function_privilege('anon', 'private.create_notification(uuid,text,text,text,jsonb)'::regprocedure, 'EXECUTE')
       or has_function_privilege('authenticated', 'private.create_notification(uuid,text,text,text,jsonb)'::regprocedure, 'EXECUTE')
     ) then
    raise exception 'SINNER repair failed: create_notification is executable by clients.';
  end if;

  raise notice 'SINNER current repair verified successfully.';
end;
$$;
