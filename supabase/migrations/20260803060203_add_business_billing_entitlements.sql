-- Business-level Stripe billing. One subscription covers every venue and
-- member in the business. Stripe writes arrive only through server-side RPCs.

create table public.business_subscriptions (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null default 'none',
  access_state text not null default 'pending',
  data_state text not null default 'present',
  paid_through timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  payment_failed_at timestamptz,
  canceled_at timestamptz,
  ended_at timestamptz,
  last_stripe_event_id text,
  last_stripe_event_created bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_subscriptions_status check (
    status in (
      'none', 'incomplete', 'incomplete_expired', 'trialing', 'active',
      'past_due', 'canceled', 'unpaid', 'paused'
    )
  ),
  constraint business_subscriptions_access_state check (
    access_state in ('pending', 'active', 'locked_recovery', 'ended')
  ),
  constraint business_subscriptions_data_state check (
    data_state in ('present', 'deletion_pending', 'deleted')
  ),
  constraint business_subscriptions_stripe_customer_format check (
    stripe_customer_id is null or stripe_customer_id ~ '^cus_[A-Za-z0-9]+$'
  ),
  constraint business_subscriptions_stripe_subscription_format check (
    stripe_subscription_id is null or stripe_subscription_id ~ '^sub_[A-Za-z0-9]+$'
  ),
  constraint business_subscriptions_stripe_price_format check (
    stripe_price_id is null or stripe_price_id ~ '^price_[A-Za-z0-9]+$'
  )
);

create index business_subscriptions_customer_idx
  on public.business_subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

create index business_subscriptions_subscription_idx
  on public.business_subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index business_subscriptions_access_idx
  on public.business_subscriptions (access_state, paid_through);

create trigger business_subscriptions_touch_updated_at
before update on public.business_subscriptions
for each row execute function private.touch_updated_at();

alter table public.business_subscriptions enable row level security;

create policy business_subscriptions_select_member
on public.business_subscriptions for select
to authenticated
using ((select private.can_access_business(business_id)));

revoke all privileges on public.business_subscriptions from anon, authenticated;
grant select on public.business_subscriptions to authenticated;
grant all on public.business_subscriptions to service_role;

-- These tables are deliberately outside the exposed Data API. Public RPCs
-- below expose only the minimum server-side operations required by webhooks.
create table private.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  object_id text,
  event_created bigint not null,
  status text not null default 'processing',
  attempt_count integer not null default 1,
  error_code text,
  first_received_at timestamptz not null default now(),
  last_attempt_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint stripe_webhook_events_status
    check (status in ('processing', 'processed', 'failed')),
  constraint stripe_webhook_events_attempt_count
    check (attempt_count > 0)
);

create index stripe_webhook_events_status_attempt_idx
  on private.stripe_webhook_events (status, last_attempt_at);

create table private.billing_deletion_receipts (
  id bigint generated always as identity primary key,
  business_id uuid not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  reason text not null,
  stripe_event_id text,
  policy_version text not null default '2026-08-03-v1',
  deleted_at timestamptz not null default now(),
  constraint billing_deletion_receipts_reason_length
    check (char_length(btrim(reason)) between 1 and 120)
);

revoke all on private.stripe_webhook_events from public, anon, authenticated, service_role;
revoke all on private.billing_deletion_receipts from public, anon, authenticated, service_role;

-- An authenticated owner/admin can create only the empty billing shell for
-- their own business. Stripe identifiers remain unavailable to this function.
create or replace function public.prepare_business_billing(p_business_id uuid)
returns public.business_subscriptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  prepared public.business_subscriptions%rowtype;
begin
  if (select auth.uid()) is null
    or not (select private.can_manage_business(p_business_id)) then
    raise exception 'Business billing access denied';
  end if;

  insert into public.business_subscriptions (business_id)
  values (p_business_id)
  on conflict (business_id) do nothing;

  select * into prepared
  from public.business_subscriptions
  where business_id = p_business_id;

  return prepared;
end;
$$;

revoke all on function public.prepare_business_billing(uuid)
from public, anon, authenticated, service_role;
grant execute on function public.prepare_business_billing(uuid)
to authenticated, service_role;

