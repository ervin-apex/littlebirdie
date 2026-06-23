"use client";

import { useRef } from "react";
import { DAY_LABELS } from "@/lib/profit";

/**
 * Draggable Mon–Sun revenue bars. Drag a bar up/down (or focus + arrow keys)
 * to set that day's revenue; the weekly total is the sum. Amber fill on a
 * light track, on-brand.
 */
export function RevenueBars({
  days,
  onChange,
  max = 6000,
  step = 50,
}: {
  days: number[];
  onChange: (i: number, val: number) => void;
  max?: number;
  step?: number;
}) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  const setFromY = (i: number, clientY: number) => {
    const el = refs.current[i];
    if (!el) return;
    const r = el.getBoundingClientRect();
    let ratio = 1 - (clientY - r.top) / r.height;
    ratio = Math.max(0, Math.min(1, ratio));
    onChange(i, Math.round((ratio * max) / step) * step);
  };

  return (
    <div className="flex select-none items-end gap-2" style={{ height: 196 }}>
      {days.map((d, i) => {
        const pct = Math.max(3, Math.min(100, (d / max) * 100));
        return (
          <div key={i} className="flex h-full flex-1 flex-col items-center gap-2">
            <span className="tnum font-display text-[11px] font-medium text-ink/70">
              ${(d / 1000).toFixed(1)}k
            </span>
            <div
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="slider"
              aria-label={`${DAY_LABELS[i]} revenue`}
              aria-valuemin={0}
              aria-valuemax={max}
              aria-valuenow={Math.round(d)}
              tabIndex={0}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setFromY(i, e.clientY);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                  setFromY(i, e.clientY);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  onChange(i, Math.min(max, d + step));
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  onChange(i, Math.max(0, d - step));
                }
              }}
              className="relative w-full flex-1 cursor-ns-resize touch-none overflow-hidden rounded-xl bg-amber-100 outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <div
                className="absolute inset-x-0 bottom-0 rounded-xl bg-amber-400"
                style={{ height: `${pct}%` }}
              >
                <div className="absolute inset-x-2 top-1 h-1 rounded-full bg-amber-600/50" />
              </div>
            </div>
            <span className="text-[11px] text-ink/60">{DAY_LABELS[i]}</span>
          </div>
        );
      })}
    </div>
  );
}
