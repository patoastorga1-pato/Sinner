-- SINNER Phase 3, Step 1.
-- Run this first in Supabase SQL Editor, then run SINNER_PHASE_3_BOOKING_ENGINE.sql.

do $$
begin
  alter type public.booking_status add value if not exists 'expired' after 'cancelled';
exception
  when duplicate_object then null;
end;
$$;
