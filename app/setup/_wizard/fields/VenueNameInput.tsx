import { Check, Storefront } from "@phosphor-icons/react";

export function VenueNameInput({
  value,
  error,
  onChange,
}: {
  value: string;
  error: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <section className="venue-name-panel">
      <label htmlFor="setup-venue-name">Venue name</label>
      <div className={`venue-name-input${error ? " has-error" : ""}`}>
        <Storefront weight="duotone" aria-hidden="true" />
        <input
          id="setup-venue-name"
          value={value}
          maxLength={160}
          autoComplete="organization"
          placeholder="e.g. Newtown"
          autoFocus
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "setup-venue-name-error" : "setup-venue-name-confirmation"}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {error ? (
        <p id="setup-venue-name-error" className="venue-name-error" role="alert">
          {error}
        </p>
      ) : (
        <p id="setup-venue-name-confirmation" className="input-confirmation">
          <span><Check weight="bold" /></span>
          {value.trim()
            ? `Nice — ${value.trim()} is ready for its numbers.`
            : "Start with the name you use every day."}
        </p>
      )}
    </section>
  );
}