-- Claiming is retry-safe. A processed event is a duplicate; a processing event
-- can be reclaimed after five minutes so a crashed request cannot wedge it.
create or replace function public.claim_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_object_id text,
  p_event_created bigint
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing private.stripe_webhook_events%rowtype;
begin
  if p_event_id !~ '^evt_[A-Za-z0-9]+$' then
    raise exception 'Invalid Stripe event id';
  end if;

  select * into existing
  from private.stripe_webhook_events
  where event_id = p_event_id
  for update;

  if found and existing.status = 'processed' then
    return 'duplicate';
  end if;

  if found
    and existing.status = 'processing'
    and existing.last_attempt_at > now() - interval '5 minutes' then
    return 'busy';
  end if;

  insert into private.stripe_webhook_events (
    event_id, event_type, object_id, event_created
  ) values (
    p_event_id, left(p_event_type, 120), left(p_object_id, 255), p_event_created
  )
  on conflict (event_id) do update set
    status = 'processing',
    attempt_count = private.stripe_webhook_events.attempt_count + 1,
    error_code = null,
    last_attempt_at = now();

  return 'claimed';
end;
$$;

create or replace function public.complete_stripe_webhook_event(p_event_id text)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.stripe_webhook_events
  set status = 'processed', processed_at = now(), last_attempt_at = now(), error_code = null
  where event_id = p_event_id;
$$;

create or replace function public.fail_stripe_webhook_event(
  p_event_id text,
  p_error_code text
)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.stripe_webhook_events
  set status = 'failed', last_attempt_at = now(), error_code = left(p_error_code, 120)
  where event_id = p_event_id;
$$;

-- Apply a canonical Stripe subscription projection. paid_through never moves
-- backwards when delayed invoice events arrive.
create or replace function public.apply_business_subscription_event(
  p_business_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_status text,
  p_access_state text,
  p_paid_through timestamptz,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_payment_failed_at timestamptz,
  p_canceled_at timestamptz,
  p_ended_at timestamptz,
  p_event_id text,
  p_event_created bigint
)
returns public.business_subscriptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  applied public.business_subscriptions%rowtype;
begin
  if not exists (select 1 from public.businesses where id = p_business_id) then
    raise exception 'Unknown business';
  end if;

  insert into public.business_subscriptions (
    business_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    status,
    access_state,
    paid_through,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    payment_failed_at,
    canceled_at,
    ended_at,
    last_stripe_event_id,
    last_stripe_event_created
  ) values (
    p_business_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_price_id,
    p_status,
    p_access_state,
    p_paid_through,
    p_current_period_start,
    p_current_period_end,
    coalesce(p_cancel_at_period_end, false),
    p_payment_failed_at,
    p_canceled_at,
    p_ended_at,
    p_event_id,
    p_event_created
  )
  on conflict (business_id) do update set
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_price_id = excluded.stripe_price_id,
    status = excluded.status,
    access_state = excluded.access_state,
    data_state = case
      when excluded.status in ('active', 'trialing')
        and excluded.paid_through > now() then 'present'
      else public.business_subscriptions.data_state
    end,
    paid_through = case
      when public.business_subscriptions.paid_through is null then excluded.paid_through
      when excluded.paid_through is null then public.business_subscriptions.paid_through
      else greatest(public.business_subscriptions.paid_through, excluded.paid_through)
    end,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    payment_failed_at = excluded.payment_failed_at,
    canceled_at = excluded.canceled_at,
    ended_at = excluded.ended_at,
    last_stripe_event_id = excluded.last_stripe_event_id,
    last_stripe_event_created = greatest(
      coalesce(public.business_subscriptions.last_stripe_event_created, 0),
      excluded.last_stripe_event_created
    );

  select * into applied
  from public.business_subscriptions
  where business_id = p_business_id;

  return applied;
end;
$$;

