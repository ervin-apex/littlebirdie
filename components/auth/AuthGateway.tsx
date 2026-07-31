"use client";

import Link from "next/link";
import { useEffect, useState, type KeyboardEvent } from "react";
import { AuthBirdee } from "@/components/auth/AuthBirdee";
import { CreateAccountForm } from "@/components/auth/CreateAccountForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { assetPath, BRAND_LOGO_PATH } from "@/lib/site";

export type AuthGatewayMode = "signup" | "login";

export function AuthGateway({
  initialMode,
  loginMessage,
}: {
  initialMode: AuthGatewayMode;
  loginMessage?: string;
}) {
  const [mode, setMode] = useState<AuthGatewayMode>(initialMode);
  const [email, setEmail] = useState("");
  const [visibleLoginMessage, setVisibleLoginMessage] = useState(loginMessage);
  const [animatePanel, setAnimatePanel] = useState(true);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    function syncModeFromHistory() {
      const requestedMode = new URL(window.location.href).searchParams.get("mode");
      setMode(requestedMode === "login" ? "login" : "signup");
    }

    window.addEventListener("popstate", syncModeFromHistory);
    return () => window.removeEventListener("popstate", syncModeFromHistory);
  }, []);

  useEffect(() => {
    if (animatePanel) return;

    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setAnimatePanel(true));
    });
    return () => window.cancelAnimationFrame(firstFrame);
  }, [animatePanel, mode]);

  function selectMode(nextMode: AuthGatewayMode, options: { animate?: boolean } = {}) {
    setAnimatePanel(options.animate ?? true);
    setMode(nextMode);
    setVisibleLoginMessage(undefined);

    const url = new URL(window.location.href);
    const currentMode = url.searchParams.get("mode") === "login" ? "login" : "signup";
    url.searchParams.set("mode", nextMode);
    url.searchParams.delete("error");
    if (currentMode !== nextMode) {
      window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }

  function moveBetweenTabs(event: KeyboardEvent<HTMLElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();

    const nextMode =
      event.key === "Home"
        ? "signup"
        : event.key === "End"
          ? "login"
          : mode === "signup"
            ? "login"
            : "signup";
    document.getElementById(`auth-${nextMode}-tab`)?.focus();
    selectMode(nextMode, { animate: false });
  }

  return (
    <main className="auth-gateway">
      <section className="auth-gateway__promise" aria-labelledby="auth-promise-title">
        <Link href="/" className="auth-gateway__brand" aria-label="Little Birdee home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath(BRAND_LOGO_PATH)} width={42} height={42} alt="" />
          <span>Little Birdee</span>
        </Link>

        <div className="auth-gateway__promise-copy">
          <p className="auth-gateway__eyebrow">Your profit companion</p>
          <h1 id="auth-promise-title">Improve yr profit.</h1>
          <p className="auth-gateway__lede">
            See your profit before and as it happens — using the numbers already in your business.
          </p>
          <div className="auth-gateway__proof">
            <strong>5 min a week</strong>
            <span aria-hidden>·</span>
            <strong>$12 AUD</strong>
            <span>That’s it.</span>
          </div>
        </div>

        <p className="auth-gateway__operator-note">Made by operators, for operators.</p>
      </section>

      <section className="auth-gateway__stage" aria-label="Account access">
        <div className="auth-gateway__card-wrap">
          <div className="auth-gateway__perch" aria-hidden>
            <AuthBirdee />
          </div>

          <div className="auth-gateway__card">
            <div className="auth-gateway__tabs" role="tablist" aria-label="Choose account action">
              <Link
                id="auth-signup-tab"
                href="/auth?mode=signup"
                scroll={false}
                role="tab"
                aria-selected={mode === "signup"}
                aria-controls="auth-form-panel"
                tabIndex={mode === "signup" ? 0 : -1}
                onClick={(event) => {
                  event.preventDefault();
                  selectMode("signup");
                }}
                onKeyDown={moveBetweenTabs}
              >
                Create account
              </Link>
              <Link
                id="auth-login-tab"
                href="/auth?mode=login"
                scroll={false}
                role="tab"
                aria-selected={mode === "login"}
                aria-controls="auth-form-panel"
                tabIndex={mode === "login" ? 0 : -1}
                onClick={(event) => {
                  event.preventDefault();
                  selectMode("login");
                }}
                onKeyDown={moveBetweenTabs}
              >
                Log in
              </Link>
            </div>

            <div
              id="auth-form-panel"
              className={`auth-gateway__form-panel${animatePanel ? "" : " is-instant"}`}
              role="tabpanel"
              aria-labelledby={mode === "signup" ? "auth-signup-tab" : "auth-login-tab"}
              key={mode}
            >
              {mode === "signup" ? (
                <CreateAccountForm
                  email={email}
                  onEmailChange={setEmail}
                  onSwitchToLogin={() => selectMode("login")}
                />
              ) : (
                <LoginForm
                  email={email}
                  initialMessage={visibleLoginMessage}
                  onEmailChange={setEmail}
                  onSwitchToSignup={() => selectMode("signup")}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
