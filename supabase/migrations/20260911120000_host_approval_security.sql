-- Phase 1 security: primary admin bootstrap and host approval workflow.

do $$
begin
  create type public.host_application_status as enum ('pending', 'approved', 'rejected', 'suspended');
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.host_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.host_application_status not null default 'pending',
  applicant_email text,
  request_note text check (request_note is null or char_length(request_note) <= 1000),
  decision_note text check (decision_note is null or char_length(decision_note) <= 1000),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists host_applications_status_idx on public.host_applications(status, requested_at desc);
create index if not exists host_applications_user_id_idx on public.host_applications(user_id);

drop trigger if exists host_applications_updated_at on public.host_applications;
create trigger host_applications_updated_at
before update on public.host_applications
for each row execute function private.set_updated_at();

create or replace function private.assign_primary_admin_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(coalesce(new.email, '')) = 'sinner.adults@gmail.com' then
    insert into public.user_roles(user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_primary_admin on auth.users;
create trigger on_auth_user_primary_admin
after insert or update of email on auth.users
for each row execute function private.assign_primary_admin_role();

insert into public.user_roles(user_id, role)
select u.id, 'admin'
from auth.users u
where lower(coalesce(u.email, '')) = 'sinner.adults@gmail.com'
on conflict (user_id, role) do nothing;

insert into public.host_applications(
  user_id,
  status,
  applicant_email,
  decision_note,
  reviewed_at
)
select
  ur.user_id,
  'approved'::public.host_application_status,
  u.email,
  'Existing host role backfilled as approved.',
  now()
from public.user_roles ur
join public.profiles p on p.id = ur.user_id
left join auth.users u on u.id = ur.user_id
where ur.role = 'host'
on conflict (user_id) do update set
  status = 'approved'::public.host_application_status,
  applicant_email = coalesce(excluded.applicant_email, public.host_applications.applicant_email),
  decision_note = coalesce(public.host_applications.decision_note, excluded.decision_note),
  reviewed_at = coalesce(public.host_applications.reviewed_at, excluded.reviewed_at);

alter table public.host_applications enable row level security;

grant select on public.host_applications to authenticated;
revoke insert, update, delete on public.host_applications from authenticated;

drop policy if exists "host_applications_select_own_or_admin" on public.host_applications;
create policy "host_applications_select_own_or_admin" on public.host_applications
for select to authenticated
using (user_id = (select auth.uid()) or private.is_admin());

drop function if exists public.request_host_role();

create or replace function public.request_host_role(p_request_note text default null)
returns table (
  id uuid,
  status public.host_application_status
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_email text;
  existing public.host_applications%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select u.email into current_email
  from auth.users u
  where u.id = current_user_id;

  if exists (
    select 1
    from public.user_roles ur
    where ur.user_id = current_user_id
      and ur.role = 'host'
  ) then
    insert into public.host_applications(user_id, status, applicant_email, decision_note, reviewed_at)
    values (
      current_user_id,
      'approved'::public.host_application_status,
      current_email,
      'Existing host access.',
      now()
    )
    on conflict (user_id) do update set
      status = 'approved'::public.host_application_status,
      applicant_email = coalesce(excluded.applicant_email, public.host_applications.applicant_email);

    return query
      select ha.id, ha.status
      from public.host_applications ha
      where ha.user_id = current_user_id;
    return;
  end if;

  select *
  into existing
  from public.host_applications ha
  where ha.user_id = current_user_id;

  if existing.id is not null then
    if existing.status = 'pending'::public.host_application_status then
      return query select existing.id, existing.status;
      return;
    end if;

    if existing.status = 'suspended'::public.host_application_status then
      raise exception 'host_access_suspended';
    end if;

    if existing.status = 'approved'::public.host_application_status then
      insert into public.user_roles(user_id, role)
      values (current_user_id, 'host')
      on conflict (user_id, role) do nothing;

      return query select existing.id, existing.status;
      return;
    end if;

    update public.host_applications ha
    set
      status = 'pending'::public.host_application_status,
      applicant_email = current_email,
      request_note = nullif(trim(coalesce(p_request_note, '')), ''),
      decision_note = null,
      reviewed_by = null,
      reviewed_at = null,
      requested_at = now()
    where ha.id = existing.id
    returning ha.* into existing;

    return query select existing.id, existing.status;
    return;
  end if;

  insert into public.host_applications(user_id, applicant_email, request_note)
  values (
    current_user_id,
    current_email,
    nullif(trim(coalesce(p_request_note, '')), '')
  )
  returning * into existing;

  return query select existing.id, existing.status;
end;
$$;

revoke all on function public.request_host_role(text) from public;
grant execute on function public.request_host_role(text) to authenticated;

create or replace function public.approve_host_request(
  p_request_id uuid,
  p_decision_note text default null
)
returns table (
  id uuid,
  user_id uuid,
  status public.host_application_status
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  application public.host_applications%rowtype;
begin
  if current_user_id is null or not private.is_admin() then
    raise exception 'access_denied';
  end if;

  update public.host_applications ha
  set
    status = 'approved'::public.host_application_status,
    decision_note = nullif(trim(coalesce(p_decision_note, '')), ''),
    reviewed_by = current_user_id,
    reviewed_at = now()
  where ha.id = p_request_id
    and ha.status in ('pending'::public.host_application_status, 'rejected'::public.host_application_status)
  returning ha.* into application;

  if application.id is null then
    raise exception 'host_request_not_pending';
  end if;

  insert into public.user_roles(user_id, role)
  values (application.user_id, 'host')
  on conflict (user_id, role) do nothing;

  insert into public.notifications(user_id, type, title, body, data)
  values (
    application.user_id,
    'verification_required',
    'Host access approved',
    'Your host access has been approved. You can now open the host dashboard.',
    jsonb_build_object('host_application_id', application.id)
  );

  return query select application.id, application.user_id, application.status;
end;
$$;

create or replace function public.reject_host_request(
  p_request_id uuid,
  p_decision_note text default null
)
returns table (
  id uuid,
  user_id uuid,
  status public.host_application_status
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  application public.host_applications%rowtype;
begin
  if current_user_id is null or not private.is_admin() then
    raise exception 'access_denied';
  end if;

  update public.host_applications ha
  set
    status = 'rejected'::public.host_application_status,
    decision_note = nullif(trim(coalesce(p_decision_note, '')), ''),
    reviewed_by = current_user_id,
    reviewed_at = now()
  where ha.id = p_request_id
    and ha.status = 'pending'::public.host_application_status
  returning ha.* into application;

  if application.id is null then
    raise exception 'host_request_not_pending';
  end if;

  insert into public.notifications(user_id, type, title, body, data)
  values (
    application.user_id,
    'verification_required',
    'Host access not approved',
    'Your host access request was reviewed but not approved. You can submit a new request from host onboarding.',
    jsonb_build_object('host_application_id', application.id)
  );

  return query select application.id, application.user_id, application.status;
end;
$$;

revoke all on function public.approve_host_request(uuid, text) from public;
revoke all on function public.reject_host_request(uuid, text) from public;
grant execute on function public.approve_host_request(uuid, text) to authenticated;
grant execute on function public.reject_host_request(uuid, text) to authenticated;
