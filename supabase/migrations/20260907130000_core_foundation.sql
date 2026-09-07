create extension if not exists pgcrypto;

create type public.user_role as enum ('guest', 'host', 'admin');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type public.space_status as enum ('draft', 'pending_review', 'approved', 'rejected', 'suspended');
create type public.availability_status as enum ('available', 'blocked', 'reserved');
create type public.booking_status as enum ('draft', 'pending', 'approved', 'payment_pending', 'confirmed', 'completed', 'cancelled', 'declined', 'refunded', 'disputed');
create type public.listing_status as enum ('draft', 'pending_review', 'approved', 'rejected', 'suspended');
create type public.event_visibility as enum ('public', 'private', 'invite_only');
create type public.ticket_status as enum ('valid', 'used', 'cancelled', 'refunded');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  display_name text check (display_name is null or char_length(display_name) <= 80),
  avatar_url text,
  bio text check (bio is null or char_length(bio) <= 500),
  date_of_birth date not null check (date_of_birth <= current_date - interval '18 years'),
  identity_verification_status public.verification_status not null default 'unverified',
  age_verification_status public.verification_status not null default 'unverified',
  terms_accepted_at timestamptz not null,
  privacy_accepted_at timestamptz not null,
  adult_confirmation_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.user_role not null default 'guest',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
create index user_roles_user_id_idx on public.user_roles(user_id);

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 140),
  slug text not null unique,
  description text,
  space_type text not null,
  status public.space_status not null default 'draft',
  city text not null,
  state text not null,
  country text not null default 'Mexico',
  latitude numeric(10,7),
  longitude numeric(10,7),
  approximate_location text,
  exact_address text,
  max_guests integer not null default 2 check (max_guests > 0),
  hourly_price numeric(12,2) check (hourly_price is null or hourly_price >= 0),
  overnight_price numeric(12,2) check (overnight_price is null or overnight_price >= 0),
  full_day_price numeric(12,2) check (full_day_price is null or full_day_price >= 0),
  cleaning_fee numeric(12,2) not null default 0 check (cleaning_fee >= 0),
  minimum_hours integer not null default 1 check (minimum_hours > 0),
  privacy_score numeric(3,1) check (privacy_score between 0 and 10),
  instant_booking boolean not null default false,
  creator_friendly boolean not null default false,
  group_friendly boolean not null default false,
  events_allowed boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index spaces_host_id_idx on public.spaces(host_id);
create index spaces_status_published_idx on public.spaces(status, published_at desc);
create index spaces_city_idx on public.spaces(city);

create table public.space_photos (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  unique (space_id, storage_path)
);
create index space_photos_space_id_idx on public.space_photos(space_id, sort_order);

create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  category text not null
);

create table public.space_amenities (
  space_id uuid not null references public.spaces(id) on delete cascade,
  amenity_id uuid not null references public.amenities(id) on delete cascade,
  primary key (space_id, amenity_id)
);
create index space_amenities_amenity_id_idx on public.space_amenities(amenity_id);

create table public.allowed_uses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table public.space_allowed_uses (
  space_id uuid not null references public.spaces(id) on delete cascade,
  allowed_use_id uuid not null references public.allowed_uses(id) on delete cascade,
  allowed boolean not null default false,
  details text,
  primary key (space_id, allowed_use_id)
);
create index space_allowed_uses_allowed_use_id_idx on public.space_allowed_uses(allowed_use_id);

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  status public.availability_status not null default 'available',
  created_at timestamptz not null default now(),
  check (start_time <> end_time),
  unique (space_id, date, start_time, end_time)
);
create index availability_space_date_idx on public.availability(space_id, date, start_time);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references auth.users(id) on delete restrict,
  space_id uuid not null references public.spaces(id) on delete restrict,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  guest_count integer not null check (guest_count > 0),
  status public.booking_status not null default 'draft',
  base_amount numeric(12,2) not null default 0 check (base_amount >= 0),
  cleaning_fee numeric(12,2) not null default 0 check (cleaning_fee >= 0),
  service_fee numeric(12,2) not null default 0 check (service_fee >= 0),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  currency char(3) not null default 'MXN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_datetime > start_datetime)
);
create index bookings_guest_id_idx on public.bookings(guest_id, start_datetime desc);
create index bookings_space_id_idx on public.bookings(space_id, start_datetime desc);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, space_id)
);
create index favorites_space_id_idx on public.favorites(space_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  author_id uuid not null references auth.users(id) on delete restrict,
  space_id uuid not null references public.spaces(id) on delete cascade,
  overall_rating smallint not null check (overall_rating between 1 and 5),
  cleanliness_rating smallint check (cleanliness_rating between 1 and 5),
  privacy_rating smallint check (privacy_rating between 1 and 5),
  accuracy_rating smallint check (accuracy_rating between 1 and 5),
  host_rating smallint check (host_rating between 1 and 5),
  discretion_rating smallint check (discretion_rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 3000),
  created_at timestamptz not null default now(),
  unique (booking_id, author_id)
);
create index reviews_space_id_idx on public.reviews(space_id, created_at desc);
create index reviews_author_id_idx on public.reviews(author_id);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references public.spaces(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_participants_user_id_idx on public.conversation_participants(user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index messages_sender_id_idx on public.messages(sender_id);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  city text not null,
  state text not null,
  country text not null default 'Mexico',
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  max_guests integer not null default 2 check (max_guests > 0),
  price numeric(12,2) check (price is null or price >= 0),
  currency char(3) not null default 'MXN',
  status public.listing_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index experiences_host_id_idx on public.experiences(host_id);
create index experiences_status_idx on public.experiences(status);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  city text not null,
  state text not null,
  country text not null default 'Mexico',
  venue_name text,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  capacity integer not null check (capacity > 0),
  ticket_price numeric(12,2) check (ticket_price is null or ticket_price >= 0),
  currency char(3) not null default 'MXN',
  visibility public.event_visibility not null default 'public',
  status public.listing_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time <> end_time)
);
create index events_organizer_id_idx on public.events(organizer_id);
create index events_status_date_idx on public.events(status, event_date);

