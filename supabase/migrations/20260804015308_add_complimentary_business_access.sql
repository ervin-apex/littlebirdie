-- Complimentary access is a business-level entitlement alongside Stripe.
-- Permanent grants are intended for Scott; beta grants last one calendar month
-- and keep operational data for a further 30-day conversion window.

create table public.business_access_grants (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  grant_type text not null,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  retention_until timestamptz,
  reason text not null,
  granted_by text not null,
  revoked_at timestamptz,
  revoked_by text,
  revocation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_access_grants_type check (
    grant_type in ('permanent', 'beta')
  ),
  constraint business_access_grants_period check (
    (
      grant_type = 'permanent'
      and expires_at is null
      and retention_until is null
    )
    or (
      grant_type = 'beta'
      and expires_at is not null
      and expires_at > starts_at
      and retention_until is not null
      and retention_until > expires_at
    )
  ),
  constraint business_access_grants_reason check (
    char_length(btrim(reason)) between 1 and 240
  ),
  constraint business_access_grants_granted_by check (
    char_length(btrim(granted_by)) between 1 and 160
  ),
  constraint business_access_grants_revocation check (
    (revoked_at is null and revoked_by is null and revocation_reason is null)
    or (
      revoked_at is not null
      and revoked_by is not null
      and revocation_reason is not null
      and char_length(btrim(revoked_by)) between 1 and 160
      and char_length(btrim(revocation_reason)) between 1 and 240
    )
  )
);

create unique index business_access_grants_one_current_idx
  on public.business_access_grants (business_id)
  where revoked_at is null;

create index business_access_grants_business_timeline_idx
  on public.business_access_grants (business_id, created_at desc);

create index business_access_grants_expiry_idx
  on public.business_access_grants (retention_until)
  where grant_type = 'beta' and revoked_at is null;

create trigger business_access_grants_touch_updated_at
before update on public.business_access_grants
for each row execute function private.touch_updated_at();

alter table public.business_access_grants enable row level security;

create policy business_access_grants_select_member
on public.business_access_grants for select
to authenticated
using ((select private.can_access_business(business_id)));

revoke all privileges on public.business_access_grants from public, anon, authenticated;
grant select on public.business_access_grants to authenticated;
grant all on public.business_access_grants to service_role;

create or replace function private.has_active_complimentary_access(
  target_business_id uuid,
  at_time timestamptz default now()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_access_grants as access_grant
    where access_grant.business_id = target_business_id
      and access_grant.revoked_at is null
      and access_grant.starts_at <= at_time
      and (
        access_grant.grant_type = 'permanent'
        or access_grant.expires_at > at_time
      )
  );
$$;

create or replace function private.complimentary_retention_open(
  target_business_id uuid,
  at_time timestamptz default now()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_access_grants as access_grant
    where access_grant.business_id = target_business_id
      and access_grant.grant_type = 'beta'
      and access_grant.expires_at <= at_time
      and access_grant.retention_until > at_time
  );
$$;

create or replace function private.has_product_access(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.business_subscriptions as subscription
      where subscription.business_id = target_business_id
        and subscription.data_state = 'present'
        and subscription.paid_through > now()
        and subscription.status in ('active', 'trialing', 'past_due', 'canceled')
    )
    or (
      exists (
        select 1
        from public.business_subscriptions as subscription
        where subscription.business_id = target_business_id
          and subscription.data_state = 'present'
      )
      and (select private.has_active_complimentary_access(target_business_id))
    );
$$;

create or replace function public.grant_business_complimentary_access(
  p_business_id uuid,
  p_grant_type text,
  p_reason text,
  p_granted_by text
)
returns public.business_access_grants
language plpgsql
security definer
set search_path = ''
as $$
declare
  granted public.business_access_grants%rowtype;
  grant_start timestamptz := now();
begin
  if p_grant_type not in ('permanent', 'beta') then
    raise exception 'Complimentary grant type must be permanent or beta';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception 'A grant reason is required';
  end if;
  if nullif(btrim(p_granted_by), '') is null then
    raise exception 'The granting operator is required';
  end if;
  if not exists (select 1 from public.businesses where id = p_business_id) then
    raise exception 'Business not found';
  end if;

  update public.business_access_grants
  set
    revoked_at = grant_start,
    revoked_by = left(btrim(p_granted_by), 160),
    revocation_reason = 'Superseded by a new complimentary access grant'
  where business_id = p_business_id
    and revoked_at is null;

  insert into public.business_subscriptions (business_id, data_state)
  values (p_business_id, 'present')
  on conflict (business_id) do update
  set data_state = 'present';

  insert into public.business_access_grants (
    business_id,
    grant_type,
    starts_at,
    expires_at,
    retention_until,
    reason,
    granted_by
  ) values (
    p_business_id,
    p_grant_type,
    grant_start,
    case when p_grant_type = 'beta' then grant_start + interval '1 month' else null end,
    case when p_grant_type = 'beta' then grant_start + interval '1 month 30 days' else null end,
    left(btrim(p_reason), 240),
    left(btrim(p_granted_by), 160)
  )
  returning * into granted;

  return granted;
end;
$$;

