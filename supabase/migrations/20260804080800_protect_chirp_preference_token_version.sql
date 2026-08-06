create or replace function private.validate_chirp_preference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_timezone_names
    where name = new.time_zone
  ) then
    raise exception 'Unknown IANA time zone: %', new.time_zone;
  end if;

  if tg_op = 'UPDATE' and (
    new.id <> old.id
    or new.business_id <> old.business_id
    or new.venue_id <> old.venue_id
    or new.user_id <> old.user_id
  ) then
    raise exception 'A chirp preference cannot be moved to another account or venue';
  end if;

  if tg_op = 'UPDATE'
    and new.unsubscribe_token_version <> old.unsubscribe_token_version
    and coalesce((select auth.role()), '') <> 'service_role'
    and session_user <> 'postgres' then
    raise exception 'Only the email service can rotate an unsubscribe token';
  end if;

  if new.user_id <> (select auth.uid()) and (select auth.role()) <> 'service_role' then
    raise exception 'A chirp preference can only be saved for the signed-in operator';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_chirp_preference()
from public, anon, authenticated, service_role;
