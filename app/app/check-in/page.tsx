"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  Check,
  CheckCircle,
  LockKey,
  PencilSimpleLine,
  Storefront,
} from "@phosphor-icons/react";
import { ProductButton } from "@/components/ProductButton";
import {
  eligibleDailyDates,
  isoDateAtIndex,
} from "@/lib/persistence/daily-actual";
import {
  loadVenueState,
  saveDailyRevenue,
  type VenueState,
} from "@/lib/persistence/venue-state";
import {
  DAY_FULL,
  money,
  type DayActual,
} from "@/lib/profit";
import { assetPath } from "@/lib/site";
import "../update/update.css";

const DAY_MONTH = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function displayDate(isoDate: string) {
  return DAY_MONTH.format(new Date(`${isoDate}T00:00:00Z`));
}

const MAX_DAILY_REVENUE = 10_000_000;

function validateMoney(value: string) {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (cleaned === "") {
    return { value: null, error: "Enter an actual amount." };
  }
  if (cleaned.startsWith("-")) {
    return { value: null, error: "Actual cannot be negative." };
  }
  if (!/^\d+(?:\.\d*)?$/.test(cleaned)) {
    return { value: null, error: "Use numbers only." };
  }
  const decimalPlaces = cleaned.split(".")[1]?.length ?? 0;
  if (decimalPlaces > 2) {
    return { value: null, error: "Use no more than 2 decimal places." };
  }
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) {
    return { value: null, error: "Enter a valid actual amount." };
  }
  if (parsed > MAX_DAILY_REVENUE) {
    return { value: null, error: "Enter $10,000,000 or less." };
  }
  return { value: parsed, error: null };
}

function inputMoney(value: number) {
  return new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(value);
}

