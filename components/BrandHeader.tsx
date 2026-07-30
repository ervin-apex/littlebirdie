"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CaretDown,
  CheckCircle,
  PencilSimpleLine,
  Plus,
  SignOut,
  Storefront,
  UserCircle,
} from "@phosphor-icons/react";
import { switchVenue } from "@/app/account/actions";
import type { VenueNavigationItem } from "@/lib/venues/navigation";
import { assetPath, withoutBasePath } from "@/lib/site";

const NAV = [
  {
    href: "/setup",
    matchPath: "/setup",
    label: "Update numbers",
    mobileLabel: "Update",
    icon: PencilSimpleLine,
    className: "brand-header__update-link",
  },
];

export function BrandHeader({
  variant = "default",
  accountLabel,
  venues = [],
  selectedVenueId,
}: {
  variant?: "default" | "home";
  accountLabel?: string;
  venues?: VenueNavigationItem[];
  selectedVenueId?: string | null;
}) {
  const pathname = withoutBasePath(usePathname());
  const isHomeReference = variant === "home";
  const selectedVenue =
    venues.find((venue) => venue.id === selectedVenueId) ?? venues[0];

  return (
    <header
      className={`brand-header${selectedVenue && !isHomeReference ? " brand-header--with-venue" : ""}`}
    >
      <div className="brand-header__left">
        <Link
          href={isHomeReference ? "/" : "/app?period=this-week"}
          className={`brand-header__logo${isHomeReference ? " brand-header__logo--home" : ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath("/brand/birdee-mark.png")}
            width={isHomeReference ? 40 : 26}
            height={isHomeReference ? 40 : 26}
            alt=""
          />
          <span>
            <span>Little </span>
            <strong>Birdee</strong>
          </span>
        </Link>

        {!isHomeReference && selectedVenue && (
          <VenueSwitcher
            venues={venues}
            selectedVenue={selectedVenue}
            pathname={pathname}
          />
        )}
      </div>

      {!isHomeReference && (
        <nav className="brand-header__nav" aria-label="Product">
          {NAV.map((item) => {
            const active = pathname === item.matchPath;
            const Icon = item.icon;
            const label = item.label;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`brand-header__update ${item.className}${active ? " is-active" : ""}`}
              >
                <Icon size={18} weight={active ? "fill" : "regular"} aria-hidden />
                <span className="brand-header__nav-label">{label}</span>
                <span className="brand-header__nav-mobile-label">{item.mobileLabel}</span>
              </Link>
            );
          })}
          <AccountMenu
            accountLabel={accountLabel || "Account"}
            pathname={pathname}
          />
        </nav>
      )}
    </header>
  );
}

function VenueSwitcher({
  venues,
  selectedVenue,
  pathname,
}: {
  venues: VenueNavigationItem[];
  selectedVenue: VenueNavigationItem;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname, selectedVenue.id]);

  useEffect(() => {
    if (!open) return;

    const closeOnPointerDown = (event: PointerEvent) => {
      if (!switcherRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="venue-switcher" ref={switcherRef}>
      <button
        type="button"
        className={`venue-switcher__trigger${open ? " is-open" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="venue-switcher-menu"
        aria-label={`Change venue. Current venue: ${selectedVenue.name}`}
      >
        <Storefront weight="duotone" aria-hidden />
        <span className="venue-switcher__selection">
          <strong>{selectedVenue.name}</strong>
        </span>
        <CaretDown className="venue-switcher__caret" weight="bold" aria-hidden />
        <span className="venue-switcher__business">{selectedVenue.businessName}</span>
      </button>

      {open && (
        <div
          id="venue-switcher-menu"
          className="venue-switcher__menu"
          role="menu"
          aria-label="Choose a venue"
        >
          <div className="venue-switcher__list">
            {venues.map((venue) => {
              const active = venue.id === selectedVenue.id;
              return (
                <form action={switchVenue} key={venue.id}>
                  <input type="hidden" name="venueId" value={venue.id} />
                  <button
                    type="submit"
                    className={`venue-switcher__option${active ? " is-current" : ""}`}
                    role="menuitem"
                  >
                    <span>
                      <strong>{venue.name}</strong>
                      <small>
                        {active
                          ? "Current venue"
                          : venue.hasPlan
                            ? venue.businessName
                            : "Setup required"}
                      </small>
                    </span>
                    {active && <CheckCircle weight="fill" aria-hidden />}
                  </button>
                </form>
              );
            })}
          </div>
          <Link
            href="/venues/new"
            className="venue-switcher__add"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span aria-hidden><Plus weight="bold" /></span>
            Add another venue
          </Link>
        </div>
      )}
    </div>
  );
}

function AccountMenu({
  accountLabel,
  pathname,
}: {
  accountLabel: string;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = accountLabel.trim().slice(0, 1).toUpperCase() || "A";
  const accountIsActive = pathname === "/account";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const closeOnPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className={`brand-header__account${open ? " is-open" : ""}${accountIsActive ? " is-active" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="account-menu"
        aria-label={`Account menu for ${accountLabel}`}
      >
        <span className="brand-header__account-avatar" aria-hidden>
          {initial}
        </span>
        <span className="brand-header__account-label">{accountLabel}</span>
        <CaretDown className="brand-header__account-caret" weight="bold" aria-hidden />
      </button>

      {open && (
        <div id="account-menu" className="account-menu__panel" role="menu">
          <Link
            href="/account"
            className="account-menu__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <UserCircle weight="duotone" aria-hidden />
            <span>
              <strong>Account and venues</strong>
              <small>{accountLabel}</small>
            </span>
          </Link>
          <form action="/auth/logout" method="post">
            <button type="submit" className="account-menu__item" role="menuitem">
              <SignOut weight="bold" aria-hidden />
              <span>
                <strong>Log out</strong>
                <small>Sign out of Little Birdee</small>
              </span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
