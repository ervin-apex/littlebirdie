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
 * Minimal header for the v2 dashboard: bird mark + wordmark on the left,
 * a single avatar/menu button on the right (Home / Connections / Billing /
 * Admin live behind it — no other nav links visible). Solid paper surface,
 * no blur, hairline border, single ambient shadow.
 *
 * Note: this route still nests under app/app/layout.tsx (which renders the
 * existing BrandHeader + textured PageBackground above this component) —
 * per the task constraints only files under app/app/v2/ and components/v2/
 * may be created, and Next.js layouts always compose with their parents, so
 * there is no way to fully suppress the inherited chrome without editing
 * app/app/layout.tsx (out of scope here). This header is v2's own primary
 * nav surface per spec; see the final report for the full caveat.
 */
export function V2Header() {
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
    <header className="v2-header">
      <Link href="/home" className="v2-header__brand v2-focusable">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetPath("/brand/birdee-mark.png")} width={28} height={28} alt="" />
        <span className="v2-title">Little Birdee</span>
      </Link>

      <div ref={ref} style={{ position: "relative" }}>
        <button
          type="button"
          className="v2-avatar-btn v2-focusable"
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
          <div className="v2-menu" role="menu">
            {MENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className="v2-menu__item v2-focusable"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
