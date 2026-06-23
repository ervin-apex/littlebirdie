"use client";

import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
} from "recharts";

// Example data — last 5 weeks actual, then this week's prediction (the plan).
const DATA = [
  { w: "5wk", label: "5 weeks ago", v: 120, kind: "actual" },
  { w: "4wk", label: "4 weeks ago", v: -60, kind: "actual" },
  { w: "3wk", label: "3 weeks ago", v: 95, kind: "actual" },
  { w: "2wk", label: "2 weeks ago", v: -30, kind: "actual" },
  { w: "1wk", label: "Last week", v: 150, kind: "actual" },
  { w: "This", label: "This week (plan)", v: -438, kind: "plan" },
];

function fill(d: { v: number; kind: string }) {
  if (d.kind === "plan") return d.v < 0 ? "#dc2626" : "#16a34a";
  return d.v < 0 ? "#fca5a5" : "#f59e0b";
}

const money = (v: number) => `${v < 0 ? "−$" : "+$"}${Math.abs(v)}`;

export function ProfitTrend() {
  return (
    <div>
      {/* legend — distinguishes plan vs actual beyond colour */}
      <div className="mb-3 flex items-center gap-4 text-[11px] text-ink/60">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" aria-hidden />
          Actual weeks
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm border-2 border-red-900 bg-red-600"
            aria-hidden
          />
          This week (plan)
        </span>
      </div>

      <div
        className="h-[140px] w-full"
        role="img"
        aria-label="Net profit by week. This week's plan is the weakest at minus $438; the five prior weeks ranged from minus $60 to plus $150."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={DATA} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
            <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
            <XAxis
              dataKey="w"
              tick={{ fontSize: 11, fill: "#475569" }}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="v" radius={[3, 3, 0, 0]} isAnimationActive>
              {DATA.map((d, i) => (
                <Cell
                  key={i}
                  fill={fill(d)}
                  stroke={d.kind === "plan" ? "#7f1d1d" : "none"}
                  strokeWidth={d.kind === "plan" ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* screen-reader alternative */}
      <table className="sr-only">
        <caption>Net profit by week</caption>
        <thead>
          <tr>
            <th>Week</th>
            <th>Net profit</th>
          </tr>
        </thead>
        <tbody>
          {DATA.map((d) => (
            <tr key={d.w}>
              <td>{d.label}</td>
              <td>{money(d.v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