create table public.event_tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.ticket_status not null default 'valid',
  ticket_code text not null unique default encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create index event_tickets_user_id_idx on public.event_tickets(user_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('booking_requested','booking_approved','booking_declined','booking_cancelled','booking_confirmed','new_message','new_review','event_reminder','listing_approved','listing_rejected','verification_required')),
  title text not null,
  body text not null,
  read_at timestamptz,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications(user_id, read_at, created_at desc);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete restrict,
  target_type text not null check (target_type in ('profile','space','experience','event','message','review')),
  target_id uuid not null,
  reason text not null,
  description text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reports_reporter_id_idx on public.reports(reporter_id);
create index reports_status_idx on public.reports(status, created_at);

create function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'admin') $$;

create function private.is_host()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'host') $$;

create function private.owns_space(space_uuid uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.spaces where id = space_uuid and host_id = (select auth.uid())) $$;

create function private.owns_event(event_uuid uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.events where id = event_uuid and organizer_id = (select auth.uid())) $$;

create function private.is_conversation_participant(conversation_uuid uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.conversation_participants where conversation_id = conversation_uuid and user_id = (select auth.uid())) $$;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_host() to authenticated;
grant execute on function private.owns_space(uuid) to authenticated;
grant execute on function private.owns_event(uuid) to authenticated;
grant execute on function private.is_conversation_participant(uuid) to authenticated;

create function public.request_host_role()
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  insert into public.user_roles(user_id, role) values ((select auth.uid()), 'host') on conflict do nothing;
end;
$$;
revoke all on function public.request_host_role() from public;
grant execute on function public.request_host_role() to authenticated;

create function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger spaces_updated_at before update on public.spaces for each row execute function private.set_updated_at();
create trigger bookings_updated_at before update on public.bookings for each row execute function private.set_updated_at();
create trigger conversations_updated_at before update on public.conversations for each row execute function private.set_updated_at();
create trigger experiences_updated_at before update on public.experiences for each row execute function private.set_updated_at();
create trigger events_updated_at before update on public.events for each row execute function private.set_updated_at();
create trigger reports_updated_at before update on public.reports for each row execute function private.set_updated_at();

