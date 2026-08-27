"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { ProductButton } from "@/components/ProductButton";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { createClient } from "@/lib/supabase/client";

export function CreateAccountForm({
  email,
  onEmailChange,
  onSwitchToLogin,
}: {
  email?: string;
  onEmailChange?: (email: string) => void;
  onSwitchToLogin?: () => void;
} = {}) {
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const displayName = String(form.get("displayName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (password.length < 8) {
      setMessage("Use at least 8 characters for your password.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      window.location.assign("/onboarding");
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="auth-success" role="status">
        <span aria-hidden>✉</span>
        <h2>Check your email</h2>
        <p>Use the confirmation link to finish setting up your business.</p>
        {onSwitchToLogin ? (
          <button type="button" className="auth-inline-switch" onClick={onSwitchToLogin}>
            Back to login
          </button>
        ) : (
          <Link href="/auth?mode=login">Back to login</Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="auth-card-heading">
        <h2>First, make it yours.</h2>
        <p>Create an account so Birdee can keep your numbers in the right place.</p>
      </div>
      <GoogleAuthButton next="/onboarding" onError={setMessage} />
      <div className="auth-divider"><span>or use email</span></div>
      <form className="auth-form" onSubmit={submit}>
        <div className="auth-field-pair">
          <label>
            <span>Your name</span>
            <input name="displayName" autoComplete="name" required />
          </label>
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
        </div>
        <label>
          <span>Password</span>
          <input name="password" type="password" autoComplete="new-password" minLength={8} required />
          <small>Use at least 8 characters.</small>
        </label>
        {message && <p className="auth-message is-error" role="alert">{message}</p>}
        <ProductButton
          type="submit"
          variant="primary"
          fullWidth
          state={loading ? "loading" : undefined}
          trailingIcon={<ArrowRight weight="bold" />}
        >
          {loading ? "Creating your Little Birdee…" : "Create my Little Birdee"}
        </ProductButton>
      </form>
      <div className="auth-links">
        <span>
          Already have an account?{" "}
          {onSwitchToLogin ? (
            <button type="button" className="auth-inline-switch" onClick={onSwitchToLogin}>
              Log in
            </button>
          ) : (
            <Link href="/auth?mode=login">Log in</Link>
          )}
        </span>
      </div>
    </>
  );
}
