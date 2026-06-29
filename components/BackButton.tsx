"use client";

import { useRouter } from "next/navigation";

/**
 * Back control that returns to the actual previous page (browser history),
 * falling back to a given route only when there's no history to go back to.
 */
export function BackButton({
  to,
  fallback = "/",
  className,
  label = "Back",
}: {
  /** When set, always navigate to this exact route (deterministic) instead of
   *  using browser history — avoids landing back on the same screen. */
  to?: string;
  fallback?: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const onClick = () => {
    if (to) {
      router.push(to);
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        className ??
        "mb-1 -ml-1 inline-flex min-h-[40px] w-fit items-center gap-1 px-1 text-[13px] text-ink/60 hover:text-ink/80"
      }
    >
      <span aria-hidden>←</span> {label}
    </button>
  );
}