create function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (
    id, first_name, last_name, display_name, date_of_birth,
    terms_accepted_at, privacy_accepted_at, adult_confirmation_at
  ) values (
    new.id,
    trim(new.raw_user_meta_data ->> 'first_name'),
    trim(new.raw_user_meta_data ->> 'last_name'),
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    (new.raw_user_meta_data ->> 'date_of_birth')::date,
    (new.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz,
    (new.raw_user_meta_data ->> 'privacy_accepted_at')::timestamptz,
    (new.raw_user_meta_data ->> 'adult_confirmation_at')::timestamptz
  );
  insert into public.user_roles(user_id, role) values (new.id, 'guest');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create view public.public_profiles with (security_barrier = true) as
select id, display_name, avatar_url, bio, created_at from public.profiles;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_photos enable row level security;
alter table public.amenities enable row level security;
alter table public.space_amenities enable row level security;
alter table public.allowed_uses enable row level security;
alter table public.space_allowed_uses enable row level security;
alter table public.availability enable row level security;
alter table public.bookings enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.experiences enable row level security;
alter table public.events enable row level security;
alter table public.event_tickets enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.public_profiles, public.amenities, public.allowed_uses to anon, authenticated;
grant select (id, host_id, name, slug, description, space_type, status, city, state, country, latitude, longitude, approximate_location, max_guests, hourly_price, overnight_price, full_day_price, cleaning_fee, minimum_hours, privacy_score, instant_booking, creator_friendly, group_friendly, events_allowed, published_at, created_at, updated_at) on public.spaces to anon, authenticated;
grant select on public.space_photos, public.space_amenities, public.space_allowed_uses, public.availability, public.reviews, public.experiences, public.events to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.user_roles, public.space_photos, public.space_amenities, public.space_allowed_uses, public.availability, public.bookings, public.favorites, public.reviews, public.conversations, public.conversation_participants, public.messages, public.experiences, public.events, public.event_tickets, public.notifications, public.reports to authenticated;
grant insert, update, delete on public.spaces to authenticated;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id or private.is_admin());
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id or private.is_admin()) with check ((select auth.uid()) = id or private.is_admin());

create policy "roles_select_own" on public.user_roles for select to authenticated using ((select auth.uid()) = user_id or private.is_admin());
create policy "roles_admin_insert" on public.user_roles for insert to authenticated with check (private.is_admin());
create policy "roles_admin_update" on public.user_roles for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "roles_admin_delete" on public.user_roles for delete to authenticated using (private.is_admin());

create policy "spaces_public_or_owner_select" on public.spaces for select to anon, authenticated using (status = 'approved' or host_id = (select auth.uid()) or private.is_admin());
create policy "spaces_host_insert" on public.spaces for insert to authenticated with check (host_id = (select auth.uid()) and private.is_host());
create policy "spaces_host_update" on public.spaces for update to authenticated using (host_id = (select auth.uid()) or private.is_admin()) with check (host_id = (select auth.uid()) or private.is_admin());
create policy "spaces_host_delete" on public.spaces for delete to authenticated using ((host_id = (select auth.uid()) and status = 'draft') or private.is_admin());

create policy "space_photos_visible_space" on public.space_photos for select to anon, authenticated using (exists (select 1 from public.spaces s where s.id = space_id and (s.status = 'approved' or s.host_id = (select auth.uid()) or private.is_admin())));
create policy "space_photos_owner_insert" on public.space_photos for insert to authenticated with check (private.owns_space(space_id) or private.is_admin());
create policy "space_photos_owner_update" on public.space_photos for update to authenticated using (private.owns_space(space_id) or private.is_admin()) with check (private.owns_space(space_id) or private.is_admin());
create policy "space_photos_owner_delete" on public.space_photos for delete to authenticated using (private.owns_space(space_id) or private.is_admin());

create policy "amenities_public_select" on public.amenities for select to anon, authenticated using (true);
create policy "allowed_uses_public_select" on public.allowed_uses for select to anon, authenticated using (true);

create policy "space_amenities_visible" on public.space_amenities for select to anon, authenticated using (exists (select 1 from public.spaces s where s.id = space_id and (s.status = 'approved' or s.host_id = (select auth.uid()) or private.is_admin())));
create policy "space_amenities_owner_insert" on public.space_amenities for insert to authenticated with check (private.owns_space(space_id) or private.is_admin());
create policy "space_amenities_owner_delete" on public.space_amenities for delete to authenticated using (private.owns_space(space_id) or private.is_admin());

create policy "space_uses_visible" on public.space_allowed_uses for select to anon, authenticated using (exists (select 1 from public.spaces s where s.id = space_id and (s.status = 'approved' or s.host_id = (select auth.uid()) or private.is_admin())));
create policy "space_uses_owner_insert" on public.space_allowed_uses for insert to authenticated with check (private.owns_space(space_id) or private.is_admin());
create policy "space_uses_owner_update" on public.space_allowed_uses for update to authenticated using (private.owns_space(space_id) or private.is_admin()) with check (private.owns_space(space_id) or private.is_admin());
create policy "space_uses_owner_delete" on public.space_allowed_uses for delete to authenticated using (private.owns_space(space_id) or private.is_admin());

create policy "availability_visible" on public.availability for select to anon, authenticated using (exists (select 1 from public.spaces s where s.id = space_id and (s.status = 'approved' or s.host_id = (select auth.uid()) or private.is_admin())));
create policy "availability_owner_insert" on public.availability for insert to authenticated with check (private.owns_space(space_id) or private.is_admin());
create policy "availability_owner_update" on public.availability for update to authenticated using (private.owns_space(space_id) or private.is_admin()) with check (private.owns_space(space_id) or private.is_admin());
create policy "availability_owner_delete" on public.availability for delete to authenticated using (private.owns_space(space_id) or private.is_admin());

