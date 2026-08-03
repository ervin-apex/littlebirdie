-- Keep tenant membership as the first RLS boundary, then require an active
-- paid period for financial data. The only exception is the first venue setup,
-- before that venue has ever locked a weekly plan.

create or replace function private.has_product_access(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_subscriptions as subscription
    where subscription.business_id = target_business_id
      and subscription.data_state = 'present'
      and subscription.paid_through > now()
      and subscription.status in ('active', 'trialing', 'past_due', 'canceled')
  );
$$;

create or replace function private.initial_setup_open(
  target_business_id uuid,
  target_venue_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and (select private.can_edit_venue(target_venue_id))
    and exists (
      select 1
      from public.venues as venue
      where venue.id = target_venue_id
        and venue.business_id = target_business_id
        and venue.is_active = true
    )
    and not exists (
      select 1
      from public.weekly_plans as plan
      where plan.venue_id = target_venue_id
        and plan.status = 'locked'
    );
$$;

create or replace function public.can_start_initial_setup(p_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select private.initial_setup_open(venue.business_id, venue.id)
    from public.venues as venue
    where venue.id = p_venue_id
      and venue.is_active = true
  ), false);
$$;

revoke all on function private.has_product_access(uuid)
from public, anon, authenticated, service_role;
revoke all on function private.initial_setup_open(uuid, uuid)
from public, anon, authenticated, service_role;
revoke all on function public.can_start_initial_setup(uuid)
from public, anon, authenticated, service_role;

grant execute on function private.has_product_access(uuid)
to authenticated, service_role;
grant execute on function private.initial_setup_open(uuid, uuid)
to authenticated, service_role;
grant execute on function public.can_start_initial_setup(uuid)
to authenticated, service_role;

create policy financial_assumptions_billing_select_gate
on public.financial_assumptions
as restrictive for select
to authenticated
using (
  (select private.has_product_access(business_id))
  or (select private.initial_setup_open(business_id, venue_id))
);

create policy financial_assumptions_billing_insert_gate
on public.financial_assumptions
as restrictive for insert
to authenticated
with check (
  (select private.has_product_access(business_id))
  or (select private.initial_setup_open(business_id, venue_id))
);

create policy weekly_plans_billing_select_gate
on public.weekly_plans
as restrictive for select
to authenticated
using (
  (select private.has_product_access(business_id))
  or (
    status = 'draft'
    and (select private.initial_setup_open(business_id, venue_id))
  )
);

create policy weekly_plans_billing_insert_gate
on public.weekly_plans
as restrictive for insert
to authenticated
with check (
  (select private.has_product_access(business_id))
  or (select private.initial_setup_open(business_id, venue_id))
);

create policy weekly_plans_billing_update_gate
on public.weekly_plans
as restrictive for update
to authenticated
using (
  (select private.has_product_access(business_id))
  or (
    status = 'draft'
    and (select private.initial_setup_open(business_id, venue_id))
  )
)
with check (
  (select private.has_product_access(business_id))
  or (
    status in ('draft', 'locked')
    and (select private.initial_setup_open(business_id, venue_id))
  )
);

create policy weekly_plans_billing_delete_gate
on public.weekly_plans
as restrictive for delete
to authenticated
using (
  (select private.has_product_access(business_id))
  or (
    status = 'draft'
    and (select private.initial_setup_open(business_id, venue_id))
  )
);

create policy weekly_plan_days_billing_select_gate
on public.weekly_plan_days
as restrictive for select
to authenticated
using (
  (select private.has_product_access(business_id))
  or (select private.initial_setup_open(business_id, venue_id))
);

create policy weekly_plan_days_billing_insert_gate
on public.weekly_plan_days
as restrictive for insert
to authenticated
with check (
  (select private.has_product_access(business_id))
  or (select private.initial_setup_open(business_id, venue_id))
);

create policy weekly_plan_days_billing_update_gate
on public.weekly_plan_days
as restrictive for update
to authenticated
using (
  (select private.has_product_access(business_id))
  or (select private.initial_setup_open(business_id, venue_id))
)
with check (
  (select private.has_product_access(business_id))
  or (select private.initial_setup_open(business_id, venue_id))
);

create policy weekly_plan_days_billing_delete_gate
on public.weekly_plan_days
as restrictive for delete
to authenticated
using (
  (select private.has_product_access(business_id))
  or (select private.initial_setup_open(business_id, venue_id))
);

create policy daily_actual_revisions_billing_select_gate
on public.daily_actual_revisions
as restrictive for select
to authenticated
using ((select private.has_product_access(business_id)));

create policy daily_actual_revisions_billing_insert_gate
on public.daily_actual_revisions
as restrictive for insert
to authenticated
with check ((select private.has_product_access(business_id)));

create policy venue_setup_drafts_billing_select_gate
on public.venue_setup_drafts
as restrictive for select
to authenticated
using (
  (select private.has_product_access(business_id))
  or (select private.initial_setup_open(business_id, venue_id))
);

create policy venue_setup_drafts_billing_insert_gate
on public.venue_setup_drafts
as restrictive for insert
to authenticated
with check (
  (select private.has_product_access(business_id))
  or (select private.initial_setup_open(business_id, venue_id))
);

create policy venue_setup_drafts_billing_update_gate
on public.venue_setup_drafts
as restrictive for update
to authenticated
using (
  (select private.has_product_access(business_id))
  or (select private.initial_setup_open(business_id, venue_id))
)
with check (
  (select private.has_product_access(business_id))
  or (select private.initial_setup_open(business_id, venue_id))
);

create policy audit_events_billing_select_gate
on public.audit_events
as restrictive for select
to authenticated
using ((select private.has_product_access(business_id)));
