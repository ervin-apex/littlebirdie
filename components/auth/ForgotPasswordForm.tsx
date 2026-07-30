"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ProductButton } from "@/components/ProductButton";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <>
      <div className="auth-card-heading">
        <h2>{sent ? "Check your email" : "Reset your password"}</h2>
        <p>
          {sent
            ? "If that email has a Little Birdee account, a reset link will arrive shortly."
            : "Enter the email used for Little Birdee."}
        </p>
      </div>
      {!sent && (
        <form className="auth-form" onSubmit={submit}>
          <label>
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          {message && <p className="auth-message is-error" role="alert">{message}</p>}
          <ProductButton type="submit" variant="primary" fullWidth state={loading ? "loading" : undefined}>
            {loading ? "Sending reset link…" : "Send reset link"}
          </ProductButton>
        </form>
      )}
      <div className="auth-links">
        <Link href="/auth/login">Back to login</Link>
      </div>
    </>
  );
}
