/**
 * Scott's "green light / red light" cue. Three traffic-light dots with the
 * active one lit, plus a label, so the verdict reads in a glance.
 */
export function TrafficLight({ inProfit }: { inProfit: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
        inProfit ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
      }`}
    >
      <span className="flex items-center gap-1" aria-hidden="true">
        <span
          className={`h-2 w-2 rounded-full ${inProfit ? "bg-emerald-300/50" : "bg-red-500"}`}
        />
        <span className="h-2 w-2 rounded-full bg-black/10" />
        <span
          className={`h-2 w-2 rounded-full ${inProfit ? "bg-emerald-500" : "bg-red-300/50"}`}
        />
      </span>
      {inProfit ? "Green light" : "Red light"}
    </span>
  );
}
