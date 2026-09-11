-- SINNER - SQL UNICO FINAL DE SINCRONIZACION
-- Ejecuta TODO este archivo en Supabase SQL Editor.
-- Objetivo: completar la parte nacional de Mexico que falta en la base real,
-- mantener privada la direccion exacta y refrescar la cache de PostgREST.

begin;

create extension if not exists pg_trgm with schema extensions;

alter table public.spaces add column if not exists country_code text not null default 'MX';
alter table public.spaces add column if not exists state_code text;
alter table public.spaces add column if not exists municipality text;
alter table public.spaces add column if not exists locality text;
alter table public.spaces add column if not exists postal_code text;
alter table public.spaces add column if not exists location_search_text text not null default '';
alter table public.spaces add column if not exists timezone text not null default 'America/Mexico_City';

alter table public.spaces drop constraint if exists spaces_country_code_format;
alter table public.spaces add constraint spaces_country_code_format
  check (country_code ~ '^[A-Z]{2}$');

alter table public.spaces drop constraint if exists spaces_state_code_format;
alter table public.spaces add constraint spaces_state_code_format
  check (state_code is null or state_code ~ '^[A-Z]{3}$');

alter table public.spaces drop constraint if exists spaces_postal_code_format;
alter table public.spaces add constraint spaces_postal_code_format
  check (postal_code is null or postal_code ~ '^[0-9]{5}$');

