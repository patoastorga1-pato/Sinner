-- Account Settings preferences and avatar storage.
-- User preferences are private per-account data and are not exposed through public profile views.

begin;

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  language text not null default 'en' check (language in ('es-MX', 'en')),
  currency char(3) not null default 'MXN' check (currency = 'MXN'),
  timezone text check (
    timezone is null
    or timezone in (
      'America/Mexico_City',
      'America/Cancun',
      'America/Monterrey',
      'America/Merida',
      'America/Bahia_Banderas',
      'America/Mazatlan',
      'America/Chihuahua',
      'America/Hermosillo',
      'America/Tijuana',
      'America/Ciudad_Juarez'
    )
  ),
  email_reservations boolean not null default true,
  email_messages boolean not null default true,
  email_verification boolean not null default true,
  email_payments boolean not null default true,
  email_security boolean not null default true,
  in_app_reservations boolean not null default true,
  in_app_messages boolean not null default true,
  in_app_verification boolean not null default true,
  in_app_payments boolean not null default true,
  in_app_security boolean not null default true,
  discreet_notifications boolean not null default true,
  use_display_name boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_preferences_updated_at on public.user_preferences;
create trigger user_preferences_updated_at
before update on public.user_preferences
for each row
execute function private.set_updated_at();

alter table public.user_preferences enable row level security;

revoke all on public.user_preferences from anon, authenticated;
grant select, insert, update, delete on public.user_preferences to authenticated;

drop policy if exists "user_preferences_own_select" on public.user_preferences;
create policy "user_preferences_own_select" on public.user_preferences
for select to authenticated
using (user_id = (select auth.uid()) or private.is_admin());

drop policy if exists "user_preferences_own_insert" on public.user_preferences;
create policy "user_preferences_own_insert" on public.user_preferences
for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "user_preferences_own_update" on public.user_preferences;
create policy "user_preferences_own_update" on public.user_preferences
for update to authenticated
using (user_id = (select auth.uid()) or private.is_admin())
with check (user_id = (select auth.uid()) or private.is_admin());

drop policy if exists "user_preferences_own_delete" on public.user_preferences;
create policy "user_preferences_own_delete" on public.user_preferences
for delete to authenticated
using (user_id = (select auth.uid()) or private.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_public_select" on storage.objects;
create policy "avatars_public_select" on storage.objects
for select to anon, authenticated
using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or private.is_admin())
)
with check (
  bucket_id = 'avatars'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or private.is_admin())
);

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or private.is_admin())
);

comment on table public.user_preferences is 'Private per-user account settings used by the SINNER Account Center.';
comment on column public.user_preferences.discreet_notifications is 'When true, downstream notifications and email templates should avoid sensitive booking details.';
comment on column public.user_preferences.use_display_name is 'When true, product surfaces should prefer display_name over legal first/last name where appropriate.';
comment on column public.profiles.avatar_url is 'Public URL for the user avatar image. Avatar files are stored in the public avatars bucket.';

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
      and table_name = 'user_preferences'
  ) then
    raise exception 'user_preferences table was not created.';
  end if;

  if not exists (select 1 from storage.buckets where id = 'avatars') then
    raise exception 'avatars bucket was not created.';
  end if;
end $$;

commit;
