-- Little Birdee Group 1 foundation.
-- All money is stored as integer Australian cents and all rates as basis points.
-- Public tables are explicitly granted to authenticated users and protected by RLS.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length
    check (display_name is null or char_length(btrim(display_name)) between 1 and 120)
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  trading_name text not null,
  owner_user_id uuid not null references auth.users (id),
  currency_code text not null default 'AUD',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_trading_name_length
    check (char_length(btrim(trading_name)) between 1 and 160),
  constraint businesses_currency_code
    check (currency_code = 'AUD')
);

create table public.business_members (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  invited_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id),
  constraint business_members_role
    check (role in ('owner', 'admin', 'editor', 'viewer'))
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  time_zone text not null default 'Australia/Sydney',
  is_active boolean not null default true,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id),
  unique (business_id, name),
  constraint venues_name_length
    check (char_length(btrim(name)) between 1 and 160)
);

create table public.venue_members (
  business_id uuid not null references public.businesses (id) on delete cascade,
  venue_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  granted_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  primary key (venue_id, user_id),
  foreign key (venue_id, business_id)
    references public.venues (id, business_id) on delete cascade,
  constraint venue_members_role
    check (role in ('manager', 'editor', 'viewer'))
);

create table public.venue_settings (
  venue_id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  gst_registration text not null default 'registered-fully-taxable',
  revenue_entry_basis text not null default 'gst-inclusive',
  gst_rate_basis_points integer not null default 1000,
  week_starts_on smallint not null default 1,
  chirp_cutoff_local time not null default '07:00',
  updated_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (venue_id, business_id)
    references public.venues (id, business_id) on delete cascade,
  constraint venue_settings_gst_registration
    check (gst_registration in (
      'not-registered',
      'registered-fully-taxable',
      'registered-mixed'
    )),
  constraint venue_settings_revenue_entry_basis
    check (revenue_entry_basis in ('gst-inclusive', 'gst-exclusive')),
  constraint venue_settings_mixed_sales_basis
    check (
      gst_registration <> 'registered-mixed'
      or revenue_entry_basis = 'gst-exclusive'
    ),
  constraint venue_settings_gst_rate
    check (gst_rate_basis_points between 0 and 10000),
  constraint venue_settings_week_start
    check (week_starts_on between 1 and 7)
);

create table public.financial_assumptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  venue_id uuid not null,
  kind text not null,
  amount_cents bigint,
  rate_basis_points integer,
  source text not null,
  status text not null,
  effective_from date not null,
  effective_to date,
  source_period_from date,
  source_period_to date,
  source_reference_id text,
  included_account_ids text[] not null default '{}',
  excluded_account_ids text[] not null default '{}',
  operator_confirmed boolean not null default false,
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users (id),
  version integer not null,
  supersedes_id uuid references public.financial_assumptions (id),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  foreign key (venue_id, business_id)
    references public.venues (id, business_id) on delete cascade,
  unique (venue_id, kind, effective_from, version),
  constraint financial_assumptions_kind
    check (kind in (
      'cogs-rate',
      'weekly-labour',
      'weekly-other-operating-costs',
      'weekly-recurring-operating-income',
      'loaded-hourly-labour-cost'
    )),
  constraint financial_assumptions_value_shape
    check (
      (
        kind = 'cogs-rate'
        and rate_basis_points is not null
        and amount_cents is null
      )
      or
      (
        kind <> 'cogs-rate'
        and amount_cents is not null
        and rate_basis_points is null
      )
    ),
  constraint financial_assumptions_amount_nonnegative
    check (amount_cents is null or amount_cents >= 0),
  constraint financial_assumptions_rate
    check (rate_basis_points is null or rate_basis_points between 0 and 10000),
  constraint financial_assumptions_source
    check (source in (
      'forecast',
      'manual',
      'pos',
      'pnl',
      'allocated-budget',
      'roster-scheduled',
      'timesheet-worked',
      'timesheet-approved',
      'derived'
    )),
  constraint financial_assumptions_status
    check (status in ('forecast', 'estimated', 'provisional', 'confirmed')),
  constraint financial_assumptions_effective_period
    check (effective_to is null or effective_to >= effective_from),
  constraint financial_assumptions_source_period
    check (
      (source_period_from is null and source_period_to is null)
      or
      (
        source_period_from is not null
        and source_period_to is not null
        and source_period_to >= source_period_from
      )
    ),
  constraint financial_assumptions_confirmation
    check (
      (
        operator_confirmed = false
        and confirmed_at is null
        and confirmed_by is null
      )
      or
      (
        operator_confirmed = true
        and confirmed_at is not null
        and confirmed_by is not null
      )
    ),
  constraint financial_assumptions_version
    check (version > 0),
  constraint financial_assumptions_metadata_object
    check (jsonb_typeof(metadata) = 'object')
);

