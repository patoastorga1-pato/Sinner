-- Operational foundation for host-created experiences and ticketed events.
-- Additive migration. Existing experiences, events and tickets remain intact.

create table if not exists public.experience_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0
);

insert into public.experience_categories (name, slug, sort_order) values
  ('Wellness', 'wellness', 10), ('Dining', 'dining', 20), ('Nightlife', 'nightlife', 30),
  ('Photography', 'photography', 40), ('Workshops', 'workshops', 50), ('Private entertainment', 'private-entertainment', 60),
  ('Tours', 'tours', 70), ('Other', 'other', 100)
on conflict (slug) do nothing;

alter table public.experiences add column if not exists short_description text;
alter table public.experiences add column if not exists locality text;
alter table public.experiences add column if not exists municipality text;
alter table public.experiences add column if not exists exact_address text;
alter table public.experiences add column if not exists approximate_location text;
alter table public.experiences add column if not exists timezone text not null default 'America/Mexico_City';
alter table public.experiences add column if not exists minimum_age integer not null default 18;
alter table public.experiences add column if not exists cancellation_policy text;
alter table public.experiences add column if not exists requirements text;
alter table public.experiences add column if not exists what_is_included text;
alter table public.experiences add column if not exists featured boolean not null default false;

create table if not exists public.experience_category_links (
  experience_id uuid not null references public.experiences(id) on delete cascade,
  category_id uuid not null references public.experience_categories(id) on delete cascade,
  primary key (experience_id, category_id)
);

create table if not exists public.experience_media (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  unique (experience_id, storage_path)
);

create table if not exists public.experience_sessions (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null check (capacity > 0),
  reserved_count integer not null default 0 check (reserved_count >= 0 and reserved_count <= capacity),
  status text not null default 'scheduled' check (status in ('scheduled','sold_out','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

alter table public.events add column if not exists category text not null default 'other';
alter table public.events add column if not exists short_description text;
alter table public.events add column if not exists locality text;
alter table public.events add column if not exists municipality text;
alter table public.events add column if not exists exact_address text;
alter table public.events add column if not exists approximate_location text;
alter table public.events add column if not exists timezone text not null default 'America/Mexico_City';
alter table public.events add column if not exists minimum_age integer not null default 18;
alter table public.events add column if not exists doors_open_time time;
alter table public.events add column if not exists sales_start_at timestamptz;
alter table public.events add column if not exists sales_end_at timestamptz;
alter table public.events add column if not exists cancellation_policy text;
alter table public.events add column if not exists house_rules text;

create table if not exists public.event_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  unique (event_id, storage_path)
);

create table if not exists public.event_ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  currency char(3) not null default 'MXN',
  quantity_total integer not null check (quantity_total > 0),
  quantity_sold integer not null default 0 check (quantity_sold >= 0 and quantity_sold <= quantity_total),
  max_per_order integer not null default 6 check (max_per_order > 0),
  sales_start_at timestamptz,
  sales_end_at timestamptz,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, name)
);

