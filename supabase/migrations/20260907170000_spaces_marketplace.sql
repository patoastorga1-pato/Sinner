-- Phase 2: public Spaces marketplace, privacy-safe reads and hourly availability.

alter table public.spaces add column if not exists short_description text;
alter table public.spaces add column if not exists featured boolean not null default false;
alter table public.spaces add column if not exists cancellation_policy text;
alter table public.spaces add column if not exists check_in_notes text;
alter table public.spaces add column if not exists minimum_booking_notice_minutes integer not null default 120;
alter table public.spaces add column if not exists buffer_minutes integer not null default 30;
alter table public.spaces add column if not exists rating_average numeric(3,2) not null default 0;
alter table public.spaces add column if not exists review_count integer not null default 0;
alter table public.spaces add column if not exists house_rules jsonb not null default '[]'::jsonb;
alter table public.space_photos add column if not exists alt_text text;
alter table public.amenities add column if not exists icon_name text;

create index if not exists spaces_marketplace_order_idx
  on public.spaces(status, featured desc, rating_average desc, privacy_score desc, published_at desc);
create index if not exists spaces_capacity_idx on public.spaces(status, max_guests);
create index if not exists spaces_hourly_price_idx on public.spaces(status, hourly_price);

update public.spaces
set short_description = left(coalesce(description, name), 180)
where short_description is null;

update public.spaces
set house_rules = jsonb_build_array(
  jsonb_build_object('key', 'guests', 'label', 'Maximum guests', 'detail', 'Up to ' || max_guests || ' registered guests'),
  jsonb_build_object('key', 'smoking', 'label', 'Smoking', 'detail', 'Confirm the host policy before booking'),
  jsonb_build_object('key', 'noise', 'label', 'Noise', 'detail', 'Keep sound within the private space'),
  jsonb_build_object('key', 'cleaning', 'label', 'Cleaning', 'detail', 'Leave the space in the condition described by the host')
)
where house_rules = '[]'::jsonb;

update public.amenities
set name = 'Jacuzzi', slug = 'jacuzzi', icon_name = 'bath'
where slug = 'private-jacuzzi'
  and not exists (select 1 from public.amenities existing where existing.slug = 'jacuzzi');

insert into public.amenities(name, slug, category, icon_name) values
  ('Jacuzzi', 'jacuzzi', 'wellness', 'bath'),
  ('Pool', 'pool', 'wellness', 'waves'),
  ('Private entrance', 'private-entrance', 'privacy', 'door-open'),
  ('Private parking', 'private-parking', 'access', 'car'),
  ('Self check-in', 'self-check-in', 'privacy', 'key-round'),
  ('Soundproofing', 'soundproofing', 'privacy', 'volume-x'),
  ('Wi-Fi', 'wifi', 'comfort', 'wifi'),
  ('Air conditioning', 'air-conditioning', 'comfort', 'snowflake'),
  ('Shower', 'shower', 'wellness', 'shower-head'),
  ('Bathtub', 'bathtub', 'wellness', 'bath'),
  ('Mirrors', 'mirrors', 'studio', 'scan'),
  ('Lighting equipment', 'lighting-equipment', 'studio', 'lamp-desk'),
  ('Tripod', 'tripod', 'studio', 'camera'),
  ('Kitchen', 'kitchen', 'comfort', 'cooking-pot'),
  ('Terrace', 'terrace', 'outdoor', 'sunset'),
  ('Outdoor area', 'outdoor-area', 'outdoor', 'trees')
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  icon_name = excluded.icon_name;

create or replace function private.refresh_space_rating()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_space_id uuid;
begin
  if tg_op = 'DELETE' then
    target_space_id := old.space_id;
  else
    target_space_id := new.space_id;
  end if;

  update public.spaces s
  set rating_average = coalesce(summary.average_rating, 0),
      review_count = coalesce(summary.total_reviews, 0),
      updated_at = now()
  from (
    select round(avg(r.overall_rating)::numeric, 2) as average_rating,
           count(*)::integer as total_reviews
    from public.reviews r
    where r.space_id = target_space_id
  ) summary
  where s.id = target_space_id;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists refresh_space_rating_after_review on public.reviews;
create trigger refresh_space_rating_after_review
after insert or update or delete on public.reviews
for each row execute function private.refresh_space_rating();

update public.spaces s
set rating_average = coalesce(summary.average_rating, 0),
    review_count = coalesce(summary.total_reviews, 0)
from (
  select space_id, round(avg(overall_rating)::numeric, 2) as average_rating, count(*)::integer as total_reviews
  from public.reviews
  group by space_id
) summary
where s.id = summary.space_id;

