"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { assetPath } from "@/lib/site";

const MENU = [
  { href: "/home", label: "Home" },
  { href: "/app/connections", label: "Connections" },
  { href: "/app/billing", label: "Billing" },
  { href: "/app/admin", label: "Admin" },
];

/**
 * v3 header — slab voice: lowercase "little birdee" wordmark + bird mark on
 * the left, a single avatar button on the right (same dropdown behaviour as
 * v2's V2Header). Bottom edge is a 2px solid ink rule, not a hairline or a
 * shadow — no card chrome. Full-bleed band; the inner row carries the shell
 * + gutter so its edges line up with every other section on the page.
 */
export function V3Header() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="v3-header v3-band">
      <div className="v3-band-inner v3-header-inner" style={{ paddingBlock: 12 }}>
        <Link href="/home" className="v3-wordmark v3-focusable">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath("/brand/birdee-mark.png")} width={30} height={30} alt="" />
          <span className="v3-wordmark__text">little birdee</span>
        </Link>

        <div ref={ref} style={{ position: "relative" }}>
          <button
            type="button"
            className="v3-avatar-btn v3-focusable"
            aria-label="Open account menu"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetPath("/brand/birdee-mark.png")}
              width={22}
              height={22}
              alt=""
              style={{ objectFit: "contain" }}
            />
          </button>

          {open && (
            <div className="v3-menu" role="menu">
              {MENU.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className="v3-menu__item v3-focusable"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
