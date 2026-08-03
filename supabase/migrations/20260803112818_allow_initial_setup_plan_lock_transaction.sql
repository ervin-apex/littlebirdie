-- save_week_plan creates a draft, inserts its seven days, and locks the plan
-- in one transaction. Mark that transaction when it is the venue's genuine
-- first setup so the final lock can pass the billing gate without granting
-- lasting unpaid access.

create or replace function private.initial_setup_transaction_open(
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
    and current_setting('little_birdee.initial_setup_business_id', true)
      = target_business_id::text
    and current_setting('little_birdee.initial_setup_venue_id', true)
      = target_venue_id::text
    and (select private.can_edit_venue(target_venue_id));
$$;

create or replace function private.mark_initial_setup_plan_transaction()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'draft'
    and (select private.initial_setup_open(new.business_id, new.venue_id))
  then
    perform set_config(
      'little_birdee.initial_setup_business_id',
      new.business_id::text,
      true
    );
    perform set_config(
      'little_birdee.initial_setup_venue_id',
      new.venue_id::text,
      true
    );
  end if;

  return new;
end;
$$;

drop trigger if exists weekly_plans_mark_initial_setup_transaction
on public.weekly_plans;

create trigger weekly_plans_mark_initial_setup_transaction
before insert on public.weekly_plans
for each row execute function private.mark_initial_setup_plan_transaction();

revoke all on function private.initial_setup_transaction_open(uuid, uuid)
from public, anon, authenticated, service_role;
revoke all on function private.mark_initial_setup_plan_transaction()
from public, anon, authenticated, service_role;

grant execute on function private.initial_setup_transaction_open(uuid, uuid)
to authenticated, service_role;
grant execute on function private.mark_initial_setup_plan_transaction()
to authenticated, service_role;

drop policy weekly_plans_billing_select_gate on public.weekly_plans;
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
  or (select private.initial_setup_transaction_open(business_id, venue_id))
);

drop policy weekly_plans_billing_insert_gate on public.weekly_plans;
create policy weekly_plans_billing_insert_gate
on public.weekly_plans
as restrictive for insert
to authenticated
with check (
  (select private.has_product_access(business_id))
  or (
    status = 'draft'
    and (select private.initial_setup_open(business_id, venue_id))
  )
);

drop policy weekly_plans_billing_update_gate on public.weekly_plans;
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
  or (select private.initial_setup_transaction_open(business_id, venue_id))
)
with check (
  (select private.has_product_access(business_id))
  or (
    status in ('draft', 'locked')
    and (
      (select private.initial_setup_open(business_id, venue_id))
      or (select private.initial_setup_transaction_open(business_id, venue_id))
    )
  )
);