create policy "bookings_parties_select" on public.bookings for select to authenticated using (guest_id = (select auth.uid()) or private.owns_space(space_id) or private.is_admin());
create policy "bookings_guest_insert" on public.bookings for insert to authenticated with check (guest_id = (select auth.uid()) and exists (select 1 from public.spaces s where s.id = space_id and s.status = 'approved'));
create policy "bookings_parties_update" on public.bookings for update to authenticated using (guest_id = (select auth.uid()) or private.owns_space(space_id) or private.is_admin()) with check (guest_id = (select auth.uid()) or private.owns_space(space_id) or private.is_admin());

create policy "favorites_own_select" on public.favorites for select to authenticated using (user_id = (select auth.uid()));
create policy "favorites_own_insert" on public.favorites for insert to authenticated with check (user_id = (select auth.uid()));
create policy "favorites_own_delete" on public.favorites for delete to authenticated using (user_id = (select auth.uid()));

create policy "reviews_public_select" on public.reviews for select to anon, authenticated using (true);
create policy "reviews_completed_booking_insert" on public.reviews for insert to authenticated with check (author_id = (select auth.uid()) and exists (select 1 from public.bookings b where b.id = booking_id and b.guest_id = (select auth.uid()) and b.space_id = space_id and b.status = 'completed'));
create policy "reviews_author_delete" on public.reviews for delete to authenticated using (author_id = (select auth.uid()) or private.is_admin());

create policy "conversations_participant_select" on public.conversations for select to authenticated using (private.is_conversation_participant(id) or private.is_admin());
create policy "conversation_participants_member_select" on public.conversation_participants for select to authenticated using (private.is_conversation_participant(conversation_id) or private.is_admin());
create policy "messages_participant_select" on public.messages for select to authenticated using (private.is_conversation_participant(conversation_id) or private.is_admin());
create policy "messages_participant_insert" on public.messages for insert to authenticated with check (sender_id = (select auth.uid()) and private.is_conversation_participant(conversation_id));
create policy "messages_sender_update" on public.messages for update to authenticated using (sender_id = (select auth.uid())) with check (sender_id = (select auth.uid()));

create policy "experiences_public_or_owner_select" on public.experiences for select to anon, authenticated using (status = 'approved' or host_id = (select auth.uid()) or private.is_admin());
create policy "experiences_host_insert" on public.experiences for insert to authenticated with check (host_id = (select auth.uid()) and private.is_host());
create policy "experiences_host_update" on public.experiences for update to authenticated using (host_id = (select auth.uid()) or private.is_admin()) with check (host_id = (select auth.uid()) or private.is_admin());
create policy "experiences_host_delete" on public.experiences for delete to authenticated using ((host_id = (select auth.uid()) and status = 'draft') or private.is_admin());

create policy "events_public_or_owner_select" on public.events for select to anon, authenticated using (status = 'approved' or organizer_id = (select auth.uid()) or private.is_admin());
create policy "events_host_insert" on public.events for insert to authenticated with check (organizer_id = (select auth.uid()) and private.is_host());
create policy "events_host_update" on public.events for update to authenticated using (organizer_id = (select auth.uid()) or private.is_admin()) with check (organizer_id = (select auth.uid()) or private.is_admin());
create policy "events_host_delete" on public.events for delete to authenticated using ((organizer_id = (select auth.uid()) and status = 'draft') or private.is_admin());

create policy "tickets_owner_or_organizer_select" on public.event_tickets for select to authenticated using (user_id = (select auth.uid()) or private.owns_event(event_id) or private.is_admin());
create policy "tickets_owner_insert" on public.event_tickets for insert to authenticated with check (user_id = (select auth.uid()) and exists (select 1 from public.events e where e.id = event_id and e.status = 'approved'));
create policy "tickets_organizer_update" on public.event_tickets for update to authenticated using (private.owns_event(event_id) or private.is_admin()) with check (private.owns_event(event_id) or private.is_admin());

create policy "notifications_own_select" on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications_own_update" on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "notifications_own_delete" on public.notifications for delete to authenticated using (user_id = (select auth.uid()));

create policy "reports_own_select" on public.reports for select to authenticated using (reporter_id = (select auth.uid()) or private.is_admin());
create policy "reports_own_insert" on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "reports_admin_update" on public.reports for update to authenticated using (private.is_admin()) with check (private.is_admin());
