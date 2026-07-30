-- Owners/admins can add a venue without coupling it to any integration.

create or replace function public.create_venue(
  p_business_id uuid,
  p_name text,
  p_time_zone text default 'Australia/Sydney'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_venue_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(btrim(p_name)) not between 1 and 160 then
    raise exception 'Venue name is required';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_timezone_names
    where name = p_time_zone
  ) then
    raise exception 'Unknown venue time zone';
  end if;

  insert into public.venues (business_id, name, time_zone, created_by)
  values (p_business_id, btrim(p_name), p_time_zone, current_user_id)
  returning id into new_venue_id;

  insert into public.venue_members (
    business_id, venue_id, user_id, role, granted_by
  )
  values (
    p_business_id, new_venue_id, current_user_id, 'manager', current_user_id
  );

  insert into public.venue_settings (
    venue_id, business_id, updated_by
  )
  values (
    new_venue_id, p_business_id, current_user_id
  );

  return new_venue_id;
end;
$$;

revoke execute on function public.create_venue(uuid, text, text)
from public, anon;
grant execute on function public.create_venue(uuid, text, text)
to authenticated, service_role;