create table public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  venue_id uuid not null,
  week_start date not null,
  version integer not null,
  status text not null default 'draft',
  gst_registration text not null,
  revenue_entry_basis text not null,
  cogs_rate_basis_points integer not null,
  weekly_labour_cents bigint not null,
  weekly_other_operating_costs_cents bigint not null,
  weekly_recurring_operating_income_cents bigint not null default 0,
  loaded_hourly_labour_cost_cents bigint,
  assumption_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id),
  supersedes_id uuid references public.weekly_plans (id),
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (venue_id, business_id)
    references public.venues (id, business_id) on delete cascade,
  unique (id, business_id, venue_id),
  unique (venue_id, week_start, version),
  constraint weekly_plans_monday_start
    check (extract(isodow from week_start) = 1),
  constraint weekly_plans_version
    check (version > 0),
  constraint weekly_plans_status
    check (status in ('draft', 'locked')),
  constraint weekly_plans_gst_registration
    check (gst_registration in (
      'not-registered',
      'registered-fully-taxable',
      'registered-mixed'
    )),
  constraint weekly_plans_revenue_entry_basis
    check (revenue_entry_basis in ('gst-inclusive', 'gst-exclusive')),
  constraint weekly_plans_mixed_sales_basis
    check (
      gst_registration <> 'registered-mixed'
      or revenue_entry_basis = 'gst-exclusive'
    ),
  constraint weekly_plans_cogs_rate
    check (cogs_rate_basis_points between 0 and 10000),
  constraint weekly_plans_money_nonnegative
    check (
      weekly_labour_cents >= 0
      and weekly_other_operating_costs_cents >= 0
      and weekly_recurring_operating_income_cents >= 0
      and (
        loaded_hourly_labour_cost_cents is null
        or loaded_hourly_labour_cost_cents >= 0
      )
    ),
  constraint weekly_plans_lock_state
    check (
      (status = 'draft' and locked_at is null)
      or
      (status = 'locked' and locked_at is not null)
    ),
  constraint weekly_plans_snapshot_object
    check (jsonb_typeof(assumption_snapshot) = 'object')
);

create table public.weekly_plan_days (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid not null,
  business_id uuid not null references public.businesses (id) on delete cascade,
  venue_id uuid not null,
  service_date date not null,
  day_index smallint not null,
  planned_revenue_cents bigint not null,
  planned_labour_cents bigint not null,
  planned_other_operating_costs_cents bigint not null,
  planned_recurring_operating_income_cents bigint not null default 0,
  created_at timestamptz not null default now(),
  foreign key (weekly_plan_id, business_id, venue_id)
    references public.weekly_plans (id, business_id, venue_id) on delete cascade,
  foreign key (venue_id, business_id)
    references public.venues (id, business_id) on delete cascade,
  unique (weekly_plan_id, service_date),
  unique (weekly_plan_id, day_index),
  constraint weekly_plan_days_index
    check (day_index between 0 and 6),
  constraint weekly_plan_days_money_nonnegative
    check (
      planned_revenue_cents >= 0
      and planned_labour_cents >= 0
      and planned_other_operating_costs_cents >= 0
      and planned_recurring_operating_income_cents >= 0
    )
);

