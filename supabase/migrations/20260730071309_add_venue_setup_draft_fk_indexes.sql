create index venue_setup_drafts_created_by_idx
  on public.venue_setup_drafts (created_by);

create index venue_setup_drafts_updated_by_idx
  on public.venue_setup_drafts (updated_by);

create index venue_setup_drafts_venue_business_idx
  on public.venue_setup_drafts (venue_id, business_id);
