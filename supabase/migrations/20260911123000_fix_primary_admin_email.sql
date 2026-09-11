-- Correct primary admin email for SINNER.

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

insert into public.user_roles(user_id, role)
select u.id, 'admin'
from auth.users u
where lower(coalesce(u.email, '')) = 'sinner.adults@gmail.com'
on conflict (user_id, role) do nothing;

delete from public.user_roles ur
using auth.users u
where ur.user_id = u.id
  and ur.role = 'admin'
  and lower(coalesce(u.email, '')) = 'sinner.adult@gmail.com';