create table public.daily_actual_revisions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  venue_id uuid not null,
  service_date date not null,
  revision integer not null,
  entered_revenue_cents bigint,
  revenue_entry_basis text,
  gst_registration text,
  revenue_source text,
  revenue_status text,
  labour_cents bigint,
  labour_source text,
  labour_status text,
  cogs_rate_basis_points integer not null,
  other_operating_costs_cents bigint not null,
  recurring_operating_income_cents bigint not null default 0,
  plan_day_snapshot_id uuid references public.weekly_plan_days (id),
  supersedes_id uuid references public.daily_actual_revisions (id),
  source_updated_at timestamptz,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  foreign key (venue_id, business_id)
    references public.venues (id, business_id) on delete cascade,
  unique (venue_id, service_date, revision),
  constraint daily_actual_revisions_revision
    check (revision > 0),
  constraint daily_actual_revisions_has_value
    check (entered_revenue_cents is not null or labour_cents is not null),
  constraint daily_actual_revisions_money_nonnegative
    check (
      (entered_revenue_cents is null or entered_revenue_cents >= 0)
      and (labour_cents is null or labour_cents >= 0)
      and other_operating_costs_cents >= 0
      and recurring_operating_income_cents >= 0
    ),
  constraint daily_actual_revisions_revenue_shape
    check (
      (
        entered_revenue_cents is null
        and revenue_entry_basis is null
        and gst_registration is null
        and revenue_source is null
        and revenue_status is null
      )
      or
      (
        entered_revenue_cents is not null
        and revenue_entry_basis is not null
        and gst_registration is not null
        and revenue_source is not null
        and revenue_status is not null
      )
    ),
  constraint daily_actual_revisions_labour_shape
    check (
      (
        labour_cents is null
        and labour_source is null
        and labour_status is null
      )
      or
      (
        labour_cents is not null
        and labour_source is not null
        and labour_status is not null
      )
    ),
  constraint daily_actual_revisions_revenue_basis
    check (revenue_entry_basis is null or revenue_entry_basis in ('gst-inclusive', 'gst-exclusive')),
  constraint daily_actual_revisions_gst_registration
    check (
      gst_registration is null
      or gst_registration in (
        'not-registered',
        'registered-fully-taxable',
        'registered-mixed'
      )
    ),
  constraint daily_actual_revisions_mixed_sales_basis
    check (
      gst_registration <> 'registered-mixed'
      or revenue_entry_basis = 'gst-exclusive'
    ),
  constraint daily_actual_revisions_sources
    check (
      (revenue_source is null or revenue_source in ('manual', 'pos'))
      and (
        labour_source is null
        or labour_source in (
          'manual',
          'allocated-budget',
          'roster-scheduled',
          'timesheet-worked',
          'timesheet-approved'
        )
      )
    ),
  constraint daily_actual_revisions_statuses
    check (
      (revenue_status is null or revenue_status in ('estimated', 'provisional', 'confirmed'))
      and (labour_status is null or labour_status in ('estimated', 'provisional', 'confirmed'))
    ),
  constraint daily_actual_revisions_cogs_rate
    check (cogs_rate_basis_points between 0 and 10000)
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  business_id uuid not null,
  venue_id uuid,
  actor_user_id uuid,
  event_type text not null,
  entity_type text not null,
  entity_id text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now(),
  constraint audit_events_event_type
    check (event_type in ('insert', 'update', 'delete')),
  constraint audit_events_payload_shape
    check (
      (before_data is null or jsonb_typeof(before_data) = 'object')
      and (after_data is null or jsonb_typeof(after_data) = 'object')
    )
);

