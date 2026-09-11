-- Platform completion foundation: support, storage policies, and payment-ready neutral ledgers.

do $$
begin
  create type public.support_ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.payment_record_status as enum ('pending', 'confirmed', 'failed', 'refunded', 'disputed');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.payout_record_status as enum ('pending', 'available', 'paid', 'cancelled');
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 140),
  category text not null check (category in ('account','booking','host','payment','safety','technical','other')),
  description text not null check (char_length(description) between 10 and 4000),
  status public.support_ticket_status not null default 'open',
  admin_response text check (admin_response is null or char_length(admin_response) <= 4000),
  assigned_admin_id uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_user_status_idx on public.support_tickets(user_id, status, created_at desc);
create index if not exists support_tickets_status_idx on public.support_tickets(status, created_at desc);

drop trigger if exists support_tickets_updated_at on public.support_tickets;
create trigger support_tickets_updated_at
before update on public.support_tickets
for each row execute function private.set_updated_at();

create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  guest_id uuid not null references public.profiles(id) on delete restrict,
  space_id uuid not null references public.spaces(id) on delete restrict,
  provider text not null default 'pending_provider',
  provider_reference text,
  status public.payment_record_status not null default 'pending',
  gross_amount numeric(12,2) not null check (gross_amount >= 0),
  platform_fee numeric(12,2) not null default 0 check (platform_fee >= 0),
  host_net_amount numeric(12,2) not null default 0 check (host_net_amount >= 0),
  currency char(3) not null default 'MXN',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id)
);

create index if not exists payment_records_guest_idx on public.payment_records(guest_id, created_at desc);
create index if not exists payment_records_space_idx on public.payment_records(space_id, created_at desc);
create index if not exists payment_records_status_idx on public.payment_records(status, created_at desc);