create table if not exists public.event_orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null unique default ('EVT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  event_id uuid not null references public.events(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'payment_pending' check (status in ('payment_pending','paid','cancelled','expired','refunded','partially_refunded','disputed')),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  service_fee numeric(12,2) not null default 0 check (service_fee >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  currency char(3) not null default 'MXN',
  provider text,
  provider_reference text,
  idempotency_key text not null unique,
  hold_expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.event_orders(id) on delete cascade,
  ticket_type_id uuid not null references public.event_ticket_types(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  unique (order_id, ticket_type_id)
);

alter table public.event_tickets drop constraint if exists event_tickets_event_id_user_id_key;
alter table public.event_tickets add column if not exists order_id uuid references public.event_orders(id) on delete restrict;
alter table public.event_tickets add column if not exists ticket_type_id uuid references public.event_ticket_types(id) on delete restrict;
alter table public.event_tickets add column if not exists attendee_name text;
alter table public.event_tickets add column if not exists qr_token uuid not null default gen_random_uuid();
alter table public.event_tickets add column if not exists issued_at timestamptz not null default now();
alter table public.event_tickets add column if not exists used_at timestamptz;
create unique index if not exists event_tickets_qr_token_idx on public.event_tickets(qr_token);

create table if not exists public.event_checkins (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null unique references public.event_tickets(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  checked_in_by uuid not null references public.profiles(id) on delete restrict,
  checked_in_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists experience_sessions_start_idx on public.experience_sessions(experience_id, starts_at);
create index if not exists event_ticket_types_event_idx on public.event_ticket_types(event_id, sort_order);
create index if not exists event_orders_buyer_idx on public.event_orders(buyer_id, created_at desc);
create index if not exists event_orders_event_idx on public.event_orders(event_id, status, created_at desc);

do $$ begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('listing-media', 'listing-media', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif'])
  on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
exception when undefined_table then null; end $$;

alter table public.experience_categories enable row level security;
alter table public.experience_category_links enable row level security;
alter table public.experience_media enable row level security;
alter table public.experience_sessions enable row level security;
alter table public.event_media enable row level security;
alter table public.event_ticket_types enable row level security;
alter table public.event_orders enable row level security;
alter table public.event_order_items enable row level security;
alter table public.event_checkins enable row level security;

grant select on public.experience_categories, public.experience_category_links, public.experience_media, public.experience_sessions, public.event_media, public.event_ticket_types to anon, authenticated;
grant select, insert, update, delete on public.experience_category_links, public.experience_media, public.experience_sessions, public.event_media, public.event_ticket_types to authenticated;
grant select on public.event_orders, public.event_order_items, public.event_checkins to authenticated;

create policy "experience categories public read" on public.experience_categories for select using (active or private.is_admin());
create policy "experience links visible with experience" on public.experience_category_links for select using (exists (select 1 from public.experiences e where e.id = experience_id and (e.status = 'approved' or e.host_id = auth.uid() or private.is_admin())));
create policy "experience links host manage" on public.experience_category_links for all to authenticated using (exists (select 1 from public.experiences e where e.id = experience_id and (e.host_id = auth.uid() or private.is_admin()))) with check (exists (select 1 from public.experiences e where e.id = experience_id and (e.host_id = auth.uid() or private.is_admin())));
create policy "experience media visible" on public.experience_media for select using (exists (select 1 from public.experiences e where e.id = experience_id and (e.status = 'approved' or e.host_id = auth.uid() or private.is_admin())));
create policy "experience media host manage" on public.experience_media for all to authenticated using (exists (select 1 from public.experiences e where e.id = experience_id and (e.host_id = auth.uid() or private.is_admin()))) with check (exists (select 1 from public.experiences e where e.id = experience_id and (e.host_id = auth.uid() or private.is_admin())));
create policy "experience sessions visible" on public.experience_sessions for select using (exists (select 1 from public.experiences e where e.id = experience_id and (e.status = 'approved' or e.host_id = auth.uid() or private.is_admin())));
create policy "experience sessions host manage" on public.experience_sessions for all to authenticated using (exists (select 1 from public.experiences e where e.id = experience_id and (e.host_id = auth.uid() or private.is_admin()))) with check (exists (select 1 from public.experiences e where e.id = experience_id and (e.host_id = auth.uid() or private.is_admin())));

create policy "event media visible" on public.event_media for select using (exists (select 1 from public.events e where e.id = event_id and (e.status = 'approved' or e.organizer_id = auth.uid() or private.is_admin())));
create policy "event media organizer manage" on public.event_media for all to authenticated using (exists (select 1 from public.events e where e.id = event_id and (e.organizer_id = auth.uid() or private.is_admin()))) with check (exists (select 1 from public.events e where e.id = event_id and (e.organizer_id = auth.uid() or private.is_admin())));
create policy "ticket types visible" on public.event_ticket_types for select using (exists (select 1 from public.events e where e.id = event_id and (e.status = 'approved' or e.organizer_id = auth.uid() or private.is_admin())));
create policy "ticket types organizer manage" on public.event_ticket_types for all to authenticated using (exists (select 1 from public.events e where e.id = event_id and (e.organizer_id = auth.uid() or private.is_admin()))) with check (exists (select 1 from public.events e where e.id = event_id and (e.organizer_id = auth.uid() or private.is_admin())));
create policy "event orders parties read" on public.event_orders for select to authenticated using (buyer_id = auth.uid() or exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid()) or private.is_admin());
create policy "event order items parties read" on public.event_order_items for select to authenticated using (exists (select 1 from public.event_orders o join public.events e on e.id = o.event_id where o.id = order_id and (o.buyer_id = auth.uid() or e.organizer_id = auth.uid() or private.is_admin())));
create policy "event checkins parties read" on public.event_checkins for select to authenticated using (exists (select 1 from public.events e where e.id = event_id and (e.organizer_id = auth.uid() or private.is_admin())) or exists (select 1 from public.event_tickets t where t.id = ticket_id and t.user_id = auth.uid()));

drop policy if exists "listing media public read" on storage.objects;
create policy "listing media public read" on storage.objects for select using (bucket_id = 'listing-media');
drop policy if exists "listing media host insert" on storage.objects;
create policy "listing media host insert" on storage.objects for insert to authenticated with check (bucket_id = 'listing-media' and private.is_host() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "listing media host update" on storage.objects;
create policy "listing media host update" on storage.objects for update to authenticated using (bucket_id = 'listing-media' and ((storage.foldername(name))[1] = auth.uid()::text or private.is_admin()));
drop policy if exists "listing media host delete" on storage.objects;
create policy "listing media host delete" on storage.objects for delete to authenticated using (bucket_id = 'listing-media' and ((storage.foldername(name))[1] = auth.uid()::text or private.is_admin()));

comment on table public.event_orders is 'Provider-neutral ticket orders. Paid status must be set only by a trusted payment webhook.';
comment on table public.event_tickets is 'Issued event admissions. Production tickets are created only after confirmed payment.';
