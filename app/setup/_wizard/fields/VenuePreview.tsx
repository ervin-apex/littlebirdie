import { assetPath } from "@/lib/site";

export function VenuePreview({
  name,
  birdeeAsset,
}: {
  name: string;
  birdeeAsset: string;
}) {
  const displayName = name.trim() || "Your venue";

  return (
    <div className="venue-preview">
      <span className="venue-preview__label">Your new venue</span>
      <div className="venue-preview__sign" aria-label={`Venue preview: ${displayName}`}>
        <i aria-hidden="true" />
        <strong>{displayName}</strong>
      </div>
      <small>Its numbers stay separate.</small>
      <div className="venue-preview__birdee" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetPath(birdeeAsset)} alt="" />
      </div>
    </div>
  );
}
