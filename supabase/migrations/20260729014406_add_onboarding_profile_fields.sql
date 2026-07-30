-- Persist the business context collected after authentication. OAuth users
-- begin with trigger-created placeholder records, then complete these fields
-- through the same onboarding flow as email/password users.

alter table public.profiles
  add column onboarding_completed_at timestamptz;

alter table public.businesses
  add column industry text;

alter table public.businesses
  add constraint businesses_industry_length
  check (
    industry is null
    or char_length(btrim(industry)) between 1 and 80
  );

create or replace function public.complete_onboarding(
  p_business_id uuid,
  p_venue_id uuid,
  p_display_name text,
  p_business_name text,
  p_venue_name text,
  p_industry text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  affected_rows integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  if char_length(btrim(p_display_name)) not between 1 and 120 then
    raise exception 'Your name must be between 1 and 120 characters';
  end if;

  if char_length(btrim(p_business_name)) not between 1 and 160 then
    raise exception 'Business name must be between 1 and 160 characters';
  end if;

  if char_length(btrim(p_venue_name)) not between 1 and 160 then
    raise exception 'Venue name must be between 1 and 160 characters';
  end if;

  if char_length(btrim(p_industry)) not between 1 and 80 then
    raise exception 'Industry must be between 1 and 80 characters';
  end if;

  update public.businesses
  set
    trading_name = btrim(p_business_name),
    industry = btrim(p_industry)
  where id = p_business_id;

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Business is not available to this account';
  end if;

  update public.venues
  set name = btrim(p_venue_name)
  where id = p_venue_id
    and business_id = p_business_id;

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Venue is not available to this account';
  end if;

  update public.profiles
  set
    display_name = btrim(p_display_name),
    onboarding_completed_at = coalesce(onboarding_completed_at, now())
  where id = (select auth.uid());

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Profile is not available to this account';
  end if;
end;
$$;

revoke all on function public.complete_onboarding(
  uuid,
  uuid,
  text,
  text,
  text,
  text
) from public, anon;

grant execute on function public.complete_onboarding(
  uuid,
  uuid,
  text,
  text,
  text,
  text
) to authenticated;
