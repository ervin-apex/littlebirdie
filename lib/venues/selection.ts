export function resolveSelectedVenueId<T extends { id: string }>(
  venues: T[],
  requestedVenueId?: string,
) {
  return venues.some((venue) => venue.id === requestedVenueId)
    ? requestedVenueId!
    : venues[0]?.id ?? null;
}
