-- Protected private reads for host listing review workflows.
-- Keeps exact address and postal code out of normal table selects while allowing
-- the owning host and platform admins to complete moderation tasks.

begin;

create or replace function public.admin_list_spaces_for_review(
  p_limit integer default 150
)
returns table (
  id uuid,
  host_id uuid,
  name text,
  slug text,
  status public.space_status,
  space_type text,
  city text,
  state text,
  country text,
  locality text,
  municipality text,
  approximate_location text,
  exact_address text,
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
  rating_average numeric,
  review_count integer,
  created_at timestamptz,
  updated_at timestamptz,
  published_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'access_denied';
  end if;

  return query
  select
    s.id,
    s.host_id,
    s.name,
    s.slug,
    s.status,
    s.space_type,
    s.city,
    s.state,
    s.country,
    s.locality,
    s.municipality,
    s.approximate_location,
    s.exact_address,
    s.max_guests,
    s.hourly_price,
    s.overnight_price,
    s.full_day_price,
    s.cleaning_fee,
    s.minimum_hours,
    s.privacy_score,
    s.instant_booking,
    s.creator_friendly,
    s.group_friendly,
    s.events_allowed,
    s.featured,
    s.rating_average,
    s.review_count,
    s.created_at,
    s.updated_at,
    s.published_at
  from public.spaces s
  order by s.created_at desc
  limit greatest(1, least(coalesce(p_limit, 150), 500));
end;
$$;

create or replace function public.get_host_space_private_location(
  p_space_id uuid
)
returns table (
  postal_code text,
  exact_address text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if not exists (
    select 1
    from public.spaces s
    where s.id = p_space_id
      and (s.host_id = current_user_id or private.is_admin())
  ) then
    raise exception 'space_not_found';
  end if;

  return query
  select s.postal_code, s.exact_address
  from public.spaces s
  where s.id = p_space_id;
end;
$$;

create or replace function public.submit_host_space_for_review(
  p_space_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  listing public.spaces%rowtype;
  missing text[] := '{}';
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if not private.is_host() then
    raise exception 'host_access_required';
  end if;

  select *
  into listing
  from public.spaces s
  where s.id = p_space_id
    and s.host_id = current_user_id;

  if not found then
    raise exception 'space_not_found';
  end if;

  if listing.status = 'pending_review'::public.space_status then
    raise exception 'listing_already_pending_review';
  end if;

  if listing.status = 'approved'::public.space_status then
    raise exception 'approved_listing_must_be_edited';
  end if;

  if listing.status = 'suspended'::public.space_status then
    raise exception 'suspended_listing_requires_admin';
  end if;

  if nullif(trim(coalesce(listing.name, '')), '') is null then
    missing := array_append(missing, 'name');
  end if;

  if nullif(trim(coalesce(listing.description, listing.short_description, '')), '') is null then
    missing := array_append(missing, 'description');
  end if;

  if nullif(trim(coalesce(listing.country, '')), '') is null then
    missing := array_append(missing, 'country');
  end if;

  if nullif(trim(coalesce(listing.country_code, '')), '') is null then
    missing := array_append(missing, 'country code');
  end if;

  if nullif(trim(coalesce(listing.state, '')), '') is null then
    missing := array_append(missing, 'state');
  end if;

  if nullif(trim(coalesce(listing.state_code, '')), '') is null then
    missing := array_append(missing, 'state code');
  end if;

  if nullif(trim(coalesce(listing.municipality, '')), '') is null then
    missing := array_append(missing, 'municipality');
  end if;

  if nullif(trim(coalesce(listing.city, '')), '') is null then
    missing := array_append(missing, 'city');
  end if;

  if nullif(trim(coalesce(listing.locality, '')), '') is null then
    missing := array_append(missing, 'locality / neighborhood');
  end if;

  if nullif(trim(coalesce(listing.postal_code, '')), '') is null then
    missing := array_append(missing, 'postal code');
  end if;

  if nullif(trim(coalesce(listing.approximate_location, '')), '') is null then
    missing := array_append(missing, 'public location');
  end if;

  if nullif(trim(coalesce(listing.exact_address, '')), '') is null then
    missing := array_append(missing, 'exact address');
  end if;

  if coalesce(listing.hourly_price, 0) <= 0
     and coalesce(listing.overnight_price, 0) <= 0
     and coalesce(listing.full_day_price, 0) <= 0 then
    missing := array_append(missing, 'at least one price');
  end if;

  if array_length(missing, 1) is not null then
    raise exception 'missing_review_fields:%', array_to_string(missing, ', ');
  end if;

  update public.spaces
  set status = 'pending_review'::public.space_status,
      updated_at = now()
  where id = listing.id;
end;
$$;

revoke all on function public.admin_list_spaces_for_review(integer) from public, anon, authenticated;
revoke all on function public.get_host_space_private_location(uuid) from public, anon, authenticated;
revoke all on function public.submit_host_space_for_review(uuid) from public, anon, authenticated;

grant execute on function public.admin_list_spaces_for_review(integer) to authenticated;
grant execute on function public.get_host_space_private_location(uuid) to authenticated;
grant execute on function public.submit_host_space_for_review(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
