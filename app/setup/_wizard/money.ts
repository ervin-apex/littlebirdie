export function formatInputMoney(value: number) {
  return new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(value);
}

export function parseMoney(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}
