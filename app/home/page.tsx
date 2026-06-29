"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CaretRight, LockSimple, PencilSimple, TrendUp } from "@phosphor-icons/react";
import { AppShell } from "@/components/AppShell";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { hasSavedWeek } from "@/lib/profit";
import { loadBusiness } from "@/lib/business";

/**
 * Home hub (round 2) — the "two buttons" dashboard, on the shared cream/header
 * shell. "How's my profit looking?" stays locked until the user has entered
 * numbers; until then the Birdee mascot points them to the enter-numbers button.
 */
export default function HomeHub() {
  const [ready, setReady] = useState(false);
  const [hasNumbers, setHasNumbers] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    setHasNumbers(hasSavedWeek());
    setName(loadBusiness()?.name ?? "");
    setReady(true);
  }, []);

  return (
    <AppShell maxWidth="max-w-2xl" center>
      <div className="fade-up w-full rounded-[28px] bg-white/95 p-6 shadow-[0_36px_70px_-34px_rgba(15,23,42,0.4)] sm:p-8 sm:px-10">
        <div className="flex flex-col items-center text-center">
          <BirdeeMascot state={hasNumbers ? "profit" : "neutral"} size={96} float />

          {/* speech bubble */}
          <div className="relative mt-3 max-w-xs rounded-2xl bg-[#f6f7f9] px-4 py-3 text-[14px] leading-relaxed text-ink/75">
            <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-[#f6f7f9]" />
            {ready && !hasNumbers
              ? "First, pop in your weekly numbers and I'll show you your profit."
              : "Ready to check your week?"}
          </div>

          {/* actions */}
          <div className="mt-7 flex w-full flex-col gap-3.5">
            {hasNumbers ? (
              <HubButton
                href="/profit"
                tone="primary"
                icon={<TrendUp size={18} weight="bold" />}
                label="How's my profit looking?"
              />
            ) : (
              <div className="w-full">
                <HubButton
                  tone="locked"
                  icon={<LockSimple size={18} weight="bold" />}
                  label="How's my profit looking?"
                />
                <p className="mt-2 text-[12.5px] font-medium text-ink/45">
                  Enter your numbers first to unlock this.
                </p>
              </div>
            )}

            <HubButton
              href="/setup"
              tone={hasNumbers ? "secondary" : "primary"}
              icon={<PencilSimple size={18} weight="bold" />}
              label={hasNumbers ? "Update my numbers" : "Enter my numbers"}
            />
          </div>

          {/* business footer */}
          <div className="mt-7 flex w-full items-center gap-3">
            <span className="h-px flex-1 bg-black/10" />
            <span className="text-[12.5px] text-ink/45">
              Business:{" "}
              <span className="font-semibold text-ink/70">{name || "—"}</span>
            </span>
            <span className="h-px flex-1 bg-black/10" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

type Tone = "primary" | "secondary" | "locked";

function HubButton({
  href,
  tone,
  icon,
  label,
}: {
  href?: string;
  tone: Tone;
  icon: React.ReactNode;
  label: string;
}) {
  const base =
    "flex w-full items-center gap-3 rounded-2xl px-4 py-4 transition active:scale-[0.99]";
  const tones: Record<Tone, string> = {
    primary:
      "bg-amber-400 text-ink shadow-[0_16px_34px_-16px_rgba(245,158,11,0.75)] hover:bg-amber-300",
    secondary: "border border-amber-200 bg-amber-50 text-ink/80 hover:bg-amber-100",
    locked: "cursor-not-allowed bg-black/[0.05] text-ink/35",
  };
  const badge: Record<Tone, string> = {
    primary: "bg-white/45 text-ink",
    secondary: "bg-white text-amber-600",
    locked: "bg-black/5 text-ink/30",
  };

  const inner = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${badge[tone]}`}
      >
        {icon}
      </span>
      <span className="flex-1 text-center font-display text-[18px] font-semibold leading-tight">
        {label}
      </span>
      {tone === "locked" ? (
        <span className="w-[18px] shrink-0" aria-hidden />
      ) : (
        <CaretRight size={18} weight="bold" className="shrink-0 text-ink/40" />
      )}
    </>
  );

  if (tone === "locked" || !href) {
    return (
      <div aria-disabled className={`${base} ${tones[tone]}`}>
        {inner}
      </div>
    );
  }
  return (
    <Link href={href} className={`${base} ${tones[tone]}`}>
      {inner}
    </Link>
  );
}
