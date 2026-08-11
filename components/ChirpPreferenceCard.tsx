"use client";

import { useState, type FormEvent } from "react";
import { BellRinging, CheckCircle, Clock, EnvelopeSimple } from "@phosphor-icons/react";

export type ChirpPreferenceView = {
  venueName: string;
  enabled: boolean;
  deliveryTimeLocal: string;
  timeZone: string;
  recipientEmail: string;
  lastDeliveryStatus: string | null;
  lastServiceDate: string | null;
};

export function ChirpPreferenceCard({ initial }: { initial: ChirpPreferenceView }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [deliveryTime, setDeliveryTime] = useState(initial.deliveryTimeLocal);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/chirps/preferences", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled, deliveryTimeLocal: deliveryTime }),
      });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "Birdee could not save this preference.");
      setMessage(enabled
        ? `Daily Chirps are on for ${initial.venueName}.`
        : `Daily Chirps are off for ${initial.venueName}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Birdee could not save this preference.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="account-chirp" onSubmit={save}>
      <div className="account-chirp__icon" aria-hidden>
        <BellRinging weight="duotone" />
      </div>
      <div className="account-chirp__copy">
        <strong>Daily email Chirp</strong>
        <p>
          Birdee emails yesterday’s estimated result, or asks for the actual when it is missing.
        </p>
        <span><EnvelopeSimple aria-hidden /> {initial.recipientEmail}</span>
        <small className="account-chirp__last">
          {initial.lastDeliveryStatus && initial.lastServiceDate
            ? `Last email: ${initial.lastDeliveryStatus.replaceAll("_", " ")} · ${initial.lastServiceDate}`
            : "No daily email has been sent yet."}
        </small>
      </div>
      <label className="account-chirp__time">
        <span><Clock aria-hidden /> Send at</span>
        <input
          type="time"
          value={deliveryTime}
          onChange={(event) => setDeliveryTime(event.target.value)}
          disabled={!enabled || saving}
          required
        />
        <small>{initial.timeZone.replaceAll("_", " ")}</small>
      </label>
      <label className="account-chirp__switch">
        <input
          type="checkbox"
          role="switch"
          aria-label={`Daily email Chirps for ${initial.venueName}`}
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          disabled={saving}
        />
        <span aria-hidden />
        <b>{enabled ? "On" : "Off"}</b>
      </label>
      <button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save Chirp"}
      </button>
      {message && (
        <p className="account-chirp__message" role="status">
          <CheckCircle weight="fill" aria-hidden /> {message}
        </p>
      )}
    </form>
  );
}
