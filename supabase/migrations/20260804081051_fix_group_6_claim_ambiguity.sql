create or replace function public.claim_due_chirp_deliveries(
  p_now timestamptz default now(),
  p_limit integer default 25
)
returns table (
  delivery_id uuid,
  preference_id uuid,
  business_id uuid,
  venue_id uuid,
  user_id uuid,
  service_date date,
  scheduled_for timestamptz,
  attempt_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception 'p_limit must be between 1 and 100';
  end if;

  insert into public.chirp_deliveries (
    preference_id,
    business_id,
    venue_id,
    user_id,
    service_date,
    scheduled_for
  )
  select
    preference.id,
    preference.business_id,
    preference.venue_id,
    preference.user_id,
    (p_now at time zone preference.time_zone)::date - 1,
    (
      (p_now at time zone preference.time_zone)::date
      + preference.delivery_time_local
    ) at time zone preference.time_zone
  from public.chirp_preferences as preference
  join public.venues as venue
    on venue.id = preference.venue_id
    and venue.business_id = preference.business_id
    and venue.is_active = true
  where preference.enabled = true
    and (select private.has_product_access(preference.business_id))
    and (
      exists (
        select 1
        from public.business_members as business_member
        where business_member.business_id = preference.business_id
          and business_member.user_id = preference.user_id
      )
      or exists (
        select 1
        from public.venue_members as venue_member
        where venue_member.venue_id = preference.venue_id
          and venue_member.user_id = preference.user_id
      )
    )
    and (
      (
        (p_now at time zone preference.time_zone)::date
        + preference.delivery_time_local
      ) at time zone preference.time_zone
    ) <= p_now
    and (
      (
        (p_now at time zone preference.time_zone)::date
        + preference.delivery_time_local
      ) at time zone preference.time_zone
    ) > p_now - interval '15 minutes'
  on conflict on constraint chirp_deliveries_preference_id_service_date_key do nothing;

  return query
  with candidates as (
    select delivery.id
    from public.chirp_deliveries as delivery
    join public.chirp_preferences as preference
      on preference.id = delivery.preference_id
      and preference.enabled = true
    join public.venues as venue
      on venue.id = delivery.venue_id
      and venue.is_active = true
    where (
        delivery.status in ('pending', 'retryable')
        or (
          delivery.status = 'claimed'
          and delivery.claimed_at < p_now - interval '15 minutes'
        )
      )
      and coalesce(delivery.next_attempt_at, delivery.scheduled_for) <= p_now
      and delivery.attempt_count < 5
      and (select private.has_product_access(delivery.business_id))
    order by coalesce(delivery.next_attempt_at, delivery.scheduled_for), delivery.created_at
    for update of delivery skip locked
    limit p_limit
  )
  update public.chirp_deliveries as delivery
  set
    status = 'claimed',
    claimed_at = p_now,
    attempt_count = delivery.attempt_count + 1,
    next_attempt_at = null,
    last_error_code = null,
    last_error_message = null
  from candidates
  where delivery.id = candidates.id
  returning
    delivery.id,
    delivery.preference_id,
    delivery.business_id,
    delivery.venue_id,
    delivery.user_id,
    delivery.service_date,
    delivery.scheduled_for,
    delivery.attempt_count;
end;
$$;

revoke all on function public.claim_due_chirp_deliveries(timestamptz, integer)
from public, anon, authenticated, service_role;
grant execute on function public.claim_due_chirp_deliveries(timestamptz, integer)
to service_role;
