import { ProductButton } from "@/components/ProductButton";
import { formatLongDate, formatWeekRange } from "@/lib/dashboard/attention";
import type { DashboardAttentionPrompt } from "@/lib/dashboard/attention";
import { assetPath } from "@/lib/site";
import { ArrowRight, CalendarBlank, ShieldCheck } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";

export function DashboardAttentionOverlay({
  prompt,
  onRemindLater,
  onHide,
  onDailyCheckIn,
}: {
  prompt: DashboardAttentionPrompt;
  onRemindLater: () => void;
  onHide: () => void;
  onDailyCheckIn: (date: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const weekly = prompt.kind === "weekly";
  const date = weekly ? prompt.targetWeekStart : prompt.task.date;
  const title = weekly
    ? "New week, fresh numbers."
    : `How did ${prompt.task.dayName} go?`;
  const support = weekly
    ? `I\u2019ve brought last week\u2019s budget across. Give it a quick check so I can track ${formatWeekRange(prompt.targetWeekStart)}.`
    : "Add the actual and I\u2019ll work out the rest from your weekly budget.";
  const dateLabel = weekly
    ? formatWeekRange(prompt.targetWeekStart)
    : formatLongDate(date);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(
          ".dashboard-attention-prompt .dashboard-attention-actions a, .dashboard-attention-prompt .dashboard-attention-actions button",
        )
        ?.focus();
    });
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onRemindLater();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = document.querySelector<HTMLElement>(".dashboard-attention-prompt");
      const focusable = dialog
        ? [...dialog.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")]
        : [];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleDialogKeys);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleDialogKeys);
    };
  }, [onRemindLater]);

  return (
    <motion.div
      className="dashboard-attention-layer"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.18 }}
    >
      <button
        type="button"
        className="dashboard-attention-scrim"
        aria-label="Remind me later"
        onClick={onRemindLater}
      />
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-attention-title"
        aria-describedby="dashboard-attention-support"
        className={`dashboard-attention-prompt is-${prompt.kind}`}
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.23, 1, 0.32, 1] }}
      >
        <span className="dashboard-attention-handle" aria-hidden />
        <div className="dashboard-attention-visual" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath(weekly
              ? "/brand/birdee-weekly-planning-v1.webp"
              : "/brand/birdee-daily-curious-v1.webp")}
            alt=""
          />
        </div>
        <div className="dashboard-attention-content">
          <p className="dashboard-attention-eyebrow">
            {weekly ? "A new week" : "Daily check-in"}
          </p>
          <h2 id="dashboard-attention-title">{title}</h2>
          <p id="dashboard-attention-support" className="dashboard-attention-support">
            {support}
          </p>
          <span className="dashboard-attention-date">
            <CalendarBlank weight="duotone" aria-hidden />
            {dateLabel}
          </span>
          <div className="dashboard-attention-actions">
            {weekly ? (
              <ProductButton
                href="/app/budget"
                variant="primary"
                trailingIcon={<ArrowRight weight="bold" />}
              >
                Review Weekly Budget
              </ProductButton>
            ) : (
              <button
                type="button"
                className="dashboard-attention-primary"
                onClick={() => onDailyCheckIn(prompt.task.date)}
              >
                Add {prompt.task.dayName}&rsquo;s actual
                <ArrowRight weight="bold" aria-hidden />
              </button>
            )}
            <button type="button" className="dashboard-attention-later" onClick={onRemindLater}>
              Remind me later
            </button>
          </div>
          <div className="dashboard-attention-foot">
            <span>
              <ShieldCheck weight="duotone" aria-hidden />
              {weekly ? "Last week stays saved." : "Your weekly budget stays unchanged."}
            </span>
            <button type="button" onClick={onHide}>Don&rsquo;t show this again</button>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
