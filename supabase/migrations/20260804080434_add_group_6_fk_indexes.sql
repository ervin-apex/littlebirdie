create index chirp_preferences_venue_business_idx
  on public.chirp_preferences (venue_id, business_id);

create index chirp_deliveries_business_id_idx
  on public.chirp_deliveries (business_id);

create index chirp_deliveries_venue_business_idx
  on public.chirp_deliveries (venue_id, business_id);
