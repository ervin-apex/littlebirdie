-- Persist one confirmed Setup submission as a complete, locked plan version.
-- The function is SECURITY INVOKER so table grants and RLS remain authoritative.

create or replace function public.save_week_plan(
  p_venue_id uuid,
  p_week_start date,
  p_gst_registration text,
  p_revenue_entry_basis text,
  p_cogs_rate_basis_points integer,
  p_weekly_labour_cents bigint,
  p_weekly_other_operating_costs_cents bigint,
  p_weekly_recurring_operating_income_cents bigint,
  p_loaded_hourly_labour_cost_cents bigint,
  p_days jsonb
)
returns table (plan_id uuid, plan_version integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  selected_business_id uuid;
  previous_plan_id uuid;
  next_plan_version integer;
  new_plan_id uuid;
  previous_assumption_id uuid;
  next_assumption_version integer;
  cogs_assumption_id uuid;
  labour_assumption_id uuid;
  other_costs_assumption_id uuid;
  recurring_income_assumption_id uuid;
  hourly_cost_assumption_id uuid;
  day_count integer;
  day_index_count integer;
  labour_total bigint;
  other_costs_total bigint;
  recurring_income_total bigint;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select v.business_id
  into selected_business_id
  from public.venues as v
  where v.id = p_venue_id
    and v.is_active = true;

  if selected_business_id is null then
    raise exception 'Venue is unavailable';
  end if;

  if extract(isodow from p_week_start) <> 1 then
    raise exception 'A weekly plan must start on Monday';
  end if;

  if jsonb_typeof(p_days) <> 'array' then
    raise exception 'Daily allocations must be a JSON array';
  end if;

  select
    count(*),
    count(distinct d.day_index),
    coalesce(sum(d.planned_labour_cents), 0),
    coalesce(sum(d.planned_other_operating_costs_cents), 0),
    coalesce(sum(d.planned_recurring_operating_income_cents), 0)
  into
    day_count,
    day_index_count,
    labour_total,
    other_costs_total,
    recurring_income_total
  from jsonb_to_recordset(p_days) as d(
    day_index smallint,
    planned_revenue_cents bigint,
    planned_labour_cents bigint,
    planned_other_operating_costs_cents bigint,
    planned_recurring_operating_income_cents bigint
  );

  if day_count <> 7 or day_index_count <> 7 then
    raise exception 'A weekly plan requires seven unique daily allocations';
  end if;

  if labour_total <> p_weekly_labour_cents
    or other_costs_total <> p_weekly_other_operating_costs_cents
    or recurring_income_total <> p_weekly_recurring_operating_income_cents
  then
    raise exception 'Daily allocations must reconcile to weekly totals';
  end if;

  update public.venue_settings
  set
    gst_registration = p_gst_registration,
    revenue_entry_basis = p_revenue_entry_basis,
    updated_by = current_user_id,
    updated_at = now()
  where venue_id = p_venue_id
    and business_id = selected_business_id;

  select a.id, a.version + 1
  into previous_assumption_id, next_assumption_version
  from public.financial_assumptions as a
  where a.venue_id = p_venue_id
    and a.kind = 'cogs-rate'
  order by a.created_at desc, a.version desc
  limit 1;

  insert into public.financial_assumptions (
    business_id, venue_id, kind, rate_basis_points, source, status,
    effective_from, operator_confirmed, confirmed_at, confirmed_by,
    version, supersedes_id, metadata, created_by
  )
  values (
    selected_business_id, p_venue_id, 'cogs-rate',
    p_cogs_rate_basis_points, 'manual', 'estimated',
    p_week_start, true, now(), current_user_id,
    coalesce(next_assumption_version, 1), previous_assumption_id,
    jsonb_build_object('entry_point', 'setup'), current_user_id
  )
  returning id into cogs_assumption_id;

  previous_assumption_id := null;
  next_assumption_version := null;
  select a.id, a.version + 1
  into previous_assumption_id, next_assumption_version
  from public.financial_assumptions as a
  where a.venue_id = p_venue_id
    and a.kind = 'weekly-labour'
  order by a.created_at desc, a.version desc
  limit 1;

  insert into public.financial_assumptions (
    business_id, venue_id, kind, amount_cents, source, status,
    effective_from, operator_confirmed, confirmed_at, confirmed_by,
    version, supersedes_id, metadata, created_by
  )
  values (
    selected_business_id, p_venue_id, 'weekly-labour',
    p_weekly_labour_cents, 'manual', 'estimated',
    p_week_start, true, now(), current_user_id,
    coalesce(next_assumption_version, 1), previous_assumption_id,
    jsonb_build_object('entry_point', 'setup'), current_user_id
  )
  returning id into labour_assumption_id;

  previous_assumption_id := null;
  next_assumption_version := null;
  select a.id, a.version + 1
  into previous_assumption_id, next_assumption_version
  from public.financial_assumptions as a
  where a.venue_id = p_venue_id
    and a.kind = 'weekly-other-operating-costs'
  order by a.created_at desc, a.version desc
  limit 1;

  insert into public.financial_assumptions (
    business_id, venue_id, kind, amount_cents, source, status,
    effective_from, operator_confirmed, confirmed_at, confirmed_by,
    version, supersedes_id, metadata, created_by
  )
  values (
    selected_business_id, p_venue_id, 'weekly-other-operating-costs',
    p_weekly_other_operating_costs_cents, 'manual', 'estimated',
    p_week_start, true, now(), current_user_id,
    coalesce(next_assumption_version, 1), previous_assumption_id,
    jsonb_build_object('entry_point', 'setup'), current_user_id
  )
  returning id into other_costs_assumption_id;

  previous_assumption_id := null;
  next_assumption_version := null;
  select a.id, a.version + 1
  into previous_assumption_id, next_assumption_version
  from public.financial_assumptions as a
  where a.venue_id = p_venue_id
    and a.kind = 'weekly-recurring-operating-income'
  order by a.created_at desc, a.version desc
  limit 1;

  insert into public.financial_assumptions (
    business_id, venue_id, kind, amount_cents, source, status,
    effective_from, operator_confirmed, confirmed_at, confirmed_by,
    version, supersedes_id, metadata, created_by
  )
  values (
    selected_business_id, p_venue_id, 'weekly-recurring-operating-income',
    p_weekly_recurring_operating_income_cents, 'manual', 'estimated',
    p_week_start, true, now(), current_user_id,
    coalesce(next_assumption_version, 1), previous_assumption_id,
    jsonb_build_object('entry_point', 'setup'), current_user_id
  )
  returning id into recurring_income_assumption_id;

  if p_loaded_hourly_labour_cost_cents is not null then
    previous_assumption_id := null;
    next_assumption_version := null;
    select a.id, a.version + 1
    into previous_assumption_id, next_assumption_version
    from public.financial_assumptions as a
    where a.venue_id = p_venue_id
      and a.kind = 'loaded-hourly-labour-cost'
    order by a.created_at desc, a.version desc
    limit 1;

    insert into public.financial_assumptions (
      business_id, venue_id, kind, amount_cents, source, status,
      effective_from, operator_confirmed, confirmed_at, confirmed_by,
      version, supersedes_id, metadata, created_by
    )
    values (
      selected_business_id, p_venue_id, 'loaded-hourly-labour-cost',
      p_loaded_hourly_labour_cost_cents, 'manual', 'estimated',
      p_week_start, true, now(), current_user_id,
      coalesce(next_assumption_version, 1), previous_assumption_id,
      jsonb_build_object('entry_point', 'setup'), current_user_id
    )
    returning id into hourly_cost_assumption_id;
  end if;

  select p.id, p.version + 1
  into previous_plan_id, next_plan_version
  from public.weekly_plans as p
  where p.venue_id = p_venue_id
    and p.week_start = p_week_start
  order by p.version desc
  limit 1;

  insert into public.weekly_plans (
    business_id,
    venue_id,
    week_start,
    version,
    status,
    gst_registration,
    revenue_entry_basis,
    cogs_rate_basis_points,
    weekly_labour_cents,
    weekly_other_operating_costs_cents,
    weekly_recurring_operating_income_cents,
    loaded_hourly_labour_cost_cents,
    assumption_snapshot,
    created_by,
    supersedes_id
  )
  values (
    selected_business_id,
    p_venue_id,
    p_week_start,
    coalesce(next_plan_version, 1),
    'draft',
    p_gst_registration,
    p_revenue_entry_basis,
    p_cogs_rate_basis_points,
    p_weekly_labour_cents,
    p_weekly_other_operating_costs_cents,
    p_weekly_recurring_operating_income_cents,
    p_loaded_hourly_labour_cost_cents,
    jsonb_build_object(
      'cogs_rate', cogs_assumption_id,
      'weekly_labour', labour_assumption_id,
      'weekly_other_operating_costs', other_costs_assumption_id,
      'weekly_recurring_operating_income', recurring_income_assumption_id,
      'loaded_hourly_labour_cost', hourly_cost_assumption_id
    ),
    current_user_id,
    previous_plan_id
  )
  returning id, version into new_plan_id, next_plan_version;

  insert into public.weekly_plan_days (
    weekly_plan_id,
    business_id,
    venue_id,
    service_date,
    day_index,
    planned_revenue_cents,
    planned_labour_cents,
    planned_other_operating_costs_cents,
    planned_recurring_operating_income_cents
  )
  select
    new_plan_id,
    selected_business_id,
    p_venue_id,
    p_week_start + d.day_index,
    d.day_index,
    d.planned_revenue_cents,
    d.planned_labour_cents,
    d.planned_other_operating_costs_cents,
    d.planned_recurring_operating_income_cents
  from jsonb_to_recordset(p_days) as d(
    day_index smallint,
    planned_revenue_cents bigint,
    planned_labour_cents bigint,
    planned_other_operating_costs_cents bigint,
    planned_recurring_operating_income_cents bigint
  )
  order by d.day_index;

  update public.weekly_plans
  set status = 'locked'
  where id = new_plan_id;

  return query select new_plan_id, next_plan_version;
end;
$$;

revoke execute on function public.save_week_plan(
  uuid, date, text, text, integer, bigint, bigint, bigint, bigint, jsonb
) from public, anon;

grant execute on function public.save_week_plan(
  uuid, date, text, text, integer, bigint, bigint, bigint, bigint, jsonb
) to authenticated, service_role;
