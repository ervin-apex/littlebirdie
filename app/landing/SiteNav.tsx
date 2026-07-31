"use client";

import Image from "next/image";
import { List, X } from "@phosphor-icons/react";
import { useState } from "react";

export function SiteNav({ homeHref }: { homeHref: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="lb-nav" aria-label="Little Birdee navigation">
      <a className="lb-nav__wordmark" href={homeHref} aria-label="Little Birdee home">
        <Image
          src="/brand/birdee-face-square.png"
          alt=""
          width={300}
          height={300}
          priority
        />
        <span>little birdee</span>
      </a>

      <nav className="lb-nav__links" aria-label="Landing page">
        <a className="lb-nav__link" href="#how-it-works">
          How it works
        </a>
        <a className="lb-nav__link" href="#pricing">
          Pricing
        </a>
        {/* "Create account" / "Log in" rather than invented wording — those are
            the /auth gateway's own tab labels, so the button you press and the
            tab you land on say the same thing. */}
        <a className="lb-nav__link" href="/auth?mode=login">
          Log in
        </a>
        <a className="lb-cta lb-nav__cta" href="/auth?mode=signup">
          Create account
          <span className="lb-cta__arrow" aria-hidden="true">
            ↗
          </span>
        </a>
      </nav>

      <button
        className="lb-nav__burger"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="lb-nav-sheet"
        aria-label={open ? "Close menu" : "Menu"}
      >
        {open ? (
          <X size={22} weight="bold" aria-hidden="true" />
        ) : (
          <List size={22} weight="bold" aria-hidden="true" />
        )}
      </button>

      <div
        className="lb-nav__sheet"
        id="lb-nav-sheet"
        data-open={open}
        aria-hidden={!open}
        inert={!open}
      >
          <a href="#how-it-works" onClick={() => setOpen(false)}>
            How it works
          </a>
          <a href="#pricing" onClick={() => setOpen(false)}>
            Pricing
          </a>
          <a href="#privacy" onClick={() => setOpen(false)}>
            Privacy
          </a>
          <a href="/auth?mode=login" onClick={() => setOpen(false)}>
            Log in
          </a>
          <a
            className="lb-nav__sheet-cta"
            href="/auth?mode=signup"
            onClick={() => setOpen(false)}
          >
            Create account
            <span aria-hidden="true">↗</span>
          </a>
      </div>
    </header>
  );
}