export default function DailyCheckInPage() {
  const router = useRouter();
  const [state, setState] = useState<VenueState | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [revenueInput, setRevenueInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revenueTouched, setRevenueTouched] = useState(false);

  useEffect(() => {
    let active = true;
    const requestedDate = new URLSearchParams(window.location.search).get("date") ?? undefined;
    loadVenueState(requestedDate)
      .then((loaded) => {
        if (!active) return;
        if (!loaded.hasPlan || !loaded.week || !loaded.weekStart) {
          router.replace("/setup");
          return;
        }
        const dates = eligibleDailyDates(loaded.weekStart, loaded.currentDate);
        const priorDates = dates.filter((date) => date < loaded.currentDate);
        const initialDate =
          (requestedDate && dates.includes(requestedDate) ? requestedDate : null)
          ?? priorDates.at(-1)
          ?? dates.at(-1)
          ?? loaded.weekStart;
        const initialIndex = datesForWeek(loaded.weekStart).indexOf(initialDate);
        const initialActual = loaded.actuals?.actuals[initialIndex] ?? null;
        setState(loaded);
        setSelectedDate(initialDate);
        setRevenueInput(initialActual ? inputMoney(initialActual.rev) : "");
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Birdee could not open this venue.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  const dates = useMemo(
    () => state?.weekStart ? datesForWeek(state.weekStart) : [],
    [state?.weekStart],
  );
  const eligibleDates = useMemo(
    () =>
      state?.weekStart
        ? eligibleDailyDates(state.weekStart, state.currentDate)
        : [],
    [state?.currentDate, state?.weekStart],
  );
  const selectedIndex = dates.indexOf(selectedDate);
  const selectedActual: DayActual =
    selectedIndex >= 0
      ? state?.actuals?.actuals[selectedIndex] ?? null
      : null;
  const plannedRevenue =
    selectedIndex >= 0 ? state?.week?.days[selectedIndex] ?? 0 : 0;
  const plannedLabour =
    selectedActual?.snapshot.lab
    ?? (
      selectedIndex >= 0 && state?.week
        ? (
          state.week.days.reduce((total, day) => total + day, 0) > 0
            ? state.week.lab
              * state.week.days[selectedIndex]
              / state.week.days.reduce((total, day) => total + day, 0)
            : state.week.lab / 7
        )
        : 0
    );
  const isCorrection = Boolean(selectedActual);
  const dayName = selectedIndex >= 0 ? DAY_FULL[selectedIndex] : "day";
  const isToday = selectedDate === state?.currentDate;
  const revenueValidation = validateMoney(revenueInput);
  const revenueFieldError =
    (revenueTouched || revenueInput !== "") && revenueValidation.error
      ? revenueValidation.error
      : null;

  const chooseDate = (date: string) => {
    const index = dates.indexOf(date);
    const actual = state?.actuals?.actuals[index] ?? null;
    setSelectedDate(date);
    setRevenueInput(actual ? inputMoney(actual.rev) : "");
    setRevenueTouched(false);
    setError(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setRevenueTouched(true);
    setSaving(true);
    setError(null);
    try {
      const validation = validateMoney(revenueInput);
      if (validation.value == null) {
        setError(validation.error);
        return;
      }
      await saveDailyRevenue({
        serviceDate: selectedDate,
        revenue: validation.value,
      });
      const dayIndex = dates.indexOf(selectedDate);
      router.push(
        dayIndex >= 0
          ? `/app?period=this-week&view=day-verdict&day=${dayIndex}&scope=day&service-date=${selectedDate}`
          : "/app?period=this-week",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Birdee could not save this actual.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || !state?.week || !state.weekStart) {
    return (
      <div className="daily-update-page daily-update-loading" role="status">
        <span>Opening your daily check-in…</span>
        <strong>Birdee is finding the right venue and week.</strong>
      </div>
    );
  }

  return (
    <div className="daily-update-page">
      <header className="daily-update-heading">
        <ProductButton
          href={selectedDate
            ? `/app?period=this-week&service-date=${encodeURIComponent(selectedDate)}`
            : "/app?period=this-week"}
          variant="tertiary"
          size="compact"
          leadingIcon={<ArrowLeft weight="bold" />}
        >
          This week
        </ProductButton>
        <div className="daily-update-heading__copy">
          <span>Daily check-in</span>
          <h1>What did {dayName} make?</h1>
          <p>Add one number and Birdee will show {dayName}&rsquo;s result.</p>
        </div>
      </header>

      <section className="daily-date-section" aria-labelledby="daily-date-heading">
        <div className="daily-date-heading">
          <div>
            <span><CalendarBlank weight="duotone" aria-hidden /></span>
            <div>
              <h2 id="daily-date-heading">Choose a day</h2>
              <p>Recorded, missing and future days stay clearly separate.</p>
            </div>
          </div>
          <small>{state.venueName}</small>
        </div>

        <div className="daily-date-row" role="list" aria-label="Days in this plan">
          {dates.map((date, index) => {
            const eligible = eligibleDates.includes(date);
            const actual = state.actuals?.actuals[index] ?? null;
            const selected = selectedDate === date;
            return (
              <button
                type="button"
                role="listitem"
                key={date}
                disabled={!eligible}
                className={[
                  "daily-date",
                  selected ? "is-selected" : "",
                  actual ? "is-recorded" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => chooseDate(date)}
                aria-pressed={selected}
              >
                <span>{DAY_FULL[index].slice(0, 3)}</span>
                <strong>{displayDate(date)}</strong>
                <small>
                  {actual ? (
                    <><Check weight="bold" /> Recorded</>
                  ) : eligible ? (
                    isToday && selected ? "Today" : "Not entered"
                  ) : (
                    "Not yet"
                  )}
                </small>
              </button>
            );
          })}
        </div>
      </section>

      <form className="daily-check-in-surface" onSubmit={submit}>
        <div className="daily-check-in-main">
          <section className="daily-revenue-entry" aria-labelledby="daily-revenue-heading">
            <div className="daily-revenue-form__intro">
              <div>
                <h2 id="daily-revenue-heading">
                  {isToday ? "Today’s actual" : `${dayName}’s actual`}
                </h2>
                <p>
                  {state.week.revenueEntryBasis === "gst-inclusive"
                    ? "Enter the sales total including GST."
                    : "Enter the sales total excluding GST."}
                </p>
              </div>
              {isCorrection && (
                <span className="daily-correction-badge">
                  <PencilSimpleLine weight="bold" aria-hidden />
                  Correction {selectedActual?.revision ?? 1}
                </span>
              )}
            </div>

            <div className="daily-revenue-control">
              <label className="daily-revenue-input" htmlFor="daily-revenue">
                <span>$</span>
                <input
                  id="daily-revenue"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  value={revenueInput}
                  placeholder="0"
                  onChange={(event) => {
                    setRevenueInput(event.target.value.replace(/[$,\s]/g, ""));
                    setRevenueTouched(true);
                    setError(null);
                  }}
                  onBlur={() => setRevenueTouched(true)}
                  aria-invalid={Boolean(revenueFieldError)}
                  aria-describedby={[
                    "daily-revenue-context",
                    revenueFieldError ? "daily-revenue-error" : "",
                  ].filter(Boolean).join(" ")}
                  autoFocus
                />
                <small>AUD</small>
              </label>
              <span className="daily-gst-basis">
                <CheckCircle weight="fill" aria-hidden />
                {state.week.revenueEntryBasis === "gst-inclusive"
                  ? "Includes GST"
                  : "Excludes GST"}
              </span>
            </div>

            {revenueFieldError && (
              <p
                id="daily-revenue-error"
                className="daily-update-message is-error"
                role="alert"
              >
                {revenueFieldError}
              </p>
            )}
            {isCorrection && (
              <p className="daily-correction-note">
                This saves a new correction. The original plan comparison stays locked.
              </p>
            )}
            {error && error !== revenueFieldError && (
              <p className="daily-update-message is-error" role="alert">{error}</p>
            )}

            <div className="daily-form-actions">
              <ProductButton
                type="submit"
                variant="primary"
                state={saving ? "loading" : undefined}
                disabled={revenueValidation.value == null}
                trailingIcon={<ArrowRight weight="bold" />}
              >
                {saving
                  ? "Saving…"
                  : isCorrection
                    ? "Save correction"
                    : `Show ${dayName}’s result`}
              </ProductButton>
              <ProductButton
                href="/app/plan"
                variant="tertiary"
                leadingIcon={<PencilSimpleLine weight="bold" />}
              >
                Edit weekly plan
              </ProductButton>
            </div>
          </section>

          <aside className="daily-birdee-guide" aria-label="How Birdee calculates this result">
            <div className="daily-birdee-guide__art" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetPath("/brand/birdee-setup-revenue-v1.png")} alt="" />
            </div>
            <div className="daily-birdee-guide__copy">
              <span><Storefront weight="duotone" aria-hidden /> {state.venueName}</span>
              <h2>I&rsquo;ll use your weekly plan for costs.</h2>
              <p>One actual number is all I need from you today.</p>
            </div>
          </aside>
        </div>

        <div id="daily-revenue-context" className="daily-plan-context">
          <div>
            <span>Sales budget</span>
            <strong>{money(plannedRevenue)}</strong>
          </div>
          <div>
            <span>Labour estimate</span>
            <strong>{money(plannedLabour)}</strong>
          </div>
          <div className="daily-labour-note">
            <LockKey weight="duotone" aria-hidden />
            <p>
              <strong>Labour stays estimated</strong>
              <span>from your weekly plan.</span>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

function datesForWeek(weekStart: string) {
  if (!weekStart) return [];
  return Array.from({ length: 7 }, (_, index) =>
    isoDateAtIndex(weekStart, index));
}