-- Every foreign key and RLS lookup receives an index.
create index businesses_owner_user_id_idx on public.businesses (owner_user_id);
create index business_members_user_id_idx on public.business_members (user_id, business_id);
create index venues_business_id_idx on public.venues (business_id);
create index venues_created_by_idx on public.venues (created_by);
create index venue_members_user_id_idx on public.venue_members (user_id, venue_id);
create index venue_members_business_id_idx on public.venue_members (business_id);
create index financial_assumptions_business_id_idx on public.financial_assumptions (business_id);
create index financial_assumptions_venue_kind_effective_idx
  on public.financial_assumptions (venue_id, kind, effective_from desc, version desc);
create index financial_assumptions_created_by_idx on public.financial_assumptions (created_by);
create index financial_assumptions_supersedes_id_idx on public.financial_assumptions (supersedes_id);
create index weekly_plans_business_id_idx on public.weekly_plans (business_id);
create index weekly_plans_venue_week_idx
  on public.weekly_plans (venue_id, week_start desc, version desc);
create index weekly_plans_created_by_idx on public.weekly_plans (created_by);
create index weekly_plans_supersedes_id_idx on public.weekly_plans (supersedes_id);
create index weekly_plan_days_business_id_idx on public.weekly_plan_days (business_id);
create index weekly_plan_days_venue_date_idx on public.weekly_plan_days (venue_id, service_date);
create index daily_actual_revisions_business_id_idx on public.daily_actual_revisions (business_id);
create index daily_actual_revisions_venue_date_idx
  on public.daily_actual_revisions (venue_id, service_date desc, revision desc);
create index daily_actual_revisions_created_by_idx on public.daily_actual_revisions (created_by);
create index daily_actual_revisions_plan_day_idx on public.daily_actual_revisions (plan_day_snapshot_id);
create index daily_actual_revisions_supersedes_id_idx on public.daily_actual_revisions (supersedes_id);
create index audit_events_business_created_idx on public.audit_events (business_id, created_at desc);
create index audit_events_venue_created_idx on public.audit_events (venue_id, created_at desc);
create index audit_events_actor_idx on public.audit_events (actor_user_id, created_at desc);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.business_role(target_business_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select bm.role
  from public.business_members as bm
  where bm.business_id = target_business_id
    and bm.user_id = (select auth.uid())
    and (select auth.uid()) is not null
  limit 1;
$$;

create or replace function private.can_access_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.business_members as bm
      where bm.business_id = target_business_id
        and bm.user_id = (select auth.uid())
    );
$$;

create or replace function private.can_manage_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.business_members as bm
      where bm.business_id = target_business_id
        and bm.user_id = (select auth.uid())
        and bm.role in ('owner', 'admin')
    );
$$;

create or replace function private.can_access_venue(target_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.venues as v
      where v.id = target_venue_id
        and (
          exists (
            select 1
            from public.business_members as bm
            where bm.business_id = v.business_id
              and bm.user_id = (select auth.uid())
              and bm.role in ('owner', 'admin')
          )
          or exists (
            select 1
            from public.venue_members as vm
            where vm.venue_id = v.id
              and vm.user_id = (select auth.uid())
          )
        )
    );
$$;

create or replace function private.can_edit_venue(target_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.venues as v
      where v.id = target_venue_id
        and (
          exists (
            select 1
            from public.business_members as bm
            where bm.business_id = v.business_id
              and bm.user_id = (select auth.uid())
              and bm.role in ('owner', 'admin')
          )
          or exists (
            select 1
            from public.venue_members as vm
            where vm.venue_id = v.id
              and vm.user_id = (select auth.uid())
              and vm.role in ('manager', 'editor')
          )
        )
    );
$$;

create or replace function private.guard_weekly_plan()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  plan_day_count integer;
begin
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
    select count(*)
    into plan_day_count
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

create or replace function private.protect_business_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_user_id <> old.owner_user_id then
    raise exception 'Business ownership changes require a dedicated ownership-transfer workflow';
  end if;
  return new;
