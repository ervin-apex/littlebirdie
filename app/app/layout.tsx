"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { assetPath, withoutBasePath } from "@/lib/site";
import {
  House,
  PlugsConnected,
  CreditCard,
  UsersThree,
  List,
  X,
} from "@phosphor-icons/react";

const NAV = [
  { href: "/app", label: "Dashboard", icon: House },
  { href: "/app/connections", label: "Connections", icon: PlugsConnected },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
  { href: "/app/admin", label: "Admin", icon: UsersThree },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors ${
              active
                ? "bg-amber-50 text-amber-900"
                : "text-ink/65 hover:bg-black/[0.04] hover:text-ink"
            }`}
          >
            <Icon size={20} weight={active ? "fill" : "regular"} />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function Wordmark({ size = 17 }: { size?: number }) {
  return (
    <span
      className="flex items-center gap-2"
      style={{ fontSize: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={assetPath("/brand/birdee-mark.png")} width={26} height={26} alt="" />
      <span className="font-display font-semibold">
        <span className="text-ink">Little </span>
        <span className="text-amber-600">Birdie</span>
      </span>
    </span>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = withoutBasePath(usePathname());
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-[#f6f7f9] text-ink lg:flex">
      {/* desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-black/5 bg-white px-3 py-5 lg:flex lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <Link href="/app" className="mb-7 px-2">
          <Wordmark />
        </Link>
        <nav className="flex flex-col gap-1">
          <NavLinks pathname={pathname} />
        </nav>
        <div className="mt-auto rounded-xl bg-[#f6f7f9] px-3 py-2.5 text-[12px] text-ink/65">
          <div className="font-medium text-ink/80">Crema Café</div>
          Pro plan · Perth
        </div>
      </aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-black/5 bg-white/85 px-4 backdrop-blur lg:hidden">
        <Link href="/app">
          <Wordmark size={16} />
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-ink/70 hover:bg-black/5"
        >
          <List size={22} />
        </button>
      </header>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="fixed right-0 top-0 z-50 flex h-full w-64 flex-col bg-white px-3 py-5 lg:hidden"
            >
              <div className="mb-5 flex items-center justify-between px-2">
                <Wordmark size={16} />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-ink/70 hover:bg-black/5"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
