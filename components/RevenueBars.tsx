"use client";

import { useRef } from "react";
import { DAY_LABELS } from "@/lib/profit";

/**
 * Draggable Mon–Sun revenue bars. Amber fill on a neutral slate track so the
 * value reads as filled-vs-empty; drag up/down (or focus + arrow keys) to set
 * a day's revenue. The weekly total is the sum.
 */
export function RevenueBars({
  days,
  onChange,
  max = 6000,
  step = 50,
  height = 196,
}: {
  days: number[];
  onChange: (i: number, val: number) => void;
  max?: number;
  step?: number;
  height?: number;
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
    <div className="flex select-none items-end gap-2.5" style={{ height }}>
      {days.map((d, i) => {
        const pct = Math.max(2, Math.min(100, (d / max) * 100));
        return (
          <div key={i} className="group flex h-full flex-1 flex-col items-center gap-2">
            <span className="tnum font-display text-[12px] font-semibold text-ink transition-colors group-focus-within:text-amber-600">
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
              className="relative w-full flex-1 cursor-ns-resize touch-none overflow-hidden rounded-xl bg-slate-100 outline-none ring-1 ring-inset ring-slate-200/70 transition-shadow hover:ring-slate-300 focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <div
                className="absolute inset-x-0 bottom-0 rounded-t-lg bg-amber-500"
                style={{ height: `${pct}%` }}
              >
                <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-lg bg-white/25" />
                <div className="absolute left-1/2 top-1 h-1 w-5 -translate-x-1/2 rounded-full bg-white/70 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </div>
            <span className="text-[11px] font-medium text-ink/60">{DAY_LABELS[i]}</span>
          </div>
        );
      })}
    </div>
  );
}
