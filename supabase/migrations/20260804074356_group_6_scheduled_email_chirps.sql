-- Little Birdee Group 6: daily email chirps.
-- Preferences belong to one operator and one venue. Delivery rows provide the
-- durable idempotency boundary for the scheduler and the Resend webhook.

create table public.chirp_preferences (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  venue_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  enabled boolean not null default false,
  delivery_time_local time not null default '07:00',
  time_zone text not null default 'Australia/Sydney',
  prompt_dismissed_at timestamptz,
  unsubscribe_token_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (venue_id, business_id)
    references public.venues (id, business_id) on delete cascade,
  unique (user_id, venue_id),
  constraint chirp_preferences_unsubscribe_version
    check (unsubscribe_token_version > 0),
  constraint chirp_preferences_time_zone_length
    check (char_length(btrim(time_zone)) between 1 and 80)
);

create table public.chirp_deliveries (
  id uuid primary key default gen_random_uuid(),
  preference_id uuid not null references public.chirp_preferences (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  venue_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  service_date date not null,
  scheduled_for timestamptz not null,
  kind text not null default 'pending',
  status text not null default 'pending',
  attempt_count integer not null default 0,
  next_attempt_at timestamptz,
  claimed_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  provider_message_id text,
  content_version text,
  content_digest text,
  last_error_code text,
  last_error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (venue_id, business_id)
    references public.venues (id, business_id) on delete cascade,
  unique (preference_id, service_date),
  unique (provider_message_id),
  constraint chirp_deliveries_kind
    check (kind in ('pending', 'revenue_needed', 'estimated_result', 'setup_needed')),
  constraint chirp_deliveries_status
    check (status in (
      'pending', 'claimed', 'sent', 'delivered', 'retryable', 'failed',
      'bounced', 'complained', 'suppressed', 'skipped'
    )),
  constraint chirp_deliveries_attempt_count
    check (attempt_count >= 0)
);

create table public.chirp_delivery_events (
  id bigint generated always as identity primary key,
  delivery_id uuid references public.chirp_deliveries (id) on delete cascade,
  provider_event_id text not null unique,
  provider_message_id text,
  event_type text not null,
  occurred_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint chirp_delivery_events_payload_object
    check (jsonb_typeof(payload) = 'object'),
  constraint chirp_delivery_events_event_type_length
    check (char_length(btrim(event_type)) between 1 and 80)
);

create index chirp_preferences_business_id_idx
  on public.chirp_preferences (business_id);
create index chirp_preferences_venue_id_idx
  on public.chirp_preferences (venue_id);
create index chirp_preferences_due_idx
  on public.chirp_preferences (enabled, delivery_time_local)
  where enabled = true;
create index chirp_deliveries_claim_idx
  on public.chirp_deliveries (status, next_attempt_at, scheduled_for);
create index chirp_deliveries_user_id_idx
  on public.chirp_deliveries (user_id, created_at desc);
create index chirp_deliveries_venue_date_idx
  on public.chirp_deliveries (venue_id, service_date desc);
create index chirp_delivery_events_delivery_id_idx
  on public.chirp_delivery_events (delivery_id, occurred_at desc);
create index chirp_delivery_events_provider_message_id_idx
  on public.chirp_delivery_events (provider_message_id);

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

create trigger chirp_preferences_validate
before insert or update on public.chirp_preferences
for each row execute function private.validate_chirp_preference();

create trigger chirp_preferences_touch_updated_at
before update on public.chirp_preferences
for each row execute function private.touch_updated_at();

create trigger chirp_deliveries_touch_updated_at
before update on public.chirp_deliveries
for each row execute function private.touch_updated_at();

alter table public.chirp_preferences enable row level security;
alter table public.chirp_deliveries enable row level security;
alter table public.chirp_delivery_events enable row level security;

create policy chirp_preferences_select_own
on public.chirp_preferences
for select to authenticated
using (
  user_id = (select auth.uid())
  and (select private.can_access_venue(venue_id))
);

create policy chirp_preferences_insert_own
on public.chirp_preferences
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select private.can_access_venue(venue_id))
  and exists (
    select 1
    from public.venues as venue
    where venue.id = chirp_preferences.venue_id
      and venue.business_id = chirp_preferences.business_id
      and venue.time_zone = chirp_preferences.time_zone
      and venue.is_active = true
  )
);

create policy chirp_preferences_update_own
on public.chirp_preferences
for update to authenticated
using (
  user_id = (select auth.uid())
  and (select private.can_access_venue(venue_id))
)
with check (
  user_id = (select auth.uid())
  and (select private.can_access_venue(venue_id))
  and exists (
    select 1
    from public.venues as venue
    where venue.id = chirp_preferences.venue_id
      and venue.business_id = chirp_preferences.business_id
      and venue.time_zone = chirp_preferences.time_zone
      and venue.is_active = true
  )
);

