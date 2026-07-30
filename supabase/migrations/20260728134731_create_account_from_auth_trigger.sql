-- Create first-account ownership inside the Auth signup transaction. The
-- privileged function is private and trigger-only; no privileged RPC remains
-- callable through the Data API.

create or replace function private.handle_new_user_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_business_id uuid;
  new_venue_id uuid;
  business_label text := left(
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'business_name'), ''), 'My business'),
    160
  );
  venue_label text := left(
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'venue_name'), ''), 'My first venue'),
    160
  );
  display_label text := left(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    120
  );
begin
  insert into public.profiles (id, display_name)
  values (new.id, display_label);

  insert into public.businesses (trading_name, owner_user_id)
  values (business_label, new.id)
  returning id into new_business_id;

  insert into public.business_members (business_id, user_id, role, invited_by)
  values (new_business_id, new.id, 'owner', new.id);

  insert into public.venues (business_id, name, time_zone, created_by)
  values (new_business_id, venue_label, 'Australia/Sydney', new.id)
  returning id into new_venue_id;

  insert into public.venue_members (business_id, venue_id, user_id, role, granted_by)
  values (new_business_id, new_venue_id, new.id, 'manager', new.id);

  insert into public.venue_settings (venue_id, business_id, updated_by)
  values (new_venue_id, new_business_id, new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_little_birdee on auth.users;
create trigger on_auth_user_created_little_birdee
after insert on auth.users
for each row execute function private.handle_new_user_account();

alter function public.bootstrap_account(text, text, text, text)
security invoker;

revoke all on function public.bootstrap_account(text, text, text, text)
from public, anon, authenticated, service_role;
