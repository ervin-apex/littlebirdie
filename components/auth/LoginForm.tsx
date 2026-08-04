"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { ProductButton } from "@/components/ProductButton";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({
  email,
  initialMessage,
  onEmailChange,
  onSwitchToSignup,
}: {
  email?: string;
  initialMessage?: string;
  onEmailChange?: (email: string) => void;
  onSwitchToSignup?: () => void;
} = {}) {
  const [message, setMessage] = useState<string | null>(initialMessage ?? null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    window.location.assign("/auth/finish-setup");
  }

  return (
    <>
      <div className="auth-card-heading">
        <h2>Welcome back</h2>
        <p>Log in and Birdee will take you straight to your numbers.</p>
      </div>
      <GoogleAuthButton next="/auth/finish-setup" onError={setMessage} />
      <div className="auth-divider"><span>or use email</span></div>
      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => onEmailChange?.(event.target.value)}
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {message && <p className="auth-message is-error" role="alert">{message}</p>}
        <ProductButton
          type="submit"
          variant="primary"
          fullWidth
          state={loading ? "loading" : undefined}
          trailingIcon={<ArrowRight weight="bold" />}
        >
          {loading ? "Opening your numbers…" : "Open my numbers"}
        </ProductButton>
      </form>
      <div className="auth-links">
        <Link href="/auth/forgot-password">Forgot password?</Link>
        <span>
          New here? {" "}
          {onSwitchToSignup ? (
            <button type="button" className="auth-inline-switch" onClick={onSwitchToSignup}>
              Create an account
            </button>
          ) : (
            <Link href="/auth?mode=signup">Create an account</Link>
          )}
        </span>
      </div>
    </>
  );
}
