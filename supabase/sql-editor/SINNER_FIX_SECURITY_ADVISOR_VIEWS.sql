-- SINNER - FIX SECURITY ADVISOR: Security Definer Views
-- Ejecuta TODO este archivo en Supabase SQL Editor.
-- Corrige los 3 errores:
-- public.public_profiles
-- public.public_host_profiles
-- public.public_space_reviews

begin;

create or replace function private.public_profile_rows()
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.created_at
  from public.profiles p;
$$;

create or replace function private.public_host_profile_rows()
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  bio text,
  is_verified boolean,
  created_at timestamptz,
  host_rating numeric
)
language sql
stable
security definer
set search_path = ''
as $$
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
  group by
    p.id,
    p.display_name,
    p.first_name,
    p.avatar_url,
    p.bio,
    p.identity_verification_status,
    p.age_verification_status,
    p.created_at;
$$;

create or replace function private.public_space_review_rows()
returns table (
  id uuid,
  space_id uuid,
  overall_rating smallint,
  comment text,
  created_at timestamptz,
  author_display_name text,
  author_avatar_url text
)
language sql
stable
security definer
set search_path = ''
as $$
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
$$;

create or replace view public.public_profiles
with (security_invoker = true, security_barrier = true)
as
select * from private.public_profile_rows();

create or replace view public.public_host_profiles
with (security_invoker = true, security_barrier = true)
as
select * from private.public_host_profile_rows();

create or replace view public.public_space_reviews
with (security_invoker = true, security_barrier = true)
as
select * from private.public_space_review_rows();

grant usage on schema private to anon, authenticated;

revoke all on public.public_profiles, public.public_host_profiles, public.public_space_reviews from PUBLIC;
grant select on public.public_profiles, public.public_host_profiles, public.public_space_reviews to anon, authenticated;

revoke all on function private.public_profile_rows() from PUBLIC, anon, authenticated;
revoke all on function private.public_host_profile_rows() from PUBLIC, anon, authenticated;
revoke all on function private.public_space_review_rows() from PUBLIC, anon, authenticated;
grant execute on function private.public_profile_rows() to anon, authenticated;
grant execute on function private.public_host_profile_rows() to anon, authenticated;
grant execute on function private.public_space_review_rows() to anon, authenticated;

comment on view public.public_profiles is
  'Privacy-safe public projection. Uses security_invoker=true to satisfy Supabase Security Advisor.';
comment on view public.public_host_profiles is
  'Privacy-safe host projection. Uses security_invoker=true to satisfy Supabase Security Advisor.';
comment on view public.public_space_reviews is
  'Privacy-safe review projection. Uses security_invoker=true to satisfy Supabase Security Advisor.';

notify pgrst, 'reload schema';

do $$
declare
  unsafe_view text;
begin
  select c.relname
  into unsafe_view
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('public_profiles', 'public_host_profiles', 'public_space_reviews')
    and not ('security_invoker=true' = any(coalesce(c.reloptions, array[]::text[])))
  limit 1;

  if unsafe_view is not null then
    raise exception 'SINNER security advisor fix failed: public.% is not security_invoker.', unsafe_view;
  end if;

  if has_column_privilege('anon', 'public.spaces', 'exact_address', 'select')
     or has_column_privilege('authenticated', 'public.spaces', 'exact_address', 'select') then
    raise exception 'SINNER security advisor fix failed: exact_address is exposed.';
  end if;

  raise notice 'SINNER Security Advisor view fix verified successfully.';
end;
$$;

commit;
