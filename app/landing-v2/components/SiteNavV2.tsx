"use client";

import Image from "next/image";
import { List, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

type SiteNavV2Props = {
  isAuthenticated: boolean;
};

const NAV_ITEMS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

export function SiteNavV2({ isAuthenticated }: SiteNavV2Props) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const firstLink = sheetRef.current?.querySelector<HTMLElement>("a");
    firstLink?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        window.requestAnimationFrame(() => toggleRef.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        sheetRef.current?.querySelectorAll<HTMLElement>("a, button") ?? [],
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.innerWidth > 820) setOpen(false);
    };
    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, []);

  const close = () => setOpen(false);
  const primaryHref = "/auth?mode=signup";
  const primaryLabel = "Create account";

  return (
    <header className="lb2-nav" aria-label="Little Birdee navigation">
      <a className="lb2-nav__brand" href="#top" aria-label="Little Birdee, top of page">
        <Image src="/brand/birdee-face-square.png" alt="" width={300} height={300} priority />
        <span>Little Birdee</span>
      </a>

      <nav className="lb2-nav__desktop" aria-label="Landing page">
        {NAV_ITEMS.map((item) => (
          <a key={item.href} href={item.href}>{item.label}</a>
        ))}
        {!isAuthenticated && <a href="/auth?mode=login">Log in</a>}
        <a className="lb2-button lb2-button--nav" href={primaryHref}>{primaryLabel}</a>
      </nav>

      <button
        ref={toggleRef}
        className="lb2-nav__toggle"
        type="button"
        aria-expanded={open}
        aria-controls="lb2-mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={23} weight="bold" aria-hidden="true" /> : <List size={23} weight="bold" aria-hidden="true" />}
      </button>

      <div
        ref={sheetRef}
        className="lb2-nav__sheet"
        id="lb2-mobile-menu"
        data-open={open}
        aria-hidden={!open}
        inert={!open}
      >
        {NAV_ITEMS.map((item) => (
          <a key={item.href} href={item.href} onClick={close}>{item.label}</a>
        ))}
        <a href="#privacy" onClick={close}>Privacy</a>
        {!isAuthenticated && <a href="/auth?mode=login" onClick={close}>Log in</a>}
        <a className="lb2-button" href={primaryHref} onClick={close}>{primaryLabel}</a>
      </div>
    </header>
  );
}
