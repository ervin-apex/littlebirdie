-- Record or correct one day's manually entered revenue while preserving the
-- locked plan-day snapshot used for the original comparison. Labour stays an
-- estimated allocation until a roster integration supplies a stronger source.
-- SECURITY INVOKER keeps the existing table grants and RLS policies authoritative.

create or replace function public.save_daily_actual_revenue(
  p_venue_id uuid,
  p_service_date date,
  p_entered_revenue_cents bigint
)
returns table (actual_revision_id uuid, actual_revision integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  selected_business_id uuid;
  selected_time_zone text;
  local_today date;
  previous_revision public.daily_actual_revisions%rowtype;
  selected_plan_day public.weekly_plan_days%rowtype;
  selected_plan public.weekly_plans%rowtype;
  next_revision integer;
  inserted_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_entered_revenue_cents is null or p_entered_revenue_cents < 0 then
    raise exception 'Revenue must be zero or greater';
  end if;

  select v.business_id, v.time_zone
  into selected_business_id, selected_time_zone
  from public.venues as v
  where v.id = p_venue_id
    and v.is_active = true;

  if selected_business_id is null then
    raise exception 'Venue is unavailable';
  end if;

  if not (select private.can_edit_venue(p_venue_id)) then
    raise exception 'You cannot edit this venue';
  end if;

  local_today := (now() at time zone selected_time_zone)::date;
  if p_service_date > local_today then
    raise exception 'Future revenue cannot be recorded';
  end if;

  -- Serialise revisions for a venue and service date, including the first insert.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_venue_id::text || ':' || p_service_date::text, 0)
  );

  select r.*
  into previous_revision
  from public.daily_actual_revisions as r
  where r.venue_id = p_venue_id
    and r.service_date = p_service_date
  order by r.revision desc
  limit 1;

  if previous_revision.id is not null then
    select d.*
    into selected_plan_day
    from public.weekly_plan_days as d
    where d.id = previous_revision.plan_day_snapshot_id;

    if selected_plan_day.id is null then
      raise exception 'The original plan snapshot is unavailable';
    end if;

    next_revision := previous_revision.revision + 1;

    insert into public.daily_actual_revisions (
      business_id,
      venue_id,
      service_date,
      revision,
      entered_revenue_cents,
      revenue_entry_basis,
      gst_registration,
      revenue_source,
      revenue_status,
      labour_cents,
      labour_source,
      labour_status,
      cogs_rate_basis_points,
      other_operating_costs_cents,
      recurring_operating_income_cents,
      plan_day_snapshot_id,
      supersedes_id,
      source_updated_at,
      created_by
    )
    values (
      previous_revision.business_id,
      previous_revision.venue_id,
      previous_revision.service_date,
      next_revision,
      p_entered_revenue_cents,
      previous_revision.revenue_entry_basis,
      previous_revision.gst_registration,
      'manual',
      'confirmed',
      coalesce(
        previous_revision.labour_cents,
        selected_plan_day.planned_labour_cents
      ),
      coalesce(previous_revision.labour_source, 'allocated-budget'),
      coalesce(previous_revision.labour_status, 'estimated'),
      previous_revision.cogs_rate_basis_points,
      previous_revision.other_operating_costs_cents,
      previous_revision.recurring_operating_income_cents,
      previous_revision.plan_day_snapshot_id,
      previous_revision.id,
      now(),
      current_user_id
    )
    returning id into inserted_id;
  else
    select d.*
    into selected_plan_day
    from public.weekly_plan_days as d
    join public.weekly_plans as p on p.id = d.weekly_plan_id
    where d.venue_id = p_venue_id
      and d.service_date = p_service_date
      and p.status = 'locked'
    order by p.version desc
    limit 1;

    if selected_plan_day.id is null then
      raise exception 'No locked weekly plan covers this date';
    end if;

    select p.*
    into selected_plan
    from public.weekly_plans as p
    where p.id = selected_plan_day.weekly_plan_id;

    if selected_plan.id is null then
      raise exception 'The locked weekly plan is unavailable';
    end if;

    next_revision := 1;

    insert into public.daily_actual_revisions (
      business_id,
      venue_id,
      service_date,
      revision,
      entered_revenue_cents,
      revenue_entry_basis,
      gst_registration,
      revenue_source,
      revenue_status,
      labour_cents,
      labour_source,
      labour_status,
      cogs_rate_basis_points,
      other_operating_costs_cents,
      recurring_operating_income_cents,
      plan_day_snapshot_id,
      supersedes_id,
      source_updated_at,
      created_by
    )
    values (
      selected_business_id,
      p_venue_id,
      p_service_date,
      next_revision,
      p_entered_revenue_cents,
      selected_plan.revenue_entry_basis,
      selected_plan.gst_registration,
      'manual',
      'confirmed',
      selected_plan_day.planned_labour_cents,
      'allocated-budget',
      'estimated',
      selected_plan.cogs_rate_basis_points,
      selected_plan_day.planned_other_operating_costs_cents,
      selected_plan_day.planned_recurring_operating_income_cents,
      selected_plan_day.id,
      null,
      now(),
      current_user_id
    )
    returning id into inserted_id;
  end if;

  return query select inserted_id, next_revision;
end;
$$;

revoke execute on function public.save_daily_actual_revenue(
  uuid, date, bigint
) from public, anon;

grant execute on function public.save_daily_actual_revenue(
  uuid, date, bigint
) to authenticated, service_role;
