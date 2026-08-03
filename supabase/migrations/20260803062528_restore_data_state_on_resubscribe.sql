-- A returning customer starts with a clean operational workspace after the
-- first invoice on the new subscription is confirmed paid.
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
    business_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
    status, access_state, paid_through, current_period_start,
    current_period_end, cancel_at_period_end, payment_failed_at, canceled_at,
    ended_at, last_stripe_event_id, last_stripe_event_created
  ) values (
    p_business_id, p_stripe_customer_id, p_stripe_subscription_id,
    p_stripe_price_id, p_status, p_access_state, p_paid_through,
    p_current_period_start, p_current_period_end,
    coalesce(p_cancel_at_period_end, false), p_payment_failed_at,
    p_canceled_at, p_ended_at, p_event_id, p_event_created
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