drop trigger if exists payment_records_updated_at on public.payment_records;
create trigger payment_records_updated_at
before update on public.payment_records
for each row execute function private.set_updated_at();

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payment_records(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_payment_created_idx on public.payment_events(payment_id, created_at);

create table if not exists public.payout_records (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete restrict,
  payment_id uuid references public.payment_records(id) on delete set null,
  status public.payout_record_status not null default 'pending',
  gross_amount numeric(12,2) not null default 0 check (gross_amount >= 0),
  platform_fee numeric(12,2) not null default 0 check (platform_fee >= 0),
  net_amount numeric(12,2) not null default 0 check (net_amount >= 0),
  currency char(3) not null default 'MXN',
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payout_records_host_status_idx on public.payout_records(host_id, status, created_at desc);

drop trigger if exists payout_records_updated_at on public.payout_records;
create trigger payout_records_updated_at
before update on public.payout_records
for each row execute function private.set_updated_at();

alter table public.support_tickets enable row level security;
alter table public.payment_records enable row level security;
alter table public.payment_events enable row level security;
alter table public.payout_records enable row level security;

grant select, insert on public.support_tickets to authenticated;
revoke update, delete on public.support_tickets from authenticated;
grant select on public.payment_records, public.payment_events, public.payout_records to authenticated;

drop policy if exists "support_tickets_select_own_or_admin" on public.support_tickets;
create policy "support_tickets_select_own_or_admin" on public.support_tickets
for select to authenticated
using (user_id = (select auth.uid()) or private.is_admin());

drop policy if exists "support_tickets_insert_own" on public.support_tickets;
create policy "support_tickets_insert_own" on public.support_tickets
for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "support_tickets_user_update_limited" on public.support_tickets;
drop policy if exists "support_tickets_admin_update" on public.support_tickets;

create or replace function public.update_support_ticket_admin(
  p_ticket_id uuid,
  p_status public.support_ticket_status,
  p_admin_response text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'access_denied';
  end if;

  update public.support_tickets
  set
    status = p_status,
    admin_response = nullif(trim(p_admin_response), ''),
    assigned_admin_id = (select auth.uid()),
    resolved_at = case
      when p_status in ('resolved', 'closed') then coalesce(resolved_at, now())
      else null
    end
  where id = p_ticket_id;

  if not found then
    raise exception 'support_ticket_not_found';
  end if;
end;
$$;

revoke all on function public.update_support_ticket_admin(uuid, public.support_ticket_status, text) from public, anon, authenticated;
grant execute on function public.update_support_ticket_admin(uuid, public.support_ticket_status, text) to authenticated;

drop policy if exists "spaces_host_insert" on public.spaces;
create policy "spaces_host_insert" on public.spaces
for insert to authenticated
with check (
  host_id = (select auth.uid())
  and private.is_host()
  and status in ('draft', 'pending_review')
);

drop policy if exists "spaces_host_update" on public.spaces;
create policy "spaces_host_update" on public.spaces
for update to authenticated
using (host_id = (select auth.uid()) or private.is_admin())
with check (
  private.is_admin()
  or (
    host_id = (select auth.uid())
    and status in ('draft', 'pending_review', 'rejected')
  )
);

create or replace function public.admin_update_space_status(
  p_space_id uuid,
  p_status public.space_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'access_denied';
  end if;

  update public.spaces
  set
    status = p_status,
    published_at = case
      when p_status = 'approved' then coalesce(published_at, now())
      when p_status in ('draft', 'pending_review', 'rejected', 'suspended') then null
      else published_at
    end
  where id = p_space_id;

  if not found then
    raise exception 'space_not_found';
  end if;
end;
$$;

revoke all on function public.admin_update_space_status(uuid, public.space_status) from public, anon, authenticated;
grant execute on function public.admin_update_space_status(uuid, public.space_status) to authenticated;

create or replace function public.start_space_conversation(
  p_space_id uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  host_user_id uuid;
  conversation_uuid uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(trim(coalesce(p_body, ''))) < 1 then
    raise exception 'message_required';
  end if;

  select s.host_id
    into host_user_id
  from public.spaces s
  where s.id = p_space_id
    and (s.status = 'approved' or s.host_id = current_user_id or private.is_admin());

  if host_user_id is null then
    raise exception 'space_not_found';
  end if;

  if host_user_id = current_user_id then
    raise exception 'cannot_message_self';
  end if;

  insert into public.conversations(space_id)
  values (p_space_id)
  returning id into conversation_uuid;

  insert into public.conversation_participants(conversation_id, user_id)
  values
    (conversation_uuid, current_user_id),
    (conversation_uuid, host_user_id);

  insert into public.messages(conversation_id, sender_id, body)
  values (conversation_uuid, current_user_id, trim(p_body));

  return conversation_uuid;
end;
$$;

revoke all on function public.start_space_conversation(uuid, text) from public, anon, authenticated;
grant execute on function public.start_space_conversation(uuid, text) to authenticated;

drop policy if exists "payment_records_parties_select" on public.payment_records;
create policy "payment_records_parties_select" on public.payment_records
for select to authenticated
using (guest_id = (select auth.uid()) or private.owns_space(space_id) or private.is_admin());

drop policy if exists "payment_events_parties_select" on public.payment_events;
create policy "payment_events_parties_select" on public.payment_events
for select to authenticated
using (
  exists (
    select 1
    from public.payment_records pr
    where pr.id = payment_id
      and (pr.guest_id = (select auth.uid()) or private.owns_space(pr.space_id) or private.is_admin())
  )
);

drop policy if exists "payout_records_host_or_admin_select" on public.payout_records;
create policy "payout_records_host_or_admin_select" on public.payout_records
for select to authenticated
using (host_id = (select auth.uid()) or private.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'space-photos',
  'space-photos',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "space_photos_public_select" on storage.objects;
create policy "space_photos_public_select" on storage.objects
for select to anon, authenticated
using (bucket_id = 'space-photos');

drop policy if exists "space_photos_host_insert" on storage.objects;
create policy "space_photos_host_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'space-photos'
  and private.is_host()
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "space_photos_host_update" on storage.objects;
create policy "space_photos_host_update" on storage.objects
for update to authenticated
using (
  bucket_id = 'space-photos'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or private.is_admin())
)
with check (
  bucket_id = 'space-photos'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or private.is_admin())
);

drop policy if exists "space_photos_host_delete" on storage.objects;
create policy "space_photos_host_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'space-photos'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or private.is_admin())
);
