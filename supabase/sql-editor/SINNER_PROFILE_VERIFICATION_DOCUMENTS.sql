-- SINNER profile verification documents.
-- Copy/paste this complete SQL into Supabase SQL Editor.

begin;

alter table public.profiles
  add column if not exists gender text,
  add column if not exists age_verification_document_path text,
  add column if not exists age_verification_submitted_at timestamptz,
  add column if not exists age_verification_reviewed_at timestamptz,
  add column if not exists age_verification_rejection_reason text;

do $$
begin
  alter table public.profiles
    add constraint profiles_gender_check
    check (gender is null or gender in ('male', 'female'));
exception
  when duplicate_object then null;
end $$;

create index if not exists profiles_gender_idx on public.profiles(gender);
create index if not exists profiles_age_verification_status_idx on public.profiles(age_verification_status);
create index if not exists profiles_age_verification_submitted_idx on public.profiles(age_verification_submitted_at desc);

create or replace function private.guard_profile_verification_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.is_admin() then
    return new;
  end if;

  if new.age_verification_document_path is distinct from old.age_verification_document_path then
    if new.age_verification_status <> 'pending'::public.verification_status then
      raise exception 'Age verification document changes must move the profile to pending review.';
    end if;

    new.age_verification_reviewed_at := null;
    new.age_verification_rejection_reason := null;
    return new;
  end if;

  if new.age_verification_status is distinct from old.age_verification_status
     and new.age_verification_status <> 'pending'::public.verification_status then
    raise exception 'Only admins can approve or reject age verification.';
  end if;

  if new.age_verification_reviewed_at is distinct from old.age_verification_reviewed_at then
    raise exception 'Only admins can change age verification review metadata.';
  end if;

  if new.age_verification_rejection_reason is distinct from old.age_verification_rejection_reason then
    raise exception 'Only admins can change age verification review metadata.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_verification_update on public.profiles;
create trigger guard_profile_verification_update
before update on public.profiles
for each row
execute function private.guard_profile_verification_update();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'identity-documents',
  'identity-documents',
  false,
  8388608,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "identity_documents_owner_or_admin_select" on storage.objects;
create policy "identity_documents_owner_or_admin_select" on storage.objects
for select to authenticated
using (
  bucket_id = 'identity-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or private.is_admin()
  )
);

drop policy if exists "identity_documents_owner_insert" on storage.objects;
create policy "identity_documents_owner_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'identity-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "identity_documents_owner_or_admin_update" on storage.objects;
create policy "identity_documents_owner_or_admin_update" on storage.objects
for update to authenticated
using (
  bucket_id = 'identity-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or private.is_admin()
  )
)
with check (
  bucket_id = 'identity-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or private.is_admin()
  )
);

drop policy if exists "identity_documents_owner_or_admin_delete" on storage.objects;
create policy "identity_documents_owner_or_admin_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'identity-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or private.is_admin()
  )
);

comment on column public.profiles.gender is 'Self-selected identity option used by SINNER: male or female.';
comment on column public.profiles.age_verification_document_path is 'Private Supabase Storage path for the uploaded age verification identification photo.';
comment on column public.profiles.age_verification_submitted_at is 'Timestamp when the current age verification identification photo was submitted.';
comment on column public.profiles.age_verification_reviewed_at is 'Timestamp when an admin reviewed the current age verification document.';
comment on column public.profiles.age_verification_rejection_reason is 'Private admin reason when age verification is rejected.';

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'age_verification_document_path'
  ) then
    raise exception 'Profile verification columns were not created.';
  end if;

  if not exists (select 1 from storage.buckets where id = 'identity-documents') then
    raise exception 'identity-documents bucket was not created.';
  end if;
end $$;

commit;
