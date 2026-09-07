-- Atomic smoke checks. Any failure aborts the surrounding SQL Editor transaction.
do $sinner_verify$
declare
  expected_table text;
  expected_column text;
  expected_tables constant text[] := array[
    'profiles', 'user_roles', 'spaces', 'space_photos', 'amenities',
    'space_amenities', 'allowed_uses', 'space_allowed_uses', 'availability',
    'bookings', 'favorites', 'reviews', 'conversations',
    'conversation_participants', 'messages', 'experiences', 'events',
    'event_tickets', 'notifications', 'reports'
  ];
begin
  foreach expected_table in array expected_tables loop
    if to_regclass('public.' || expected_table) is null then
      raise exception 'SINNER verification failed: missing table public.%', expected_table;
    end if;
  end loop;

  foreach expected_column in array array[
    'country_code', 'country', 'state', 'state_code', 'municipality', 'city',
    'locality', 'postal_code', 'latitude', 'longitude', 'approximate_location',
    'exact_address', 'location_search_text'
  ] loop
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'spaces'
        and column_name = expected_column
    ) then
      raise exception 'SINNER verification failed: missing spaces.%', expected_column;
    end if;
  end loop;

  if to_regclass('public.public_profiles') is null
     or to_regclass('public.public_host_profiles') is null
     or to_regclass('public.public_space_reviews') is null then
    raise exception 'SINNER verification failed: a public privacy-safe view is missing';
  end if;

  if to_regprocedure('public.check_space_availability(uuid,date,time without time zone,integer,integer)') is null then
    raise exception 'SINNER verification failed: availability RPC is missing';
  end if;

  if to_regproc('public.search_public_spaces') is null then
    raise exception 'SINNER verification failed: marketplace search RPC is missing';
  end if;

  if to_regproc('public.search_mexico_locations') is null then
    raise exception 'SINNER verification failed: Mexico autocomplete RPC is missing';
  end if;

  if private.normalize_mexico_location('queretaro')
     <> private.normalize_mexico_location('Querétaro') then
    raise exception 'SINNER verification failed: accent-insensitive location normalization is broken';
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any(expected_tables)
      and c.relrowsecurity is false
  ) then
    raise exception 'SINNER verification failed: RLS is disabled on a protected table';
  end if;

  if has_column_privilege('anon', 'public.spaces', 'exact_address', 'select')
     or has_column_privilege('authenticated', 'public.spaces', 'exact_address', 'select') then
    raise exception 'SINNER verification failed: exact_address is exposed';
  end if;

  if has_column_privilege('anon', 'public.spaces', 'latitude', 'select')
     or has_column_privilege('anon', 'public.spaces', 'longitude', 'select') then
    raise exception 'SINNER verification failed: exact coordinates are exposed';
  end if;

  if has_column_privilege('anon', 'public.spaces', 'postal_code', 'select')
     or has_column_privilege('anon', 'public.spaces', 'location_search_text', 'select') then
    raise exception 'SINNER verification failed: private location fields are exposed';
  end if;

  if (select count(*) from public.spaces) <> 11
     or (select count(*) from public.spaces where status = 'approved') <> 10 then
    raise exception 'SINNER verification failed: expected 10 approved spaces and 1 draft';
  end if;

  if (select count(*) from public.amenities) < 16
     or (select count(*) from public.allowed_uses) < 9 then
    raise exception 'SINNER verification failed: marketplace taxonomy seed is incomplete';
  end if;

  if (select count(distinct state_code) from public.spaces where status = 'approved') < 9 then
    raise exception 'SINNER verification failed: nationwide development markets are incomplete';
  end if;

  if (select count(*) from auth.identities where user_id in (
    '30000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000002'
  )) <> 3 then
    raise exception 'SINNER verification failed: demo Auth identities are incomplete';
  end if;

  if exists (
    select 1
    from public.spaces
    where review_count <> (select count(*) from public.reviews where reviews.space_id = spaces.id)
  ) then
    raise exception 'SINNER verification failed: review aggregates are inconsistent';
  end if;

  raise notice 'SINNER Phases 1 and 2 verified successfully.';
end
$sinner_verify$;
