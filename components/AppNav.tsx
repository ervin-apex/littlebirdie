"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV_ITEMS, activeNavKey } from "./app-nav";
import { withoutBasePath } from "@/lib/site";
import "./app-nav.css";

/** Bottom tab bar. Phones only - the header carries the same three items from
 *  the tablet breakpoint up. Roughly all real use is on a phone, so this is
 *  the primary navigation, not a fallback. */
export function AppNav() {
  const pathname = withoutBasePath(usePathname());
  const active = activeNavKey(pathname);

  return (
    <nav className="app-nav" aria-label="Sections">
      <ul>
        {APP_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`app-nav__item${isActive ? " is-active" : ""}`}
              >
                <Icon size={22} weight={isActive ? "fill" : "regular"} aria-hidden />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