end;
$$;

create or replace function private.protect_venue_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.business_id <> old.business_id or new.created_by <> old.created_by then
    raise exception 'Venue ownership fields are immutable';
  end if;
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
  if tg_op = 'DELETE' then
    row_data := old;
  else
    row_data := new;
  end if;

  select *
  into parent_plan
  from public.weekly_plans as p
  where p.id = row_data.weekly_plan_id;

  if parent_plan.id is null then
    raise exception 'Weekly plan not found';
  end if;

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

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function private.prevent_immutable_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% records are immutable; insert a new version instead', tg_table_name;
end;
$$;

create or replace function private.capture_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb;
  previous_data jsonb;
  current_data jsonb;
  target_business_id uuid;
  target_venue_id uuid;
  target_entity_id text;
begin
  previous_data := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  current_data := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  row_data := coalesce(current_data, previous_data);

  target_business_id := coalesce(
    nullif(row_data ->> 'business_id', '')::uuid,
    case when tg_table_name = 'businesses' then nullif(row_data ->> 'id', '')::uuid end
  );
  target_venue_id := nullif(row_data ->> 'venue_id', '')::uuid;
  target_entity_id := coalesce(
    row_data ->> 'id',
    concat_ws(':', row_data ->> 'business_id', row_data ->> 'venue_id', row_data ->> 'user_id')
  );

  if target_business_id is not null then
    insert into public.audit_events (
      business_id,
      venue_id,
      actor_user_id,
      event_type,
      entity_type,
      entity_id,
      before_data,
      after_data
    )
    values (
      target_business_id,
      target_venue_id,
      (select auth.uid()),
      lower(tg_op),
      tg_table_name,
      target_entity_id,
      previous_data,
      current_data
    );
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function private.touch_updated_at();

create trigger businesses_touch_updated_at
before update on public.businesses
for each row execute function private.touch_updated_at();

create trigger businesses_protect_identity
before update on public.businesses
for each row execute function private.protect_business_identity();

create trigger venues_touch_updated_at
before update on public.venues
for each row execute function private.touch_updated_at();

create trigger venues_protect_identity
before update on public.venues
for each row execute function private.protect_venue_identity();

create trigger venue_settings_touch_updated_at
before update on public.venue_settings
for each row execute function private.touch_updated_at();

create trigger weekly_plans_guard
before update or delete on public.weekly_plans
for each row execute function private.guard_weekly_plan();

create trigger weekly_plan_days_guard
before insert or update or delete on public.weekly_plan_days
for each row execute function private.guard_weekly_plan_day();

create trigger financial_assumptions_immutable
before update or delete on public.financial_assumptions
for each row execute function private.prevent_immutable_change();

create trigger daily_actual_revisions_immutable
before update or delete on public.daily_actual_revisions
for each row execute function private.prevent_immutable_change();

create trigger businesses_audit
after insert or update or delete on public.businesses
for each row execute function private.capture_audit_event();

create trigger business_members_audit
after insert or update or delete on public.business_members
for each row execute function private.capture_audit_event();

create trigger venues_audit
after insert or update or delete on public.venues
for each row execute function private.capture_audit_event();

create trigger venue_members_audit
after insert or update or delete on public.venue_members
for each row execute function private.capture_audit_event();

create trigger venue_settings_audit
after insert or update or delete on public.venue_settings
for each row execute function private.capture_audit_event();

create trigger financial_assumptions_audit
after insert on public.financial_assumptions
for each row execute function private.capture_audit_event();

create trigger weekly_plans_audit
after insert or update or delete on public.weekly_plans
for each row execute function private.capture_audit_event();

create trigger weekly_plan_days_audit
after insert or update or delete on public.weekly_plan_days
for each row execute function private.capture_audit_event();

