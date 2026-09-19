-- SINNER admin operations foundation.
-- Additive only: keeps the existing user_roles admin role working as super admin.

create table if not exists public.admin_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'moderator', 'support', 'finance')),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, role)
);

create index if not exists admin_role_assignments_active_user_idx
  on public.admin_role_assignments (user_id)
  where revoked_at is null;

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id text not null,
  previous_state jsonb,
  new_state jsonb,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log (target_type, target_id, created_at desc);
create index if not exists admin_audit_log_admin_idx on public.admin_audit_log (admin_id, created_at desc);

create or replace function private.has_admin_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public, auth, private
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role::text = 'admin'
  ) and (
    not exists (
      select 1 from public.admin_role_assignments ara
      where ara.user_id = auth.uid() and ara.revoked_at is null
    )
    or exists (
      select 1 from public.admin_role_assignments ara
      where ara.user_id = auth.uid()
        and ara.revoked_at is null
        and (
          ara.role = 'super_admin'
          or (ara.role = 'moderator' and p_permission in ('users.read','hosts.manage','content.manage','reports.manage','reviews.manage','safety.read','audit.read'))
          or (ara.role = 'support' and p_permission in ('users.basic','bookings.read','support.manage','audit.read'))
          or (ara.role = 'finance' and p_permission in ('bookings.read','payments.read','payouts.read','audit.read'))
        )
    )
  );
$$;

revoke all on function private.has_admin_permission(text) from public;
grant execute on function private.has_admin_permission(text) to authenticated;

alter table public.admin_role_assignments enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists "admin roles readable by authorized admins" on public.admin_role_assignments;
create policy "admin roles readable by authorized admins"
  on public.admin_role_assignments for select to authenticated
  using (private.has_admin_permission('roles.manage'));

drop policy if exists "audit readable by authorized admins" on public.admin_audit_log;
create policy "audit readable by authorized admins"
  on public.admin_audit_log for select to authenticated
  using (private.has_admin_permission('audit.read'));

revoke insert, update, delete on public.admin_audit_log from authenticated;
revoke insert, update, delete on public.admin_role_assignments from authenticated;

create or replace function public.record_admin_audit_event(
  p_action text,
  p_target_type text,
  p_target_id text,
  p_previous_state jsonb default null,
  p_new_state jsonb default null,
  p_reason text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, private
as $$
declare
  v_id uuid;
begin
  if not private.has_admin_permission('audit.write') then
    raise exception 'access_denied';
  end if;
  if nullif(trim(p_action), '') is null or nullif(trim(p_target_type), '') is null or nullif(trim(p_target_id), '') is null then
    raise exception 'audit_action_and_target_required';
  end if;
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, previous_state, new_state, reason, metadata)
  values (auth.uid(), trim(p_action), trim(p_target_type), trim(p_target_id), p_previous_state, p_new_state, nullif(trim(p_reason), ''), coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.record_admin_audit_event(text,text,text,jsonb,jsonb,text,jsonb) from public;
grant execute on function public.record_admin_audit_event(text,text,text,jsonb,jsonb,text,jsonb) to authenticated;

comment on table public.admin_audit_log is 'Append-only log for sensitive SINNER administrative actions.';
comment on table public.admin_role_assignments is 'Granular admin roles layered over the existing user_roles admin gate.';
