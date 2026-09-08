do $$
begin
  if to_regclass('public.booking_events') is null then
    raise exception 'SINNER Phase 3 verification failed: booking_events is missing';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bookings'
      and column_name in (
        'booking_reference', 'booking_type', 'timezone', 'duration_hours',
        'hourly_rate_snapshot', 'rules_accepted_at', 'hold_expires_at',
        'idempotency_key', 'pricing_snapshot', 'buffer_minutes_snapshot'
      )
    group by table_name
    having count(*) = 10
  ) then
    raise exception 'SINNER Phase 3 verification failed: bookings columns are incomplete';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_no_active_overlap'
      and conrelid = 'public.bookings'::regclass
  ) then
    raise exception 'SINNER Phase 3 verification failed: overlap constraint is missing';
  end if;

  if to_regprocedure('public.create_booking_request(uuid,text,date,time without time zone,integer,integer,text,boolean,text)') is null
     or to_regprocedure('public.approve_booking_request(uuid)') is null
     or to_regprocedure('public.decline_booking_request(uuid,text)') is null
     or to_regprocedure('public.cancel_booking_before_payment(uuid,text)') is null
     or to_regprocedure('public.expire_booking_holds()') is null then
    raise exception 'SINNER Phase 3 verification failed: booking RPCs are incomplete';
  end if;

  if has_table_privilege('authenticated', 'public.booking_events', 'INSERT')
     or has_table_privilege('authenticated', 'public.booking_events', 'UPDATE')
     or has_table_privilege('authenticated', 'public.booking_events', 'DELETE') then
    raise exception 'SINNER Phase 3 verification failed: clients can mutate booking_events directly';
  end if;

  if has_table_privilege('authenticated', 'public.bookings', 'UPDATE')
     or has_table_privilege('authenticated', 'public.bookings', 'DELETE') then
    raise exception 'SINNER Phase 3 verification failed: clients can mutate bookings directly';
  end if;

  if has_column_privilege('anon', 'public.spaces', 'exact_address', 'SELECT')
     or has_column_privilege('authenticated', 'public.spaces', 'exact_address', 'SELECT') then
    raise exception 'SINNER Phase 3 verification failed: exact_address is exposed';
  end if;

  raise notice 'SINNER Phase 3 verified successfully.';
end;
$$;
