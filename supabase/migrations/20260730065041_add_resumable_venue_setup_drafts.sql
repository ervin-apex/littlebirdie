create table public.venue_setup_drafts (
  venue_id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  week jsonb not null,
  completed_steps smallint not null,
  total_steps smallint not null,
  next_step text not null,
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (venue_id, business_id)
    references public.venues (id, business_id) on delete cascade,
  constraint venue_setup_drafts_week_object
    check (jsonb_typeof(week) = 'object'),
  constraint venue_setup_drafts_total_steps
    check (total_steps in (4, 5)),
  constraint venue_setup_drafts_completed_steps
    check (completed_steps between 1 and total_steps - 1),
  constraint venue_setup_drafts_next_step
    check (next_step in ('venue', 'revenue', 'wages', 'cogs', 'fixed'))
);

create index venue_setup_drafts_business_id_idx
  on public.venue_setup_drafts (business_id);

create trigger venue_setup_drafts_touch_updated_at
before update on public.venue_setup_drafts
for each row execute function private.touch_updated_at();

create or replace function private.guard_venue_setup_draft_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.venue_id <> old.venue_id
    or new.business_id <> old.business_id
    or new.created_by <> old.created_by
    or new.created_at <> old.created_at
  then
    raise exception 'Setup draft identity fields are immutable';
  end if;
  return new;
end;
$$;

create trigger venue_setup_drafts_guard_identity
before update on public.venue_setup_drafts
for each row execute function private.guard_venue_setup_draft_identity();

alter table public.venue_setup_drafts enable row level security;

create policy venue_setup_drafts_select_allowed
on public.venue_setup_drafts for select
to authenticated
using ((select private.can_access_venue(venue_id)));

create policy venue_setup_drafts_insert_editor
on public.venue_setup_drafts for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and (select private.can_edit_venue(venue_id))
);

create policy venue_setup_drafts_update_editor
on public.venue_setup_drafts for update
to authenticated
using ((select private.can_edit_venue(venue_id)))
with check (
  updated_by = (select auth.uid())
  and (select private.can_edit_venue(venue_id))
);

create policy venue_setup_drafts_delete_editor
on public.venue_setup_drafts for delete
to authenticated
using ((select private.can_edit_venue(venue_id)));

revoke all privileges on public.venue_setup_drafts from anon, authenticated;
grant select, insert, update, delete on public.venue_setup_drafts to authenticated;

create or replace function private.clear_venue_setup_draft_after_plan_lock()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.status = 'draft' and new.status = 'locked' then
    delete from public.venue_setup_drafts
    where venue_id = new.venue_id;
  end if;
  return new;
end;
$$;

create trigger weekly_plans_clear_setup_draft
after update of status on public.weekly_plans
for each row
when (old.status = 'draft' and new.status = 'locked')
execute function private.clear_venue_setup_draft_after_plan_lock();
