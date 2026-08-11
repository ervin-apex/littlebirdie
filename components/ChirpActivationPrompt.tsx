"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BellRinging, X } from "@phosphor-icons/react";

type PreferenceResponse = {
  enabled?: boolean;
  promptDismissed?: boolean;
  venueName?: string;
};

export function ChirpActivationPrompt({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(false);
  const [venueName, setVenueName] = useState("this venue");
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (!active) return;
    let current = true;
    fetch("/api/chirps/preferences", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => response.ok ? response.json() as Promise<PreferenceResponse> : null)
      .then((preference) => {
        if (!current || !preference) return;
        setVenueName(preference.venueName ?? "this venue");
        setVisible(!preference.enabled && !preference.promptDismissed);
      })
      .catch(() => undefined);
    return () => { current = false; };
  }, [active]);

  async function dismiss() {
    setDismissing(true);
    try {
      await fetch("/api/chirps/preferences", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ promptDismissed: true }),
      });
    } finally {
      setVisible(false);
      setDismissing(false);
    }
  }

  if (!active || !visible) return null;
  return (
    <aside className="chirp-activation-prompt" aria-labelledby="chirp-activation-title">
      <button
        type="button"
        className="chirp-activation-close"
        onClick={dismiss}
        disabled={dismissing}
        aria-label="Do not show this Chirp prompt again"
      >
        <X weight="bold" />
      </button>
      <span className="chirp-activation-icon" aria-hidden>
        <BellRinging weight="duotone" />
      </span>
      <div>
        <p>Meet your morning Chirp</p>
        <h2 id="chirp-activation-title">Want Birdee to check in about {venueName}?</h2>
        <span>
          Get yesterday’s estimated result by email—or a gentle nudge when the actual is still missing.
        </span>
      </div>
      <Link href="/account#daily-chirps">Choose my time</Link>
      <button type="button" className="chirp-activation-later" onClick={dismiss} disabled={dismissing}>
        Not now
      </button>
    </aside>
  );
}
