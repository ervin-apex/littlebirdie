"use client";

import { CheckCircle, Warning } from "@phosphor-icons/react";
import { DAY_FULL, money, type LedgerRow, type WeekStatus } from "@/lib/profit";
import { assetPath } from "@/lib/site";

type Item =
  | { kind: "day"; index: number; title: string; sub: string }
  | { kind: "line"; title: string; sub: string };

function buildItems(rows: LedgerRow[], status: WeekStatus): Item[] {
  const items: Item[] = [];

  // Days that missed their forecast, worst first.
  const misses = rows
    .filter((r) => r.status === "past" && r.light === "red" && r.variance)
    .sort((a, b) => (a.variance?.net ?? 0) - (b.variance?.net ?? 0));
  misses.forEach((m, i) => {
    items.push({
      kind: "day",
      index: m.index,
      title: `${DAY_FULL[m.index]} ${i === 0 ? "is the biggest miss" : "missed forecast"}`,
      sub: `${money(Math.abs(m.variance?.net ?? 0))} behind forecast`,
    });
  });

  // The single biggest cost/revenue line running against forecast, to date.
  const v = status.variance;
  const lines: { amt: number; title: string; sub: string }[] = [];
  if (v.rev < 0)
    lines.push({ amt: -v.rev, title: "Revenue is under forecast", sub: `${money(-v.rev)} under so far` });
  if (v.lab > 0)
    lines.push({ amt: v.lab, title: "Labour is over forecast", sub: `${money(v.lab)} over so far` });
  lines.sort((a, b) => b.amt - a.amt);
  if (lines[0]) items.push({ kind: "line", title: lines[0].title, sub: lines[0].sub });

  return items.slice(0, 3);
}

export function NeedsAttention({
  rows,
  status,
}: {
  rows: LedgerRow[];
  status: WeekStatus;
}) {
  const items = buildItems(rows, status);

  return (
    <div className="flex h-full flex-col rounded-3xl border border-black/10 bg-white p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Warning size={18} weight="fill" className="text-amber-500" />
          <h2 className="font-display text-[15px] font-semibold tracking-tight">
            What needs attention
          </h2>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetPath(items.length ? "/brand/birdee-worried.png" : "/brand/birdee-happy.png")}
          width={40}
          height={40}
          alt=""
          style={{ transform: "scaleX(-1)" }}
          className="-mt-1.5 shrink-0 opacity-90"
        />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center">
          <CheckCircle size={30} weight="fill" className="text-emerald-500" />
          <p className="text-[13px] font-medium text-ink/70">
            Every day is beating forecast. Keep the week steady.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, i) => {
            const badge =
              item.kind === "day" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
            return (
              <li key={i} className="flex items-center gap-3 px-2 py-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${badge}`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium leading-snug text-ink">
                    {item.title}
                  </span>
                  <span className="block text-[12px] text-ink/60">{item.sub}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
