-- The setup flow now has five financial steps, plus an optional leading venue
-- name step for new venues. Keep four-step legacy drafts resumable while
-- allowing the current five- and six-step flows.
alter table public.venue_setup_drafts
  drop constraint venue_setup_drafts_total_steps,
  add constraint venue_setup_drafts_total_steps
    check (total_steps in (4, 5, 6));

-- Recurring operating income is the final financial step and can be the next
-- resumable destination after Fixed + variable costs.
alter table public.venue_setup_drafts
  drop constraint venue_setup_drafts_next_step,
  add constraint venue_setup_drafts_next_step
    check (next_step in ('venue', 'revenue', 'wages', 'cogs', 'fixed', 'income'));
