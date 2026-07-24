"use client";

import { FormEvent, useId, useState } from "react";

type FormState = "idle" | "error" | "success";

export function VideoWaitlistForm() {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setState("error");
      return;
    }

    setState("success");
  };

  return (
    <form
      className="vlab-waitlist-form"
      data-state={state}
      onSubmit={submit}
      noValidate
    >
      <label htmlFor={emailId}>Your email</label>
      <div className="vlab-field-row">
        <input
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          aria-invalid={state === "error"}
          aria-describedby={`${emailId}-message`}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state !== "idle") setState("idle");
          }}
        />
        <button type="submit" disabled={state === "success"}>
          {state === "success" ? "You're on the list" : "Get on the list"}
        </button>
      </div>
      <p
        id={`${emailId}-message`}
        className="vlab-form-message"
        data-state={state}
        aria-live="polite"
      >
        {state === "error" && "Pop a real email in first."}
        {state === "success" && "You're in. Birdee will chirp when we're ready."}
      </p>
    </form>
  );
}