create trigger daily_actual_revisions_audit
after insert on public.daily_actual_revisions
for each row execute function private.capture_audit_event();

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.venues enable row level security;
alter table public.venue_members enable row level security;
alter table public.venue_settings enable row level security;
alter table public.financial_assumptions enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.weekly_plan_days enable row level security;
alter table public.daily_actual_revisions enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_select_own
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_insert_own
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy businesses_select_member
on public.businesses for select
to authenticated
using ((select private.can_access_business(id)));

create policy businesses_insert_owner
on public.businesses for insert
to authenticated
with check ((select auth.uid()) = owner_user_id);

create policy businesses_update_manager
on public.businesses for update
to authenticated
using ((select private.can_manage_business(id)))
with check ((select private.can_manage_business(id)));

create policy business_members_select_allowed
on public.business_members for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.can_manage_business(business_id))
);

create policy business_members_insert_manager
on public.business_members for insert
to authenticated
with check (
  (select private.can_manage_business(business_id))
  or (
    user_id = (select auth.uid())
    and role = 'owner'
    and exists (
      select 1
      from public.businesses as b
      where b.id = business_id
        and b.owner_user_id = (select auth.uid())
    )
  )
);

create policy business_members_update_manager
on public.business_members for update
to authenticated
using ((select private.can_manage_business(business_id)))
with check ((select private.can_manage_business(business_id)));

create policy business_members_delete_manager
on public.business_members for delete
to authenticated
using (
  (select private.can_manage_business(business_id))
  and not (role = 'owner' and user_id = (select auth.uid()))
);

create policy venues_select_allowed
on public.venues for select
to authenticated
using ((select private.can_access_venue(id)));

create policy venues_insert_manager
on public.venues for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_business(business_id))
);

create policy venues_update_editor
on public.venues for update
to authenticated
using ((select private.can_edit_venue(id)))
with check ((select private.can_edit_venue(id)));

create policy venue_members_select_allowed
on public.venue_members for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.can_manage_business(business_id))
);

create policy venue_members_insert_manager
on public.venue_members for insert
to authenticated
with check (
  granted_by = (select auth.uid())
  and (select private.can_manage_business(business_id))
);

create policy venue_members_update_manager
on public.venue_members for update
to authenticated
using ((select private.can_manage_business(business_id)))
with check ((select private.can_manage_business(business_id)));

create policy venue_members_delete_manager
on public.venue_members for delete
to authenticated
using ((select private.can_manage_business(business_id)));

create policy venue_settings_select_allowed
on public.venue_settings for select
to authenticated
using ((select private.can_access_venue(venue_id)));

create policy venue_settings_insert_editor
on public.venue_settings for insert
to authenticated
with check (
  updated_by = (select auth.uid())
  and (select private.can_edit_venue(venue_id))
);

create policy venue_settings_update_editor
on public.venue_settings for update
to authenticated
using ((select private.can_edit_venue(venue_id)))
with check (
  updated_by = (select auth.uid())
  and (select private.can_edit_venue(venue_id))
);

create policy financial_assumptions_select_allowed
on public.financial_assumptions for select
to authenticated
using ((select private.can_access_venue(venue_id)));

create policy financial_assumptions_insert_editor
on public.financial_assumptions for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_edit_venue(venue_id))
);

create policy weekly_plans_select_allowed
on public.weekly_plans for select
to authenticated
using ((select private.can_access_venue(venue_id)));

create policy weekly_plans_insert_editor
on public.weekly_plans for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and status = 'draft'
  and (select private.can_edit_venue(venue_id))
);

create policy weekly_plans_update_editor
on public.weekly_plans for update
to authenticated
using (
  status = 'draft'
  and (select private.can_edit_venue(venue_id))
)
with check (
  (select private.can_edit_venue(venue_id))
);

create policy weekly_plans_delete_editor
on public.weekly_plans for delete
to authenticated
using (
  status = 'draft'
  and (select private.can_edit_venue(venue_id))
);

