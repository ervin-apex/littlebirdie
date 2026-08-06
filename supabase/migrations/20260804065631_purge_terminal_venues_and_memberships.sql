-- Terminal billing deletion keeps the account/business billing shell but
-- removes every operational venue and its financial records. Audit capture is
-- suppressed only inside the postgres-owned purge transaction so deleting a
-- venue cannot recreate payloads after the audit log has been cleared.

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
  if current_user = 'postgres'
    and current_setting('little_birdee.operational_purge', true) = 'on' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

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
    ) values (
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
  delete from public.venue_members where business_id = p_business_id;
  delete from public.venues where business_id = p_business_id;

  -- Run last. The audit trigger is suppressed during this transaction, so no
  -- operational payload can be recreated by the deletes above.
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
    '2026-08-04-v3'
  );

  update public.business_subscriptions
  set data_state = 'deleted'
  where business_id = p_business_id;
end;
$$;

revoke all on function public.delete_business_operational_data(uuid, text, text)
from public, anon, authenticated, service_role;

grant execute on function public.delete_business_operational_data(uuid, text, text)
to service_role;
