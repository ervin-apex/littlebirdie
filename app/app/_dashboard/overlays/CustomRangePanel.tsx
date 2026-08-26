import { ProductButton } from "@/components/ProductButton";
import { DEMO_HISTORY_RANGE } from "@/lib/profit";
import type { HistoryRange } from "@/lib/profit";
import { X } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";

export function CustomRangePanel({ value, onChange, onApply, onClose }: {
  value: HistoryRange;
  onChange: (range: HistoryRange) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const invalid = value.from > value.to;
  return (
    <motion.section
      className="custom-range-panel"
      role="dialog"
      aria-label="Choose custom reporting dates"
      initial={reduceMotion ? false : { opacity: 0, transform: "translateY(-8px) scale(0.98)" }}
      animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
      exit={reduceMotion ? { opacity: 0 } : {
        opacity: 0,
        transform: "translateY(-5px) scale(0.985)",
        transition: { duration: 0.14, ease: [0.23, 1, 0.32, 1] },
      }}
      transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.23, 1, 0.32, 1] }}
    >
      <div>
        <strong>Custom range</strong>
        <span>Demo records are available from 1 to 30 June 2026.</span>
      </div>
      <label>
        <span>From</span>
        <input type="date" min={DEMO_HISTORY_RANGE.from} max={DEMO_HISTORY_RANGE.to} value={value.from} onChange={(event) => onChange({ ...value, from: event.target.value })} />
      </label>
      <label>
        <span>To</span>
        <input type="date" min={DEMO_HISTORY_RANGE.from} max={DEMO_HISTORY_RANGE.to} value={value.to} onChange={(event) => onChange({ ...value, to: event.target.value })} />
      </label>
      <ProductButton variant="primary" size="compact" onClick={onApply} disabled={invalid}>View range</ProductButton>
      <button type="button" className="custom-range-close" onClick={onClose} aria-label="Close custom range"><X aria-hidden /></button>
    </motion.section>
  );
}