create or replace function private.normalize_mexico_location(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select trim(
    regexp_replace(
      translate(lower(coalesce(value, '')), 'áéíóúüñàèìòù', 'aeiouunaeiou'),
      '[^a-z0-9]+',
      ' ',
      'g'
    )
  )
$$;

create or replace function private.set_space_location_search()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.location_search_text := private.normalize_mexico_location(
    coalesce(new.locality, '') || ' ' ||
    coalesce(new.city, '') || ' ' ||
    coalesce(new.municipality, '') || ' ' ||
    coalesce(new.state, '') || ' ' ||
    coalesce(new.state_code, '') || ' ' ||
    coalesce(new.country, '') || ' ' ||
    coalesce(new.country_code, '') || ' ' ||
    coalesce(new.approximate_location, '')
  );

  return new;
end;
$$;

drop trigger if exists spaces_location_search_before_write on public.spaces;
create trigger spaces_location_search_before_write
before insert or update of locality, city, municipality, state, state_code, country,
  country_code, approximate_location
on public.spaces
for each row execute function private.set_space_location_search();

update public.spaces as s
set
  country_code = location.country_code,
  country = location.country,
  state = location.state,
  state_code = location.state_code,
  municipality = location.municipality,
  city = location.city,
  locality = location.locality,
  postal_code = location.postal_code,
  latitude = location.latitude,
  longitude = location.longitude,
  approximate_location = location.approximate_location,
  exact_address = location.exact_address,
  timezone = location.timezone
from (values
  ('00000000-0000-4000-8000-000000000001'::uuid, 'MX', 'Mexico', 'Jalisco', 'JAL', 'Guadalajara', 'Guadalajara', 'Colonia Americana', '44160', 20.6736000, -103.3680000, 'Colonia Americana, Guadalajara, Jalisco', 'DEMO PRIVATE ADDRESS GDL', 'America/Mexico_City'),
  ('00000000-0000-4000-8000-000000000002'::uuid, 'MX', 'Mexico', 'Ciudad de México', 'CMX', 'Cuauhtémoc', 'Ciudad de México', 'Roma Norte', '06700', 19.4180000, -99.1640000, 'Roma Norte, Ciudad de México', 'DEMO PRIVATE ADDRESS CDMX', 'America/Mexico_City'),
  ('00000000-0000-4000-8000-000000000003'::uuid, 'MX', 'Mexico', 'Nuevo León', 'NLE', 'Monterrey', 'Monterrey', 'Obispado', '64060', 25.6780000, -100.3420000, 'Obispado, Monterrey, Nuevo León', 'DEMO PRIVATE ADDRESS MTY', 'America/Monterrey'),
  ('00000000-0000-4000-8000-000000000004'::uuid, 'MX', 'Mexico', 'Quintana Roo', 'ROO', 'Benito Juárez', 'Cancún', 'Zona Hotelera', '77500', 21.1210000, -86.8510000, 'Zona Hotelera, Cancún, Quintana Roo', 'DEMO PRIVATE ADDRESS CUN', 'America/Cancun'),
  ('00000000-0000-4000-8000-000000000005'::uuid, 'MX', 'Mexico', 'Jalisco', 'JAL', 'Puerto Vallarta', 'Puerto Vallarta', 'Zona Romántica', '48380', 20.6530000, -105.2250000, 'Zona Romántica, Puerto Vallarta, Jalisco', 'DEMO PRIVATE ADDRESS PVR', 'America/Mexico_City'),
  ('00000000-0000-4000-8000-000000000006'::uuid, 'MX', 'Mexico', 'Querétaro', 'QUE', 'Querétaro', 'Querétaro', 'Centro Histórico', '76000', 20.5930000, -100.3920000, 'Centro Histórico, Querétaro, Querétaro', 'DEMO PRIVATE ADDRESS QRO', 'America/Mexico_City'),
  ('00000000-0000-4000-8000-000000000007'::uuid, 'MX', 'Mexico', 'Baja California', 'BCN', 'Tijuana', 'Tijuana', 'Zona Río', '22010', 32.5260000, -117.0200000, 'Zona Río, Tijuana, Baja California', 'DEMO PRIVATE ADDRESS TIJ', 'America/Tijuana'),
  ('00000000-0000-4000-8000-000000000008'::uuid, 'MX', 'Mexico', 'Yucatán', 'YUC', 'Mérida', 'Mérida', 'Centro', '97000', 20.9670000, -89.6230000, 'Centro, Mérida, Yucatán', 'DEMO PRIVATE ADDRESS MID', 'America/Merida'),
  ('00000000-0000-4000-8000-000000000009'::uuid, 'MX', 'Mexico', 'Puebla', 'PUE', 'Puebla', 'Puebla', 'Angelópolis', '72197', 19.0310000, -98.2380000, 'Angelópolis, Puebla, Puebla', 'DEMO PRIVATE ADDRESS PUE', 'America/Mexico_City'),
  ('00000000-0000-4000-8000-000000000010'::uuid, 'MX', 'Mexico', 'Guanajuato', 'GUA', 'León', 'León', 'El Coecillo', '37260', 21.1250000, -101.6820000, 'El Coecillo, León, Guanajuato', 'DEMO PRIVATE ADDRESS BJX', 'America/Mexico_City'),
  ('00000000-0000-4000-8000-000000000011'::uuid, 'MX', 'Mexico', 'Jalisco', 'JAL', 'Guadalajara', 'Guadalajara', 'Providencia', '44630', null, null, 'Providencia, Guadalajara, Jalisco', 'DEMO PRIVATE DRAFT ADDRESS', 'America/Mexico_City')
) as location(
  id, country_code, country, state, state_code, municipality, city, locality,
  postal_code, latitude, longitude, approximate_location, exact_address, timezone
)
where s.id = location.id;

update public.spaces
set location_search_text = private.normalize_mexico_location(
  coalesce(locality, '') || ' ' ||
  coalesce(city, '') || ' ' ||
  coalesce(municipality, '') || ' ' ||
  coalesce(state, '') || ' ' ||
  coalesce(state_code, '') || ' ' ||
  coalesce(country, '') || ' ' ||
  coalesce(country_code, '') || ' ' ||
  coalesce(approximate_location, '')
);

create index if not exists spaces_location_search_trgm_idx
  on public.spaces using gin (location_search_text extensions.gin_trgm_ops)
  where status = 'approved';

revoke select on public.spaces from PUBLIC, anon, authenticated;
grant select (
  id, host_id, name, slug, short_description, description, space_type, status,
  city, state, country, country_code, state_code, municipality, locality,
  approximate_location, timezone, max_guests,
  hourly_price, overnight_price, full_day_price, cleaning_fee, minimum_hours,
  privacy_score, instant_booking, creator_friendly, group_friendly, events_allowed,
  featured, cancellation_policy, check_in_notes, minimum_booking_notice_minutes,
  buffer_minutes, rating_average, review_count, house_rules,
  published_at, created_at, updated_at
) on public.spaces to anon, authenticated;

revoke select (postal_code, location_search_text, exact_address, latitude, longitude)
  on public.spaces from PUBLIC, anon, authenticated;

create or replace function public.search_public_spaces(
  p_location text default null,
  p_date date default null,
  p_start time default null,
  p_duration_hours integer default 4,
  p_guests integer default 1,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_privacy numeric default null,
  p_space_type text default null,
  p_amenity_slugs text[] default '{}'::text[],
  p_allowed_use_slugs text[] default '{}'::text[],
  p_creator_friendly boolean default false,
  p_group_friendly boolean default false,
  p_events_allowed boolean default false,
  p_instant_booking boolean default false,
  p_sort text default 'recommended',
  p_page integer default 1,
  p_page_size integer default 6
)
returns table (
  id uuid,
  slug text,
  name text,
  short_description text,
  space_type text,
  city text,
  state text,
  country text,
  approximate_location text,
  max_guests integer,
  hourly_price numeric,
  overnight_price numeric,
  full_day_price numeric,
  cleaning_fee numeric,
  minimum_hours integer,
  privacy_score numeric,
  instant_booking boolean,
  creator_friendly boolean,
  group_friendly boolean,
  events_allowed boolean,
  featured boolean,
  published_at timestamptz,
  rating_average numeric,
  review_count integer,
  cover_photo text,
  amenity_slugs text[],
  amenity_names text[],
  amenity_categories text[],
  amenity_icons text[],
  allowed_use_slugs text[],
  allowed_use_names text[],
  total_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with candidates as (
    select
      s.*,
      coalesce(s.hourly_price, s.overnight_price, s.full_day_price) as starting_price,
      (
        select sp.storage_path
        from public.space_photos sp
        where sp.space_id = s.id
        order by sp.is_cover desc, sp.sort_order asc
        limit 1
      ) as cover_photo,
      array(
        select a.slug
        from public.space_amenities sa
        join public.amenities a on a.id = sa.amenity_id
        where sa.space_id = s.id
        order by a.slug
      ) as amenity_slugs,
      array(
        select a.name
        from public.space_amenities sa
        join public.amenities a on a.id = sa.amenity_id
        where sa.space_id = s.id
        order by a.slug
      ) as amenity_names,
      array(
        select a.category
        from public.space_amenities sa
        join public.amenities a on a.id = sa.amenity_id
        where sa.space_id = s.id
        order by a.slug
      ) as amenity_categories,
      array(
        select coalesce(a.icon_name, '')
        from public.space_amenities sa
        join public.amenities a on a.id = sa.amenity_id
        where sa.space_id = s.id
        order by a.slug
      ) as amenity_icons,
      array(
        select u.slug
        from public.space_allowed_uses su
        join public.allowed_uses u on u.id = su.allowed_use_id
        where su.space_id = s.id and su.allowed
        order by u.slug
      ) as allowed_use_slugs,
      array(
        select u.name
        from public.space_allowed_uses su
        join public.allowed_uses u on u.id = su.allowed_use_id
        where su.space_id = s.id and su.allowed
        order by u.slug
      ) as allowed_use_names
    from public.spaces s
    where s.status = 'approved'
      and s.max_guests >= greatest(coalesce(p_guests, 1), 1)
      and (
        nullif(private.normalize_mexico_location(p_location), '') is null
        or s.location_search_text like '%' || private.normalize_mexico_location(p_location) || '%'
      )
      and (p_min_price is null or coalesce(s.hourly_price, s.overnight_price, s.full_day_price) >= p_min_price)
      and (p_max_price is null or coalesce(s.hourly_price, s.overnight_price, s.full_day_price) <= p_max_price)
      and (p_privacy is null or s.privacy_score >= p_privacy)
      and (
        nullif(p_space_type, '') is null
        or case
          when replace(lower(s.space_type), ' ', '-') in ('private-suite','apartment','villa','studio','playroom','venue')
          then replace(lower(s.space_type), ' ', '-')
          else 'other'
        end = p_space_type
      )
      and (not p_creator_friendly or s.creator_friendly)
      and (not p_group_friendly or s.group_friendly)
      and (not p_events_allowed or s.events_allowed)
      and (not p_instant_booking or s.instant_booking)
      and not exists (
        select 1
        from unnest(coalesce(p_amenity_slugs, '{}'::text[])) requested(slug)
        where not exists (
          select 1
          from public.space_amenities sa
          join public.amenities a on a.id = sa.amenity_id
          where sa.space_id = s.id and a.slug = requested.slug
        )
      )
      and not exists (
        select 1
        from unnest(coalesce(p_allowed_use_slugs, '{}'::text[])) requested(slug)
        where not exists (
          select 1
          from public.space_allowed_uses su
          join public.allowed_uses u on u.id = su.allowed_use_id
          where su.space_id = s.id and su.allowed and u.slug = requested.slug
        )
      )
      and (p_date is null or p_start is null or public.check_space_availability(s.id, p_date, p_start, p_duration_hours, p_guests))
  )
  select
    c.id, c.slug, c.name, c.short_description, c.space_type, c.city, c.state,
    c.country, c.approximate_location, c.max_guests, c.hourly_price,
    c.overnight_price, c.full_day_price, c.cleaning_fee, c.minimum_hours,
    c.privacy_score, c.instant_booking, c.creator_friendly, c.group_friendly,
    c.events_allowed, c.featured, c.published_at, c.rating_average,
    c.review_count, c.cover_photo, c.amenity_slugs, c.amenity_names,
    c.amenity_categories, c.amenity_icons, c.allowed_use_slugs,
    c.allowed_use_names, count(*) over () as total_count
  from candidates c
  order by
    case when p_sort = 'recommended' then c.featured::integer end desc nulls last,
    case when p_sort in ('recommended', 'rating') then c.rating_average end desc nulls last,
    case when p_sort = 'recommended' then c.privacy_score end desc nulls last,
    case when p_sort = 'privacy' then c.privacy_score end desc nulls last,
    case when p_sort = 'price-asc' then c.starting_price end asc nulls last,
    case when p_sort = 'price-desc' then c.starting_price end desc nulls last,
    case when p_sort = 'newest' then c.published_at end desc nulls last,
    c.published_at desc nulls last,
    c.slug asc
  limit least(greatest(coalesce(p_page_size, 6), 1), 24)
  offset (greatest(coalesce(p_page, 1), 1) - 1) * least(greatest(coalesce(p_page_size, 6), 1), 24);
$$;

create or replace function public.search_mexico_locations(
  p_query text default '',
  p_limit integer default 8
)
returns table (
  label text,
  locality text,
  city text,
  municipality text,
  state text,
  state_code text,
  country_code text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with locations as (
    select distinct
      s.locality,
      s.city,
      s.municipality,
      s.state,
      s.state_code,
      s.country_code,
      s.location_search_text
    from public.spaces s
    where s.status = 'approved'
  )
  select
    concat_ws(', ', nullif(l.locality, ''), nullif(l.city, ''), nullif(l.state, '')) as label,
    l.locality,
    l.city,
    l.municipality,
    l.state,
    l.state_code,
    l.country_code
  from locations l
  where nullif(private.normalize_mexico_location(p_query), '') is null
     or l.location_search_text like '%' || private.normalize_mexico_location(p_query) || '%'
  order by
    (private.normalize_mexico_location(l.city) = private.normalize_mexico_location(p_query)) desc,
    l.state,
    l.city,
    l.locality nulls last
  limit least(greatest(coalesce(p_limit, 8), 1), 20);
$$;

revoke all on function private.normalize_mexico_location(text) from PUBLIC, anon, authenticated;
revoke all on function private.set_space_location_search() from PUBLIC, anon, authenticated;
revoke all on function public.search_public_spaces(text, date, time, integer, integer, numeric, numeric, numeric, text, text[], text[], boolean, boolean, boolean, boolean, text, integer, integer) from PUBLIC;
revoke all on function public.search_mexico_locations(text, integer) from PUBLIC;

grant execute on function public.search_public_spaces(text, date, time, integer, integer, numeric, numeric, numeric, text, text[], text[], boolean, boolean, boolean, boolean, text, integer, integer) to anon, authenticated;
grant execute on function public.search_mexico_locations(text, integer) to anon, authenticated;

notify pgrst, 'reload schema';

do $$
declare
  approved_state_count integer;
  cancun_total bigint;
  qro_total bigint;
  cancun_locations integer;
begin
  if to_regproc('public.search_mexico_locations') is null then
    raise exception 'SINNER final sync failed: search_mexico_locations is missing.';
  end if;

  if private.normalize_mexico_location('queretaro') <> private.normalize_mexico_location('Querétaro') then
    raise exception 'SINNER final sync failed: accent-insensitive normalization is broken.';
  end if;

  select count(distinct state_code)
  into approved_state_count
  from public.spaces
  where status = 'approved';

  if approved_state_count < 9 then
    raise exception 'SINNER final sync failed: nationwide demo markets are incomplete.';
  end if;

  select coalesce(max(total_count), 0)
  into cancun_total
  from public.search_public_spaces(p_location := 'Cancun', p_page_size := 24);

  if cancun_total < 1 then
    raise exception 'SINNER final sync failed: Cancun search returns no spaces.';
  end if;

  select coalesce(max(total_count), 0)
  into qro_total
  from public.search_public_spaces(p_location := 'queretaro', p_page_size := 24);

  if qro_total < 1 then
    raise exception 'SINNER final sync failed: queretaro search returns no spaces.';
  end if;

  select count(*)
  into cancun_locations
  from public.search_mexico_locations('Cancun', 5);

  if cancun_locations < 1 then
    raise exception 'SINNER final sync failed: Cancun autocomplete returns no suggestions.';
  end if;

  if has_column_privilege('anon', 'public.spaces', 'exact_address', 'select')
     or has_column_privilege('authenticated', 'public.spaces', 'exact_address', 'select') then
    raise exception 'SINNER final sync failed: exact_address is exposed.';
  end if;

  if has_column_privilege('anon', 'public.spaces', 'latitude', 'select')
     or has_column_privilege('anon', 'public.spaces', 'longitude', 'select')
     or has_column_privilege('authenticated', 'public.spaces', 'latitude', 'select')
     or has_column_privilege('authenticated', 'public.spaces', 'longitude', 'select') then
    raise exception 'SINNER final sync failed: exact coordinates are exposed.';
  end if;

  raise notice 'SINNER final database sync verified successfully.';
end;
$$;

commit;