create policy weekly_plan_days_select_allowed
on public.weekly_plan_days for select
to authenticated
using ((select private.can_access_venue(venue_id)));

create policy weekly_plan_days_insert_editor
on public.weekly_plan_days for insert
to authenticated
with check ((select private.can_edit_venue(venue_id)));

create policy weekly_plan_days_update_editor
on public.weekly_plan_days for update
to authenticated
using ((select private.can_edit_venue(venue_id)))
with check ((select private.can_edit_venue(venue_id)));

create policy weekly_plan_days_delete_editor
on public.weekly_plan_days for delete
to authenticated
using ((select private.can_edit_venue(venue_id)));

create policy daily_actual_revisions_select_allowed
on public.daily_actual_revisions for select
to authenticated
using ((select private.can_access_venue(venue_id)));

create policy daily_actual_revisions_insert_editor
on public.daily_actual_revisions for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_edit_venue(venue_id))
);

create policy audit_events_select_allowed
on public.audit_events for select
to authenticated
using ((select private.can_access_business(business_id)));

-- Supabase's current Data API defaults do not expose new tables automatically.
-- Opt in only the operations needed by the authenticated application.
grant usage on schema public to authenticated, service_role;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.businesses to authenticated;
grant select, insert, update, delete on public.business_members to authenticated;
grant select, insert, update on public.venues to authenticated;
grant select, insert, update, delete on public.venue_members to authenticated;
grant select, insert, update on public.venue_settings to authenticated;
grant select, insert on public.financial_assumptions to authenticated;
grant select, insert, update, delete on public.weekly_plans to authenticated;
grant select, insert, update, delete on public.weekly_plan_days to authenticated;
grant select, insert on public.daily_actual_revisions to authenticated;
grant select on public.audit_events to authenticated;

grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

revoke all on all functions in schema private from public, anon, authenticated, service_role;

create or replace function public.bootstrap_account(
  business_name text,
  venue_name text,
  venue_time_zone text default 'Australia/Sydney',
  profile_display_name text default null
)
returns table (business_id uuid, venue_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_business_id uuid;
  new_venue_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(btrim(business_name)) not between 1 and 160 then
    raise exception 'Business name is required';
  end if;

  if char_length(btrim(venue_name)) not between 1 and 160 then
    raise exception 'Venue name is required';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_timezone_names
    where name = venue_time_zone
  ) then
    raise exception 'Unknown venue time zone';
  end if;

  insert into public.profiles (id, display_name)
  values (current_user_id, nullif(btrim(profile_display_name), ''))
  on conflict (id) do update
  set display_name = coalesce(excluded.display_name, public.profiles.display_name);

  select bm.business_id, v.id
  into new_business_id, new_venue_id
  from public.business_members as bm
  join public.venues as v on v.business_id = bm.business_id
  where bm.user_id = current_user_id
  order by bm.created_at, v.created_at
  limit 1;

  if new_business_id is not null and new_venue_id is not null then
    return query select new_business_id, new_venue_id;
    return;
  end if;

  insert into public.businesses (trading_name, owner_user_id)
  values (btrim(business_name), current_user_id)
  returning id into new_business_id;

  insert into public.business_members (business_id, user_id, role, invited_by)
  values (new_business_id, current_user_id, 'owner', current_user_id);

  insert into public.venues (business_id, name, time_zone, created_by)
  values (new_business_id, btrim(venue_name), venue_time_zone, current_user_id)
  returning id into new_venue_id;

  insert into public.venue_members (business_id, venue_id, user_id, role, granted_by)
  values (new_business_id, new_venue_id, current_user_id, 'manager', current_user_id);

  insert into public.venue_settings (venue_id, business_id, updated_by)
  values (new_venue_id, new_business_id, current_user_id);

  return query select new_business_id, new_venue_id;
end;
$$;

revoke execute on function public.bootstrap_account(text, text, text, text)
from public, anon;
grant execute on function public.bootstrap_account(text, text, text, text)
to authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;
