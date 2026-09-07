# SINNER

SINNER is an adults-only marketplace foundation for booking private spaces, experiences and authorized adult events. It does not sell sexual services or connect users with sexual service providers.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Add the Supabase project URL and publishable key.
4. Run `npm run dev -- --port 3000`.

Without Supabase credentials, public pages remain available with development data. During local development, marketplace reads also fall back to the same fixtures when the linked project has not received the migrations yet. Production fails closed instead of showing fixture inventory.

Set `SINNER_USE_DEVELOPMENT_FIXTURES=true` locally while the remote project has no Phase 2 schema. Change it to `false` after applying the migrations and seed to exercise live Supabase reads and availability checks.

## Supabase setup

1. Create a Supabase project.
2. Link it with the Supabase CLI: `supabase link --project-ref <project-ref>`.
3. Apply both migrations in order with `supabase db push`:

```text
supabase/migrations/20260907130000_core_foundation.sql
supabase/migrations/20260907170000_spaces_marketplace.sql
```

4. Run `supabase/seed.sql` in local development or with the SQL editor when demo records are wanted.
5. In Authentication > URL Configuration, set the production Site URL and add `<site-url>/auth/callback` to Redirect URLs.
6. Keep email confirmation enabled for production.

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SINNER_SERVICE_FEE_PERCENT=11
```

Do not place a service role key in a `NEXT_PUBLIC_` variable. This phase does not require one.

The marketplace RPC exposes approved listings only. Direct client grants exclude `exact_address`, `latitude` and `longitude`; raw availability intervals are visible only to the owning host or an admin. Public availability checks return a boolean through `check_space_availability`.

## Space photos

The data layer accepts either a complete HTTPS URL or a path in the public Supabase Storage bucket `space-photos`. Seed records use external demo images so the project works before a bucket is provisioned. For production, create the bucket, upload host-approved media and store only object paths such as `<space-id>/cover.webp` in `space_photos.storage_path`.

## Roles

Every signup receives the `guest` role through a database trigger. A guest can activate the additional `host` role through `/host/onboarding`. Admin access must be granted manually by a trusted database administrator:

```sql
insert into public.user_roles (user_id, role)
values ('USER_UUID', 'admin')
on conflict do nothing;
```

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

Payments, payouts, an external identity provider, confirmed booking writes, full messaging, listing creation and full moderation are intentionally deferred. Phase 2 provides availability validation and a checkout preview without writing bookings or payment records.
