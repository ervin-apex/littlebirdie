-- Supabase may initialize new public tables with broad Data API grants.
-- RLS remains the row-level boundary, but the application also uses explicit
-- least-privilege table grants so anonymous clients have no financial access.

revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.businesses to authenticated;
grant select, insert, update, delete on public.business_members to authenticated;
grant select, insert, update on public.venues to authenticated;
grant select, insert, update, delete on public.venue_members to authenticated;
grant select, insert, update on public.venue_settings to authenticated;
grant select, insert on public.financial_assumptions to authenticated;
grant select, insert, update, delete on public.weekly_plans to authenticated;
grant select, insert, update, delete on public.weekly_plan_days to authenticated;
grant select, insert on public.daily_actual_revisions to authenticated;
grant select on public.audit_events to authenticated;

revoke execute on function public.bootstrap_account(text, text, text, text)
from public, anon;
grant execute on function public.bootstrap_account(text, text, text, text)
to authenticated, service_role;
