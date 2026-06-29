"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarBlank,
  CaretDown,
  CreditCard,
  House,
  PlugsConnected,
  UsersThree,
} from "@phosphor-icons/react";
import { assetPath, withoutBasePath } from "@/lib/site";

const NAV = [
  { href: "/home", label: "Home", icon: House },
  { href: "/app/connections", label: "Connections", icon: PlugsConnected },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
  { href: "/app/admin", label: "Admin", icon: UsersThree },
];

/**
 * Floating brand header used across the in-app screens (home, period selector,
 * dashboard). Wordmark + nav (labels show on lg+, icons on mobile) + a "this
 * week" pill that jumps to the period selector (hidden on the smallest screens).
 */
export function BrandHeader() {
  const pathname = withoutBasePath(usePathname());

  return (
    <header className="flex items-center justify-between gap-2 rounded-2xl bg-white/90 px-3 py-2.5 shadow-[0_12px_34px_-20px_rgba(15,23,42,0.4)] backdrop-blur sm:px-4">
      <Link href="/home" className="flex shrink-0 items-center gap-2 pl-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetPath("/brand/birdee-mark.png")} width={26} height={26} alt="" />
        <span className="font-display text-[16px] font-semibold sm:text-[17px]">
          <span className="text-ink">Little </span>
          <span className="text-amber-500">Birdee</span>
        </span>
      </Link>

      <div className="flex items-center gap-0.5 sm:gap-1">
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-amber-100 text-amber-900"
                    : "text-ink/60 hover:bg-black/[0.04] hover:text-ink"
                }`}
              >
                <Icon size={18} weight={active ? "fill" : "regular"} />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          href="/profit"
          className="ml-0.5 hidden items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-[13px] font-medium text-ink/70 transition-colors hover:bg-amber-100 sm:inline-flex"
        >
          <CalendarBlank size={16} weight="bold" className="text-amber-600" />
          <span className="hidden md:inline">Week of 23 to 29 Jun</span>
          <span className="md:hidden">This week</span>
          <CaretDown size={13} weight="bold" className="text-ink/40" />
        </Link>
      </div>
    </header>
  );
}
