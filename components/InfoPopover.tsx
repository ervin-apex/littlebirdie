"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/** A small "What does this mean?" disclosure for the wizard input steps —
 *  plain-English explanation, tucked away until tapped. */
export function InfoPopover({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex min-h-[44px] items-center text-[12.5px] font-medium text-ink/60 underline decoration-ink/25 underline-offset-2 transition-colors hover:text-ink/80"
      >
        What does this mean?
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p className="max-w-md pb-1 text-[12.5px] leading-relaxed text-ink/65">
              {text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
