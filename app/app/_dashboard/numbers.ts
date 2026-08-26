import {
  emptyComponentProvenance,
  mergeComponentProvenance,
  type DayCell,
  type LedgerRow,
} from "@/lib/profit";

export function totalCells(
  rows: LedgerRow[],
  source: "actual" | "predicted" | "selected",
): DayCell {
  return rows.reduce<DayCell>((sum, row) => {
    const cell =
      source === "actual"
        ? row.actual
        : source === "selected"
          ? row.actual ?? row.predicted
          : row.predicted;
    if (!cell) return sum;
    return {
      rev: sum.rev + cell.rev,
      netRevenue: sum.netRevenue + cell.netRevenue,
      gst: sum.gst + cell.gst,
      cogs: sum.cogs + cell.cogs,
      lab: sum.lab + cell.lab,
      fix: sum.fix + cell.fix,
      otherIncome: sum.otherIncome + cell.otherIncome,
      net: sum.net + cell.net,
      resultStatus:
        sum.resultStatus === "forecast" || cell.resultStatus === "forecast"
          ? "forecast"
          : "estimated",
      componentProvenance: mergeComponentProvenance(
        sum.componentProvenance,
        cell.componentProvenance,
      ),
    };
  }, {
    rev: 0,
    netRevenue: 0,
    gst: 0,
    cogs: 0,
    lab: 0,
    fix: 0,
    otherIncome: 0,
    net: 0,
    resultStatus: source === "predicted" ? "forecast" : "estimated",
    componentProvenance: emptyComponentProvenance(
      source === "predicted" ? "forecast" : "estimated",
    ),
  });
}
