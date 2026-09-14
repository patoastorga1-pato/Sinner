-- SINNER fix: publication review workflow protections.
-- Copy/paste this complete SQL into Supabase SQL Editor.

begin;

create or replace function private.guard_space_host_review_workflow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  if private.is_admin() then
    return new;
  end if;

  if old.host_id is distinct from (select auth.uid()) then
    raise exception 'space_not_owned';
  end if;

  if old.status = 'suspended'::public.space_status then
    raise exception 'suspended_listing_requires_admin';
  end if;

  if new.status in ('approved'::public.space_status, 'rejected'::public.space_status, 'suspended'::public.space_status) then
    raise exception 'admin_required_for_listing_status';
  end if;

  if old.status = 'approved'::public.space_status and new.status <> 'pending_review'::public.space_status then
    raise exception 'approved_listing_changes_require_review';
  end if;

  if old.status in ('draft'::public.space_status, 'pending_review'::public.space_status, 'rejected'::public.space_status)
     and new.status not in ('draft'::public.space_status, 'pending_review'::public.space_status) then
    raise exception 'invalid_host_listing_status_transition';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_space_host_review_workflow on public.spaces;
create trigger guard_space_host_review_workflow
before update on public.spaces
for each row
when (old.status is distinct from new.status or old.host_id is not null)
execute function private.guard_space_host_review_workflow();

revoke all on function private.guard_space_host_review_workflow() from public, anon, authenticated;

notify pgrst, 'reload schema';

commit;
