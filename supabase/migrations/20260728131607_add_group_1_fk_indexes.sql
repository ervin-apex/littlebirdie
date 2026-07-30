-- Cover every foreign key reported by the Supabase database advisor.
create index business_members_invited_by_idx
  on public.business_members (invited_by);
create index daily_actual_revisions_venue_business_idx
  on public.daily_actual_revisions (venue_id, business_id);
create index financial_assumptions_confirmed_by_idx
  on public.financial_assumptions (confirmed_by);
create index financial_assumptions_venue_business_idx
  on public.financial_assumptions (venue_id, business_id);
create index venue_members_granted_by_idx
  on public.venue_members (granted_by);
create index venue_members_venue_business_idx
  on public.venue_members (venue_id, business_id);
create index venue_settings_business_id_idx
  on public.venue_settings (business_id);
create index venue_settings_updated_by_idx
  on public.venue_settings (updated_by);
create index venue_settings_venue_business_idx
  on public.venue_settings (venue_id, business_id);
create index weekly_plan_days_venue_business_idx
  on public.weekly_plan_days (venue_id, business_id);
create index weekly_plan_days_plan_business_venue_idx
  on public.weekly_plan_days (weekly_plan_id, business_id, venue_id);
create index weekly_plans_venue_business_idx
  on public.weekly_plans (venue_id, business_id);
