-- Local development seed. Runs automatically on `supabase db reset`.
--
-- Gives you a signed-in-ready account with a locked weekly budget for the
-- CURRENT week and actuals recorded for every day before today, so the
-- dashboard, check-in and reporting screens all have believable data without
-- touching the production project.
--
--   email     test@littlebirdee.local
--   password  password123
--
-- Everything here is invented. Never point this at a real project.

-- ---------------------------------------------------------------------------
-- 1. The account. Inserting into auth.users fires
--    private.handle_new_user_account(), which provisions the profile,
--    business, venue and both membership rows from raw_user_meta_data.
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'test@littlebirdee.local',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'display_name', 'Test Operator',
    'business_name', 'Test Group',
    'venue_name', 'Test Venue'
  ),
  now(),
  now(),
  '', '', '', ''
);

-- GoTrue needs a matching identity row before email/password sign-in works.
insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  jsonb_build_object(
    'sub', '11111111-1111-1111-1111-111111111111',
    'email', 'test@littlebirdee.local',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now(),
  now()
);

-- Skip the onboarding screen: the trigger already named the business and venue.
update public.profiles
set onboarding_completed_at = now()
where id = '11111111-1111-1111-1111-111111111111';

-- ---------------------------------------------------------------------------
-- 2. A locked weekly budget for the current week.
--    Weekly costs are apportioned to each day by that day's share of weekly
--    revenue, which is how the app itself allocates them.
-- ---------------------------------------------------------------------------

do $$
declare
  v_user        uuid := '11111111-1111-1111-1111-111111111111';
  v_business    uuid;
  v_venue       uuid;
  v_plan        uuid;
  v_week_start  date := date_trunc('week', current_date)::date;  -- Monday
  v_week_rev    bigint;
  -- Mon..Sun expected revenue, GST inclusive, in cents
  v_day_rev     bigint[] := array[240000, 260000, 280000, 310000, 420000, 480000, 360000];
  v_labour      bigint := 740000;   -- $7,400 across the week
  v_other       bigint := 480000;   -- $4,800 across the week
  v_cogs_bp     integer := 3200;    -- 32%
  i             integer;
  v_snapshot    uuid;
  v_actual_rev  bigint;
begin
  select id into v_business from public.businesses where owner_user_id = v_user;
  select id into v_venue    from public.venues where business_id = v_business limit 1;

  select sum(x) into v_week_rev from unnest(v_day_rev) as x;

  -- Days can only be written while the plan is a draft; the guard rejects
  -- edits once it is locked.
  insert into public.weekly_plans (
    business_id, venue_id, week_start, version, status,
    gst_registration, revenue_entry_basis, cogs_rate_basis_points,
    weekly_labour_cents, weekly_other_operating_costs_cents,
    weekly_recurring_operating_income_cents, assumption_snapshot, created_by
  )
  values (
    v_business, v_venue, v_week_start, 1, 'draft',
    'registered-fully-taxable', 'gst-inclusive', v_cogs_bp,
    v_labour, v_other, 0, '{}'::jsonb, v_user
  )
  returning id into v_plan;

  for i in 1..7 loop
    insert into public.weekly_plan_days (
      weekly_plan_id, business_id, venue_id, service_date, day_index,
      planned_revenue_cents, planned_labour_cents,
      planned_other_operating_costs_cents, planned_recurring_operating_income_cents
    )
    values (
      v_plan, v_business, v_venue, v_week_start + (i - 1), i - 1,
      v_day_rev[i],
      round(v_labour * v_day_rev[i]::numeric / v_week_rev),
      round(v_other  * v_day_rev[i]::numeric / v_week_rev),
      0
    );
  end loop;

  update public.weekly_plans
  set status = 'locked', locked_at = now()
  where id = v_plan;

  -- -------------------------------------------------------------------------
  -- 3. Actuals for every day already finished, a little either side of budget
  --    so the dashboard shows a mix of ahead and behind.
  -- -------------------------------------------------------------------------
  for i in 1..7 loop
    exit when v_week_start + (i - 1) >= current_date;

    select id into v_snapshot
    from public.weekly_plan_days
    where weekly_plan_id = v_plan and day_index = i - 1;

    -- alternate roughly +6% / -4% against budget
    v_actual_rev := round(v_day_rev[i] * (case when i % 2 = 1 then 1.06 else 0.96 end));

    insert into public.daily_actual_revisions (
      business_id, venue_id, service_date, revision,
      entered_revenue_cents, revenue_entry_basis, gst_registration,
      revenue_source, revenue_status,
      labour_cents, labour_source, labour_status,
      cogs_rate_basis_points, other_operating_costs_cents,
      recurring_operating_income_cents, plan_day_snapshot_id, created_by
    )
    values (
      v_business, v_venue, v_week_start + (i - 1), 1,
      v_actual_rev, 'gst-inclusive', 'registered-fully-taxable',
      'manual', 'confirmed',
      round(v_labour * v_day_rev[i]::numeric / v_week_rev), 'allocated-budget', 'estimated',
      v_cogs_bp,
      round(v_other * v_day_rev[i]::numeric / v_week_rev),
      0, v_snapshot, v_user
    );
  end loop;

  raise notice 'Seeded % (venue %) with a locked budget for week starting %',
    'test@littlebirdee.local', v_venue, v_week_start;
end $$;