create policy chirp_preferences_delete_own
on public.chirp_preferences
for delete to authenticated
using (
  user_id = (select auth.uid())
  and (select private.can_access_venue(venue_id))
);

create policy chirp_deliveries_select_own
on public.chirp_deliveries
for select to authenticated
using (
  user_id = (select auth.uid())
  and (select private.can_access_venue(venue_id))
);

-- Inserts all preferences whose local delivery time has just passed, then
-- atomically claims a bounded set. A unique preference/date key prevents a
-- duplicate email even when two scheduler requests overlap.
create or replace function public.claim_due_chirp_deliveries(
  p_now timestamptz default now(),
  p_limit integer default 25
)
returns table (
  delivery_id uuid,
  preference_id uuid,
  business_id uuid,
  venue_id uuid,
  user_id uuid,
  service_date date,
  scheduled_for timestamptz,
  attempt_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception 'p_limit must be between 1 and 100';
  end if;

  insert into public.chirp_deliveries (
    preference_id,
    business_id,
    venue_id,
    user_id,
    service_date,
    scheduled_for
  )
  select
    preference.id,
    preference.business_id,
    preference.venue_id,
    preference.user_id,
    (p_now at time zone preference.time_zone)::date - 1,
    (
      (p_now at time zone preference.time_zone)::date
      + preference.delivery_time_local
    ) at time zone preference.time_zone
  from public.chirp_preferences as preference
  join public.venues as venue
    on venue.id = preference.venue_id
    and venue.business_id = preference.business_id
    and venue.is_active = true
  where preference.enabled = true
    and (select private.has_product_access(preference.business_id))
    and (
      exists (
        select 1
        from public.business_members as business_member
        where business_member.business_id = preference.business_id
          and business_member.user_id = preference.user_id
      )
      or exists (
        select 1
        from public.venue_members as venue_member
        where venue_member.venue_id = preference.venue_id
          and venue_member.user_id = preference.user_id
      )
    )
    and (
      (
        (p_now at time zone preference.time_zone)::date
        + preference.delivery_time_local
      ) at time zone preference.time_zone
    ) <= p_now
    and (
      (
        (p_now at time zone preference.time_zone)::date
        + preference.delivery_time_local
      ) at time zone preference.time_zone
    ) > p_now - interval '15 minutes'
  on conflict on constraint chirp_deliveries_preference_id_service_date_key do nothing;

  return query
  with candidates as (
    select delivery.id
    from public.chirp_deliveries as delivery
    join public.chirp_preferences as preference
      on preference.id = delivery.preference_id
      and preference.enabled = true
    join public.venues as venue
      on venue.id = delivery.venue_id
      and venue.is_active = true
    where (
        delivery.status in ('pending', 'retryable')
        or (
          delivery.status = 'claimed'
          and delivery.claimed_at < p_now - interval '15 minutes'
        )
      )
      and coalesce(delivery.next_attempt_at, delivery.scheduled_for) <= p_now
      and delivery.attempt_count < 5
      and (select private.has_product_access(delivery.business_id))
    order by coalesce(delivery.next_attempt_at, delivery.scheduled_for), delivery.created_at
    for update of delivery skip locked
    limit p_limit
  )
  update public.chirp_deliveries as delivery
  set
    status = 'claimed',
    claimed_at = p_now,
    attempt_count = delivery.attempt_count + 1,
    next_attempt_at = null,
    last_error_code = null,
    last_error_message = null
  from candidates
  where delivery.id = candidates.id
  returning
    delivery.id,
    delivery.preference_id,
    delivery.business_id,
    delivery.venue_id,
    delivery.user_id,
    delivery.service_date,
    delivery.scheduled_for,
    delivery.attempt_count;
end;
$$;

revoke all on table public.chirp_preferences
from public, anon, authenticated, service_role;
revoke all on table public.chirp_deliveries
from public, anon, authenticated, service_role;
revoke all on table public.chirp_delivery_events
from public, anon, authenticated, service_role;

grant select, insert, update, delete on table public.chirp_preferences to authenticated;
grant select on table public.chirp_deliveries to authenticated;
grant all on table public.chirp_preferences to service_role;
grant all on table public.chirp_deliveries to service_role;
grant all on table public.chirp_delivery_events to service_role;
grant usage, select on sequence public.chirp_delivery_events_id_seq to service_role;

revoke all on function private.validate_chirp_preference()
from public, anon, authenticated, service_role;
revoke all on function public.claim_due_chirp_deliveries(timestamptz, integer)
from public, anon, authenticated, service_role;
grant execute on function public.claim_due_chirp_deliveries(timestamptz, integer)
to service_role;
