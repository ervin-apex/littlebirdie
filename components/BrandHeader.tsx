"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PencilSimpleLine } from "@phosphor-icons/react";
import { assetPath, withoutBasePath } from "@/lib/site";

const NAV = [
  { href: "/setup", matchPath: "/setup", label: "Update my numbers", icon: PencilSimpleLine },
];

/**
 * Core product header. Scott's 20 July direction keeps the navigation focused
 * on the two real operator jobs: checking profit and updating numbers.
 */
export function BrandHeader({ variant = "default" }: { variant?: "default" | "home" }) {
  const pathname = withoutBasePath(usePathname());
  const isHomeReference = variant === "home";

  return (
    <header className="brand-header flex items-center justify-between gap-3 border-b border-black/10 px-1 py-4 sm:px-0">
      <Link href={isHomeReference ? "/home" : "/app?period=this-week"} className={`flex shrink-0 items-center pl-1 ${isHomeReference ? "gap-3" : "gap-2"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetPath("/brand/birdee-mark.png")}
          width={isHomeReference ? 40 : 26}
          height={isHomeReference ? 40 : 26}
          alt=""
        />
        <span
          className={
            isHomeReference
              ? "text-[24px] font-bold tracking-[-0.02em] text-ink"
              : "font-display text-[16px] font-semibold sm:text-[17px]"
          }
        >
          <span className="text-ink">Little </span>
          <span className={isHomeReference ? "text-ink" : "text-amber-500"}>Birdee</span>
        </span>
      </Link>

      {!isHomeReference && <nav className="flex items-center gap-1 sm:gap-3" aria-label="Product">
        {NAV.map((item) => {
          const active = pathname === item.matchPath;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`brand-header__update inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-[13px] font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 sm:text-[14px] ${active ? "is-active" : ""}`}
            >
              <Icon size={18} weight={active ? "fill" : "regular"} aria-hidden />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">Update</span>
            </Link>
          );
        })}
      </nav>}
    </header>
  );
}