create or replace function public.revoke_business_complimentary_access(
  p_business_id uuid,
  p_reason text,
  p_revoked_by text
)
returns public.business_access_grants
language plpgsql
security definer
set search_path = ''
as $$
declare
  revoked public.business_access_grants%rowtype;
  revoked_time timestamptz := now();
begin
  if nullif(btrim(p_reason), '') is null then
    raise exception 'A revocation reason is required';
  end if;
  if nullif(btrim(p_revoked_by), '') is null then
    raise exception 'The revoking operator is required';
  end if;

  update public.business_access_grants
  set
    expires_at = case
      when grant_type = 'beta' then least(
        expires_at,
        greatest(starts_at + interval '1 second', revoked_time)
      )
      else expires_at
    end,
    retention_until = case
      when grant_type = 'beta' and expires_at > revoked_time
        then revoked_time + interval '30 days'
      else retention_until
    end,
    revoked_at = revoked_time,
    revoked_by = left(btrim(p_revoked_by), 160),
    revocation_reason = left(btrim(p_reason), 240)
  where business_id = p_business_id
    and revoked_at is null
  returning * into revoked;

  if not found then
    raise exception 'No current complimentary grant found';
  end if;

  return revoked;
end;
$$;

-- Deletion always rechecks every entitlement source. This prevents a terminal
-- Stripe event from deleting data protected by a complimentary grant or its
-- beta conversion window.
create or replace function public.delete_business_operational_data(
  p_business_id uuid,
  p_reason text,
  p_stripe_event_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  subscription public.business_subscriptions%rowtype;
begin
  select * into subscription
  from public.business_subscriptions
  where business_id = p_business_id
  for update;

  if not found then raise exception 'Billing record not found'; end if;
  if subscription.data_state = 'deleted' then return; end if;
  if (select private.has_product_access(p_business_id)) then
    raise exception 'Operational data cannot be deleted while product access is active';
  end if;
  if (select private.complimentary_retention_open(p_business_id)) then
    raise exception 'Operational data is inside the complimentary conversion window';
  end if;

  update public.business_subscriptions
  set data_state = 'deletion_pending'
  where business_id = p_business_id;

  perform set_config('little_birdee.operational_purge', 'on', true);

  delete from public.daily_actual_revisions where business_id = p_business_id;
  delete from public.weekly_plan_days where business_id = p_business_id;
  delete from public.weekly_plans where business_id = p_business_id;
  delete from public.financial_assumptions where business_id = p_business_id;
  delete from public.venue_setup_drafts where business_id = p_business_id;
  delete from public.venue_settings where business_id = p_business_id;
  delete from public.audit_events where business_id = p_business_id;

  insert into private.billing_deletion_receipts (
    business_id,
    stripe_customer_id,
    stripe_subscription_id,
    reason,
    stripe_event_id,
    policy_version
  ) values (
    p_business_id,
    subscription.stripe_customer_id,
    subscription.stripe_subscription_id,
    left(btrim(p_reason), 120),
    p_stripe_event_id,
    '2026-08-04-v2'
  );

  update public.business_subscriptions
  set data_state = 'deleted'
  where business_id = p_business_id;
end;
$$;

create or replace function public.delete_expired_complimentary_business_data()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate record;
  deleted_count integer := 0;
begin
  for candidate in
    select distinct access_grant.business_id
    from public.business_access_grants as access_grant
    join public.business_subscriptions as subscription
      on subscription.business_id = access_grant.business_id
    where access_grant.grant_type = 'beta'
      and access_grant.retention_until <= now()
      and subscription.data_state = 'present'
      and not (select private.has_product_access(access_grant.business_id))
      and not (select private.complimentary_retention_open(access_grant.business_id))
  loop
    perform public.delete_business_operational_data(
      candidate.business_id,
      'complimentary_beta_conversion_expired',
      null
    );
    deleted_count := deleted_count + 1;
  end loop;

  return deleted_count;
end;
$$;

revoke all on function private.has_active_complimentary_access(uuid, timestamptz)
from public, anon, authenticated, service_role;
revoke all on function private.complimentary_retention_open(uuid, timestamptz)
from public, anon, authenticated, service_role;
revoke all on function public.grant_business_complimentary_access(uuid, text, text, text)
from public, anon, authenticated, service_role;
revoke all on function public.revoke_business_complimentary_access(uuid, text, text)
from public, anon, authenticated, service_role;
revoke all on function public.delete_expired_complimentary_business_data()
from public, anon, authenticated, service_role;

grant execute on function private.has_active_complimentary_access(uuid, timestamptz)
to authenticated, service_role;
grant execute on function private.complimentary_retention_open(uuid, timestamptz)
to authenticated, service_role;
grant execute on function public.grant_business_complimentary_access(uuid, text, text, text)
to service_role;
grant execute on function public.revoke_business_complimentary_access(uuid, text, text)
to service_role;
grant execute on function public.delete_expired_complimentary_business_data()
to service_role;

-- Supabase Cron runs the retention cleanup inside Postgres, without a public
-- maintenance endpoint or another secret in Vercel.
create extension if not exists pg_cron;

select cron.schedule(
  'little-birdee-expired-beta-cleanup',
  '15 2 * * *',
  'select public.delete_expired_complimentary_business_data()'
);
