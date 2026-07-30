"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function GoogleAuthButton({
  next,
  onError,
}: {
  next: "/onboarding" | "/auth/finish-setup";
  onError: (message: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [providerState, setProviderState] = useState<"checking" | "available" | "unavailable">(
    "checking",
  );

  useEffect(() => {
    let active = true;

    async function checkProvider() {
      const { url, publishableKey } = getSupabaseConfig();
      try {
        const response = await fetch(`${url}/auth/v1/settings`, {
          headers: { apikey: publishableKey },
        });
        const settings = (await response.json()) as { external?: { google?: boolean } };
        if (!active) return;
        setProviderState(response.ok && settings.external?.google ? "available" : "unavailable");
      } catch {
        if (active) setProviderState("unavailable");
      }
    }

    void checkProvider();
    return () => {
      active = false;
    };
  }, []);

  async function continueWithGoogle() {
    if (providerState !== "available") return;

    setLoading(true);
    onError(null);

    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", next);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.toString(),
      },
    });

    if (error) {
      onError(error.message);
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="auth-google-button"
      onClick={continueWithGoogle}
      disabled={loading || providerState !== "available"}
      aria-busy={loading || providerState === "checking" || undefined}
      data-provider-state={providerState}
    >
      <GoogleMark />
      <span>
        {loading
          ? "Opening Google…"
          : providerState === "checking"
            ? "Checking Google…"
            : providerState === "unavailable"
              ? "Google sign-in coming soon"
              : "Continue with Google"}
      </span>
    </button>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.23-.2-1.77h-9.17v3.32h5.38a4.73 4.73 0 0 1-2 3.02l-.02.11 2.91 2.26.2.02c1.84-1.7 2.9-4.2 2.9-6.96Z"
      />
      <path
        fill="#34A853"
        d="M12.23 21.77c2.63 0 4.84-.86 6.46-2.58l-3.08-2.39a5.82 5.82 0 0 1-3.38.98 5.87 5.87 0 0 1-5.55-4.06l-.11.01-3.03 2.35-.04.1a9.76 9.76 0 0 0 8.73 5.59Z"
      />
      <path
        fill="#FBBC05"
        d="M6.68 13.72a6.02 6.02 0 0 1-.32-1.92c0-.67.12-1.32.31-1.93v-.11L3.6 7.37l-.1.05a9.78 9.78 0 0 0 0 8.77l3.18-2.47Z"
      />
      <path
        fill="#EA4335"
        d="M12.23 5.83c1.83 0 3.07.79 3.78 1.45l2.74-2.68A9.23 9.23 0 0 0 12.23 2a9.76 9.76 0 0 0-8.73 5.42l3.17 2.45a5.9 5.9 0 0 1 5.56-4.04Z"
      />
    </svg>
  );
}
