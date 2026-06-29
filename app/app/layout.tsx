"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, PlugsConnected, CreditCard, UsersThree } from "@phosphor-icons/react";
import { PageBackground } from "@/components/PageBackground";
import { assetPath, withoutBasePath } from "@/lib/site";

const NAV = [
  { href: "/home", label: "Home", icon: House },
  { href: "/app/connections", label: "Connections", icon: PlugsConnected },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
  { href: "/app/admin", label: "Admin", icon: UsersThree },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = withoutBasePath(usePathname());

  return (
    <div className="relative flex min-h-[100dvh] flex-col text-ink">
      <PageBackground faint />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pt-5 sm:px-6">
        <header className="flex items-center justify-between gap-2 rounded-2xl bg-white/90 px-3 py-2.5 shadow-[0_12px_34px_-20px_rgba(15,23,42,0.4)] backdrop-blur sm:px-4">
          <Link href="/home" className="flex shrink-0 items-center gap-2 pl-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetPath("/brand/birdee-mark.png")} width={28} height={28} alt="" />
            <span className="font-display text-[17px] font-semibold">
              <span className="text-ink">Little </span>
              <span className="text-amber-500">Birdee</span>
            </span>
          </Link>

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
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </header>
      </div>

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
