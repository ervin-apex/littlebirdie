"use client";

import { useEffect, useRef } from "react";
import { GST_DIVISOR, money, type Breakeven } from "@/lib/profit";

/** <details>-based popover that also dismisses on Escape and outside click.
 * Same behaviour as v3's DismissableDetails; restyled panel only. */
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
    <details ref={ref} className="v4-popover">
      {children}
    </details>
  );
}

/**
 * v4 break-even strip — same segment math as v3's BreakevenBar (revenue past
 * break-even is never all profit: it still splits into a profit segment and
 * a cost-of-goods/GST "drag" tail), restyled to the colour law: the drag
 * tail is the profit colour at 35% opacity rather than a separate hue, and
 * the "short of break-even" fill is gold — the one place progress-toward-
 * goal reads as the panel's action colour rather than a state colour.
 */
export function BreakevenBar({ be, cogsPct }: { be: Breakeven; cogsPct: number }) {
  const { breakeven: BE, revenue: R } = be;
  const margin = 1 / GST_DIVISOR - cogsPct / 100; // share of each extra $ that's real profit

  const cleared = R > BE && BE > 0;
  const short = BE > 0 && R <= BE;

  let trackPct = 0;
  let profitPct = 0;
  let dragPct = 0;
  let goalPct = 0;
  let markerPct = 100;

  let caption: string;

  if (cleared) {
    const H = R - BE;
    const profitFromHeadroom = Math.max(0, H * margin);
    const drag = Math.max(0, H - profitFromHeadroom);
    trackPct = (BE / R) * 100;
    profitPct = (profitFromHeadroom / R) * 100;
    dragPct = (drag / R) * 100;
    markerPct = trackPct;
    caption = `Past break-even — ${money(profitFromHeadroom)} of the extra ${money(H)} is profit; the rest covers cost of goods & GST.`;
  } else if (short) {
    const pct = Math.max(0, Math.min(100, Math.round((R / BE) * 100)));
    goalPct = pct;
    markerPct = 100;
    caption = `${money(BE - R)} more revenue to break even — you're ${pct}% there.`;
  } else {
    caption = "Not enough data yet to place your break-even line.";
  }

  return (
    <div className="v4-be">
      <div className="v4-be-head">
        <span className="v4-be-label">Break-even</span>
        <DismissableDetails>
          <summary aria-label="What is break-even?" className="v4-be-info v4-focusable">
            <InfoIcon />
          </summary>
          <div className="v4-popover__panel">
            <p>
              Break-even is the revenue where profit is exactly $0 — your wages
              and fixed costs, divided by what&apos;s left of each revenue
              dollar after GST and cost of goods.
            </p>
            <p>
              Clear it, and the extra revenue splits: some is profit, the rest
              still covers cost of goods and GST on that extra revenue. It&apos;s
              never &ldquo;everything above the line is pure profit&rdquo;.
            </p>
          </div>
        </DismissableDetails>
      </div>

      <div className="v4-be-track">
        <div className="v4-be-fill">
          {cleared && (
            <>
              <div className="v4-be-seg v4-be-seg--track" style={{ left: 0, width: `${trackPct}%` }} />
              <div
                className="v4-be-seg v4-be-seg--profit"
                style={{ left: `${trackPct}%`, width: `${profitPct}%` }}
              />
              <div
                className="v4-be-seg v4-be-seg--drag"
                style={{ left: `${trackPct + profitPct}%`, width: `${dragPct}%` }}
              />
            </>
          )}
          {short && (
            <div className="v4-be-seg v4-be-seg--goal" style={{ left: 0, width: `${goalPct}%` }} />
          )}
        </div>
        <div className="v4-be-tick" style={{ left: `${markerPct}%` }} />
      </div>

      <p className="v4-be-caption">{caption}</p>
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