-- The financial model is immutable during normal operation. A tightly scoped
-- terminal purge may bypass those triggers only inside the postgres-owned
-- deletion function below.
create or replace function private.guard_weekly_plan()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  plan_day_count integer;
begin
  if current_user = 'postgres'
    and current_setting('little_birdee.operational_purge', true) = 'on' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'Locked weekly plans are immutable';
    end if;
    return old;
  end if;

  if old.status <> 'draft' then
    raise exception 'Locked weekly plans are immutable';
  end if;

  if new.business_id <> old.business_id
    or new.venue_id <> old.venue_id
    or new.week_start <> old.week_start
    or new.version <> old.version
    or new.created_by <> old.created_by
    or new.supersedes_id is distinct from old.supersedes_id then
    raise exception 'Weekly plan identity and ownership fields are immutable';
  end if;

  if new.status = 'locked' then
    select count(*) into plan_day_count
    from public.weekly_plan_days as d
    where d.weekly_plan_id = new.id;
    if plan_day_count <> 7 then
      raise exception 'A weekly plan must contain exactly seven daily snapshots before locking';
    end if;
    new.locked_at = coalesce(new.locked_at, now());
  else
    new.locked_at = null;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.guard_weekly_plan_day()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  row_data record;
  parent_plan public.weekly_plans%rowtype;
begin
  if current_user = 'postgres'
    and current_setting('little_birdee.operational_purge', true) = 'on' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_op = 'DELETE' then
    row_data := old;
  else
    row_data := new;
  end if;
  select * into parent_plan from public.weekly_plans where id = row_data.weekly_plan_id;
  if parent_plan.id is null then raise exception 'Weekly plan not found'; end if;
  if parent_plan.status <> 'draft' then
    raise exception 'Locked weekly plan allocations are immutable';
  end if;
  if row_data.business_id <> parent_plan.business_id
    or row_data.venue_id <> parent_plan.venue_id then
    raise exception 'Daily snapshot ownership must match its weekly plan';
  end if;
  if row_data.service_date < parent_plan.week_start
    or row_data.service_date > parent_plan.week_start + 6 then
    raise exception 'Daily snapshot date must fall inside its weekly plan';
  end if;
  if row_data.day_index <> row_data.service_date - parent_plan.week_start then
    raise exception 'Daily snapshot index must match its service date';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function private.prevent_immutable_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'postgres'
    and current_setting('little_birdee.operational_purge', true) = 'on' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  raise exception '% records are immutable; insert a new version instead', tg_table_name;
end;
$$;

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
  if subscription.access_state <> 'ended' then
    raise exception 'Operational data can only be deleted after access ends';
  end if;
  if subscription.data_state = 'deleted' then return; end if;

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
    stripe_event_id
  ) values (
    p_business_id,
    subscription.stripe_customer_id,
    subscription.stripe_subscription_id,
    left(btrim(p_reason), 120),
    p_stripe_event_id
  );

  update public.business_subscriptions
  set data_state = 'deleted'
  where business_id = p_business_id;
end;
$$;

revoke all on function public.claim_stripe_webhook_event(text, text, text, bigint)
from public, anon, authenticated, service_role;
revoke all on function public.complete_stripe_webhook_event(text)
from public, anon, authenticated, service_role;
revoke all on function public.fail_stripe_webhook_event(text, text)
from public, anon, authenticated, service_role;
revoke all on function public.apply_business_subscription_event(
  uuid, text, text, text, text, text, timestamptz, timestamptz, timestamptz,
  boolean, timestamptz, timestamptz, timestamptz, text, bigint
) from public, anon, authenticated, service_role;
revoke all on function public.delete_business_operational_data(uuid, text, text)
from public, anon, authenticated, service_role;

grant execute on function public.claim_stripe_webhook_event(text, text, text, bigint)
to service_role;
grant execute on function public.complete_stripe_webhook_event(text)
to service_role;
grant execute on function public.fail_stripe_webhook_event(text, text)
to service_role;
grant execute on function public.apply_business_subscription_event(
  uuid, text, text, text, text, text, timestamptz, timestamptz, timestamptz,
  boolean, timestamptz, timestamptz, timestamptz, text, bigint
) to service_role;
grant execute on function public.delete_business_operational_data(uuid, text, text)
to service_role;
