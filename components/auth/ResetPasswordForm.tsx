"use client";

import { useState, type FormEvent } from "react";
import { ProductButton } from "@/components/ProductButton";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");

    if (password.length < 8) {
      setMessage("Use at least 8 characters for your password.");
      return;
    }

    if (password !== confirmation) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    window.location.assign("/app?period=this-week");
  }

  return (
    <>
      <div className="auth-card-heading">
        <h2>Choose a new password</h2>
        <p>Use at least 8 characters.</p>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>New password</span>
          <input name="password" type="password" autoComplete="new-password" minLength={8} required />
        </label>
        <label>
          <span>Confirm password</span>
          <input name="confirmation" type="password" autoComplete="new-password" minLength={8} required />
        </label>
        {message && <p className="auth-message is-error" role="alert">{message}</p>}
        <ProductButton type="submit" variant="primary" fullWidth state={loading ? "loading" : undefined}>
          {loading ? "Saving password…" : "Save new password"}
        </ProductButton>
      </form>
    </>
  );
}