create or replace view public.public_host_profiles
with (security_barrier = true)
as
select
  p.id,
  coalesce(nullif(p.display_name, ''), p.first_name) as display_name,
  p.avatar_url,
  p.bio,
  (p.identity_verification_status = 'verified' and p.age_verification_status = 'verified') as is_verified,
  p.created_at,
  round(avg(r.overall_rating)::numeric, 2) as host_rating
from public.profiles p
join public.user_roles ur on ur.user_id = p.id and ur.role = 'host'
left join public.spaces s on s.host_id = p.id and s.status = 'approved'
left join public.reviews r on r.space_id = s.id
group by p.id, p.display_name, p.first_name, p.avatar_url, p.bio, p.identity_verification_status, p.age_verification_status, p.created_at;

create or replace view public.public_space_reviews
with (security_barrier = true)
as
select
  r.id,
  r.space_id,
  r.overall_rating,
  r.comment,
  r.created_at,
  coalesce(nullif(p.display_name, ''), 'Verified guest') as author_display_name,
  p.avatar_url as author_avatar_url
from public.reviews r
join public.spaces s on s.id = r.space_id and s.status = 'approved'
left join public.profiles p on p.id = r.author_id;

revoke all on public.public_host_profiles, public.public_space_reviews from public;
grant select on public.public_host_profiles, public.public_space_reviews to anon, authenticated;

-- Public and ordinary authenticated clients can only project privacy-safe columns.
revoke select on public.spaces from anon, authenticated;
revoke select (exact_address, latitude, longitude) on public.spaces from anon, authenticated;
grant select (
  id, host_id, name, slug, short_description, description, space_type, status,
  city, state, country, approximate_location, max_guests,
  hourly_price, overnight_price, full_day_price, cleaning_fee, minimum_hours,
  privacy_score, instant_booking, creator_friendly, group_friendly, events_allowed,
  featured, cancellation_policy, check_in_notes, minimum_booking_notice_minutes,
  buffer_minutes, rating_average, review_count, house_rules,
  published_at, created_at, updated_at
) on public.spaces to anon, authenticated;

-- Booking and account identifiers are not part of public review responses.
revoke select on public.reviews from anon, authenticated;
grant select (id, space_id, overall_rating, cleanliness_rating, privacy_rating, accuracy_rating, host_rating, discretion_rating, comment, created_at)
  on public.reviews to anon, authenticated;
drop policy if exists "reviews_public_select" on public.reviews;
drop policy if exists "reviews_visible_space" on public.reviews;
create policy "reviews_visible_space" on public.reviews
for select to anon, authenticated
using (
  exists (select 1 from public.spaces s where s.id = space_id and s.status = 'approved')
  or author_id = (select auth.uid())
  or private.owns_space(space_id)
  or private.is_admin()
);

-- Raw availability intervals are host data. Public users receive only a yes/no RPC result.
drop policy if exists "availability_visible" on public.availability;
drop policy if exists "availability_owner_select" on public.availability;
create policy "availability_owner_select" on public.availability
for select to authenticated
using (private.owns_space(space_id) or private.is_admin());
revoke select on public.availability from anon, authenticated;
grant select on public.availability to authenticated;

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
begin
  if p_date is null or p_start is null or p_duration_hours is null or p_duration_hours <= 0 or p_duration_hours > 24 or p_guests <= 0 then
    return false;
  end if;

  select max_guests, minimum_hours, minimum_booking_notice_minutes, buffer_minutes
  into space_capacity, minimum_duration, notice_minutes, turnover_minutes
  from public.spaces
  where id = p_space_id and status = 'approved';

  if not found or p_guests > space_capacity or p_duration_hours < minimum_duration then
    return false;
  end if;

  requested_start := (p_date + p_start) at time zone 'America/Mexico_City';
  requested_end := requested_start + make_interval(hours => p_duration_hours);

  if requested_start < now() + make_interval(mins => notice_minutes) then
    return false;
  end if;

  return not exists (
    select 1
    from public.availability a
    where a.space_id = p_space_id
      and a.status in ('blocked', 'reserved')
      and requested_start < (
        (a.date + a.end_time + case when a.end_time <= a.start_time then interval '1 day' else interval '0 days' end)
        at time zone 'America/Mexico_City'
      ) + make_interval(mins => turnover_minutes)
      and requested_end > ((a.date + a.start_time) at time zone 'America/Mexico_City') - make_interval(mins => turnover_minutes)
  ) and not exists (
    select 1
    from public.bookings b
    where b.space_id = p_space_id
      and b.status in ('pending', 'approved', 'payment_pending', 'confirmed')
      and requested_start < b.end_datetime + make_interval(mins => turnover_minutes)
      and requested_end > b.start_datetime - make_interval(mins => turnover_minutes)
  );
