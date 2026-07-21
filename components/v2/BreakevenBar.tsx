"use client";

import { useEffect, useRef } from "react";
import { GST_DIVISOR, money, type Breakeven } from "@/lib/profit";

/** <details>-based popover that also dismisses on Escape and outside click. */
function DismissableDetails({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") el.removeAttribute("open");
    };
    const onClick = (e: MouseEvent) => {
      if (el.open && !el.contains(e.target as Node)) el.removeAttribute("open");
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <details ref={ref} className="v2-popover">
      {children}
    </details>
  );
}

/**
 * R4-2 corrected break-even visual. Revenue past break-even is NOT all
 * profit — cost of goods and GST still eat a share of every extra dollar.
 * This bar splits the cleared headroom into an actual-profit segment and a
 * thin "drag" segment (cost of goods + GST on the extra revenue), and never
 * claims "everything above break-even is profit".
 */
export function BreakevenBar({ be, cogsPct }: { be: Breakeven; cogsPct: number }) {
  const { breakeven: BE, revenue: R } = be;
  const margin = 1 / GST_DIVISOR - cogsPct / 100; // share of each extra $ that's real profit

  const cleared = R > BE && BE > 0;
  const short = BE > 0 && R <= BE;

  let sandPct = 0;
  let profitPct = 0;
  let dragPct = 0;
  let accentPct = 0;
  let markerPct = 100;

  let caption: string;

  if (cleared) {
    const H = R - BE;
    const profitFromHeadroom = Math.max(0, H * margin);
    const drag = Math.max(0, H - profitFromHeadroom);
    sandPct = (BE / R) * 100;
    profitPct = (profitFromHeadroom / R) * 100;
    dragPct = (drag / R) * 100;
    markerPct = sandPct;
    caption = `Past break-even — ${money(profitFromHeadroom)} of the extra ${money(H)} is profit; the rest covers cost of goods & GST.`;
  } else if (short) {
    const pct = Math.max(0, Math.min(100, Math.round((R / BE) * 100)));
    accentPct = pct;
    markerPct = 100;
    caption = `${money(BE - R)} more revenue to break even — you're ${pct}% there.`;
  } else {
    // BE is 0 or undefined-ish (shouldn't normally happen) — treat as cleared/neutral.
    caption = "Not enough data yet to place your break-even line.";
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
        <span className="v2-micro v2-muted">Break-even</span>
        <DismissableDetails>
          <summary aria-label="What is break-even?">
            <InfoIcon />
          </summary>
          <div className="v2-popover__panel">
            <p className="v2-small">
              Break-even is the revenue where profit is exactly $0 — your wages
              and fixed costs, divided by what&apos;s left of each revenue
              dollar after GST and cost of goods.
            </p>
            <p className="v2-small v2-muted" style={{ marginTop: 8 }}>
              Clear it, and the extra revenue splits: some is profit, the rest
              still covers cost of goods and GST on that extra revenue. It&apos;s
              never &ldquo;everything above the line is pure profit&rdquo;.
            </p>
          </div>
        </DismissableDetails>
      </div>

      <div className="v2-be-track">
        {cleared && (
          <>
            <div className="v2-be-seg v2-be-seg--sand" style={{ left: 0, width: `${sandPct}%` }} />
            <div
              className="v2-be-seg v2-be-seg--profit"
              style={{ left: `${sandPct}%`, width: `${profitPct}%` }}
            />
            <div
              className="v2-be-seg v2-be-seg--drag"
              style={{ left: `${sandPct + profitPct}%`, width: `${dragPct}%` }}
            />
          </>
        )}
        {short && (
          <div className="v2-be-seg v2-be-seg--accent" style={{ left: 0, width: `${accentPct}%` }} />
        )}
        <div className="v2-be-marker" style={{ left: `${markerPct}%` }} />
      </div>

      <p className="v2-small v2-muted" style={{ marginTop: 10, lineHeight: 1.5 }}>
        {caption}
      </p>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden>
      <path d="M128,24A104,104,0,1,0,232,128,104.13,104.13,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z" />
    </svg>
  );
}
