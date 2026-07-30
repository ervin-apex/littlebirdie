import type { Provenance, ValueStatus } from "./types";

const STATUS_PRIORITY: Record<ValueStatus, number> = {
  confirmed: 0,
  provisional: 1,
  estimated: 2,
  forecast: 3,
};

export function combineStatuses(statuses: readonly ValueStatus[]): ValueStatus {
  if (statuses.length === 0) {
    throw new Error("At least one financial status is required.");
  }

  return statuses.reduce((leastCertain, status) =>
    STATUS_PRIORITY[status] > STATUS_PRIORITY[leastCertain]
      ? status
      : leastCertain,
  );
}
export function derivedProvenance(
  inputs: readonly Provenance[],
  label: string,
): Provenance {
  return {
    source: "derived",
    status: combineStatuses(inputs.map((input) => input.status)),
    label,
  };
}