end;
$$;

revoke all on function public.check_space_availability(uuid, date, time, integer, integer) from public;
grant execute on function public.check_space_availability(uuid, date, time, integer, integer) to anon, authenticated;

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
      (select sp.storage_path from public.space_photos sp where sp.space_id = s.id order by sp.is_cover desc, sp.sort_order asc limit 1) as cover_photo,
      array(select a.slug from public.space_amenities sa join public.amenities a on a.id = sa.amenity_id where sa.space_id = s.id order by a.slug) as amenity_slugs,
      array(select a.name from public.space_amenities sa join public.amenities a on a.id = sa.amenity_id where sa.space_id = s.id order by a.slug) as amenity_names,
      array(select a.category from public.space_amenities sa join public.amenities a on a.id = sa.amenity_id where sa.space_id = s.id order by a.slug) as amenity_categories,
      array(select coalesce(a.icon_name, '') from public.space_amenities sa join public.amenities a on a.id = sa.amenity_id where sa.space_id = s.id order by a.slug) as amenity_icons,
      array(select u.slug from public.space_allowed_uses su join public.allowed_uses u on u.id = su.allowed_use_id where su.space_id = s.id and su.allowed order by u.slug) as allowed_use_slugs,
      array(select u.name from public.space_allowed_uses su join public.allowed_uses u on u.id = su.allowed_use_id where su.space_id = s.id and su.allowed order by u.slug) as allowed_use_names
    from public.spaces s
    where s.status = 'approved'
      and s.max_guests >= greatest(coalesce(p_guests, 1), 1)
      and (nullif(trim(p_location), '') is null or lower(concat_ws(' ', s.city, s.state, s.country, s.approximate_location)) like '%' || lower(trim(p_location)) || '%')
      and (p_min_price is null or coalesce(s.hourly_price, s.overnight_price, s.full_day_price) >= p_min_price)
      and (p_max_price is null or coalesce(s.hourly_price, s.overnight_price, s.full_day_price) <= p_max_price)
      and (p_privacy is null or s.privacy_score >= p_privacy)
      and (nullif(p_space_type, '') is null or case when replace(lower(s.space_type), ' ', '-') in ('private-suite','apartment','villa','studio','playroom','venue') then replace(lower(s.space_type), ' ', '-') else 'other' end = p_space_type)
      and (not p_creator_friendly or s.creator_friendly)
      and (not p_group_friendly or s.group_friendly)
      and (not p_events_allowed or s.events_allowed)
      and (not p_instant_booking or s.instant_booking)
      and not exists (
        select 1 from unnest(coalesce(p_amenity_slugs, '{}'::text[])) requested(slug)
        where not exists (
          select 1 from public.space_amenities sa join public.amenities a on a.id = sa.amenity_id
          where sa.space_id = s.id and a.slug = requested.slug
        )
      )
      and not exists (
        select 1 from unnest(coalesce(p_allowed_use_slugs, '{}'::text[])) requested(slug)
        where not exists (
          select 1 from public.space_allowed_uses su join public.allowed_uses u on u.id = su.allowed_use_id
          where su.space_id = s.id and su.allowed and u.slug = requested.slug
        )
      )
      and (p_date is null or p_start is null or public.check_space_availability(s.id, p_date, p_start, p_duration_hours, p_guests))
  )
  select
    c.id, c.slug, c.name, c.short_description, c.space_type, c.city, c.state, c.country,
    c.approximate_location, c.max_guests, c.hourly_price, c.overnight_price, c.full_day_price,
    c.cleaning_fee, c.minimum_hours, c.privacy_score, c.instant_booking, c.creator_friendly,
    c.group_friendly, c.events_allowed, c.featured, c.published_at, c.rating_average, c.review_count,
    c.cover_photo, c.amenity_slugs, c.amenity_names, c.amenity_categories, c.amenity_icons,
    c.allowed_use_slugs, c.allowed_use_names, count(*) over () as total_count
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

comment on function public.search_public_spaces is
  'Recommended order is deterministic: featured, rating average, Privacy Score, publication date, then slug.';

revoke all on function public.search_public_spaces(text, date, time, integer, integer, numeric, numeric, numeric, text, text[], text[], boolean, boolean, boolean, boolean, text, integer, integer) from public;
grant execute on function public.search_public_spaces(text, date, time, integer, integer, numeric, numeric, numeric, text, text[], text[], boolean, boolean, boolean, boolean, text, integer, integer) to anon, authenticated;

comment on column public.spaces.exact_address is
  'Private. Never grant this column to anon/authenticated clients; expose only through a future confirmed-booking authorization function.';
