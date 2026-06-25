"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CaretDown } from "@phosphor-icons/react";

/** A subtle, optional disclosure — collapsed by default. Pass a changing
 *  `openSignal` to force it open from elsewhere (e.g. a deep link). */
export function Collapsible({
  title,
  children,
  defaultOpen = false,
  openSignal,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  openSignal?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const firstSignal = useRef(true);
  useEffect(() => {
    if (openSignal === undefined) return;
    if (firstSignal.current) {
      firstSignal.current = false;
      return;
    }
    setOpen(true);
  }, [openSignal]);
  return (
    <div className="rounded-2xl border border-black/10 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
      >
        <span className="text-[13px] font-medium text-ink/70">{title}</span>
        <CaretDown
          size={16}
          className={`text-ink/60 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
