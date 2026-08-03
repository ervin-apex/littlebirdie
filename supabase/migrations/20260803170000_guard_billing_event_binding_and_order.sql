-- Stripe webhook projections must preserve the customer/subscription binding
-- established by Checkout and must not regress when delayed events arrive.
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
  existing public.business_subscriptions%rowtype;
  applied public.business_subscriptions%rowtype;
  may_replace_subscription boolean;
begin
  select * into existing
  from public.business_subscriptions
  where business_id = p_business_id
  for update;

  if not found then
    raise exception 'Billing record not prepared';
  end if;

  if existing.last_stripe_event_created is not null
    and p_event_created < existing.last_stripe_event_created then
    return existing;
  end if;

  if existing.stripe_customer_id is null
    or existing.stripe_customer_id <> p_stripe_customer_id then
    raise exception 'Stripe customer binding mismatch';
  end if;

  if existing.stripe_price_id is not null
    and existing.stripe_price_id <> p_stripe_price_id then
    raise exception 'Stripe price binding mismatch';
  end if;

  may_replace_subscription := existing.access_state = 'ended'
    and existing.data_state = 'deleted'
    and existing.status in ('canceled', 'unpaid', 'incomplete_expired');

  if existing.stripe_subscription_id is not null
    and existing.stripe_subscription_id <> p_stripe_subscription_id
    and not may_replace_subscription then
    raise exception 'Stripe subscription binding mismatch';
  end if;

  update public.business_subscriptions set
    stripe_subscription_id = p_stripe_subscription_id,
    stripe_price_id = p_stripe_price_id,
    status = p_status,
    access_state = p_access_state,
    data_state = case
      when p_status in ('active', 'trialing') and p_paid_through > now() then 'present'
      else existing.data_state
    end,
    paid_through = case
      when existing.paid_through is null then p_paid_through
      when p_paid_through is null then existing.paid_through
      else greatest(existing.paid_through, p_paid_through)
    end,
    current_period_start = p_current_period_start,
    current_period_end = p_current_period_end,
    cancel_at_period_end = coalesce(p_cancel_at_period_end, false),
    payment_failed_at = p_payment_failed_at,
    canceled_at = p_canceled_at,
    ended_at = p_ended_at,
    last_stripe_event_id = p_event_id,
    last_stripe_event_created = p_event_created
  where business_id = p_business_id
  returning * into applied;

  return applied;
end;
$$;

revoke all on function public.apply_business_subscription_event(
  uuid, text, text, text, text, text, timestamptz, timestamptz, timestamptz,
  boolean, timestamptz, timestamptz, timestamptz, text, bigint
) from public, anon, authenticated, service_role;

grant execute on function public.apply_business_subscription_event(
  uuid, text, text, text, text, text, timestamptz, timestamptz, timestamptz,
  boolean, timestamptz, timestamptz, timestamptz, text, bigint
) to service_role;
