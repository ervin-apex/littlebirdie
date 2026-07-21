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
 * v4 header — lives on the canvas, not the panel. Wordmark left (bird mark +
 * "Little Birdee"), a single round avatar button right with the same
 * dropdown behaviour as v3's V3Header (data/menu items copied verbatim).
 */
export function V4Header() {
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
    <header className="v4-header">
      <Link href="/home" className="v4-header-brand v4-focusable">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetPath("/brand/birdee-mark.png")} width={20} height={20} alt="" />
        <span>Little Birdee</span>
      </Link>

      <div ref={ref} className="v4-avatar-wrap">
        <button
          type="button"
          className="v4-avatar-btn v4-focusable"
          aria-label="Open account menu"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath("/brand/birdee-mark.png")} width={16} height={16} alt="" />
        </button>

        {open && (
          <div className="v4-menu" role="menu">
            {MENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className="v4-menu-item v4-focusable"
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
