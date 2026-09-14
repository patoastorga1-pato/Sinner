-- Fix host listing writes that call private.normalize_mexico_location through the location trigger.
-- The trigger must run as its owner so authenticated hosts do not need direct execute permission
-- on private normalization helpers.

begin;

create or replace function private.set_space_location_search()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.location_search_text := private.normalize_mexico_location(
    coalesce(new.locality, '') || ' ' ||
    coalesce(new.city, '') || ' ' ||
    coalesce(new.municipality, '') || ' ' ||
    coalesce(new.state, '') || ' ' ||
    coalesce(new.state_code, '') || ' ' ||
    coalesce(new.country, '') || ' ' ||
    coalesce(new.country_code, '') || ' ' ||
    coalesce(new.approximate_location, '')
  );

  return new;
end;
$$;

revoke all on function private.set_space_location_search() from public, anon, authenticated;
revoke all on function private.normalize_mexico_location(text) from public, anon, authenticated;

notify pgrst, 'reload schema';

commit;
