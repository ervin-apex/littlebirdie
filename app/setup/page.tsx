"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StepVisual } from "@/components/StepVisual";
import { RevenueBars } from "@/components/RevenueBars";
import {
  DEFAULTS,
  money,
  saveWeek,
  setDay,
  type Week,
} from "@/lib/profit";
import { assetPath } from "@/lib/site";

type Step = "revenue" | "labour" | "connect" | "cogs" | "fixed";

const FULL_ORDER: Step[] = ["revenue", "labour", "connect", "cogs", "fixed"];

type InputConfig = {
  title: string;
  blurb: string;
  visual: string;
  key: Exclude<keyof Week, "days">;
  min: number;
  max: number;
  step: number;
  unit: "money" | "pct";
  next: Step | "done";
  back: Step | "welcome";
};

const INPUTS: Record<Exclude<Step, "connect">, InputConfig> = {
  revenue: {
    title: "What revenue do you expect next week?",
    blurb: "Your best guess for the whole week. Birdie learns your real numbers over time.",
    visual: assetPath("/brand/step-revenue.png"),
    key: "rev",
    min: 10000,
    max: 35000,
    step: 100,
    unit: "money",
    next: "labour",
    back: "welcome",
  },
  labour: {
    title: "How much will you spend on labour?",
    blurb: "Total wages for the week from your roster.",
    visual: assetPath("/brand/step-labour.png"),
    key: "lab",
    min: 3000,
    max: 9000,
    step: 20,
    unit: "money",
    next: "connect",
    back: "revenue",
  },
  cogs: {
    title: "What's your cost of goods?",
    blurb: "As a share of revenue. Usually 28–38% for hospitality.",
    visual: assetPath("/brand/step-cogs.png"),
    key: "cogs",
    min: 20,
    max: 45,
    step: 0.5,
    unit: "pct",
    next: "fixed",
    back: "connect",
  },
  fixed: {
    title: "What are your fixed & variable costs?",
    blurb: "Everything that isn't labour or cost of goods, like rent, power and insurance, per week.",
    visual: assetPath("/brand/step-fixed.png"),
    key: "fix",
    min: 3000,
    max: 9000,
    step: 20,
    unit: "money",
    next: "done",
    back: "connect",
  },
};

export default function SetupWizard() {
  const router = useRouter();
  const [week, setWeek] = useState<Week>(DEFAULTS);
  const [step, setStep] = useState<Step>("revenue");
  const [connected, setConnected] = useState<string | null>(null);

  const set = (k: keyof Week, v: number) => setWeek((w) => ({ ...w, [k]: v }));
  const progress = ((FULL_ORDER.indexOf(step) + 1) / FULL_ORDER.length) * 100;

  const finish = (next: Week) => {
    saveWeek(next);
    router.push("/app");
  };

  const goBack = (to: Step | "welcome") => {
    if (to === "welcome") router.push("/");
    else setStep(to);
  };

  return (
    <AppShell maxWidth="max-w-md">
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-300"
          style={{ width: connected ? "100%" : `${progress}%` }}
        />
      </div>

      {connected ? (
        <ConnectedStep provider={connected} />
      ) : step === "connect" ? (
        <ConnectStep
          onProvider={(name) => {
            const next: Week = { ...week, cogs: 35, fix: 5620 };
            setWeek(next);
            saveWeek(next);
            setConnected(name);
          }}
          onManual={() => setStep("cogs")}
          onBack={() => setStep("labour")}
        />
      ) : step === "revenue" ? (
        <RevenueStep
          week={week}
          setWeek={setWeek}
          onNext={() => setStep("labour")}
          onBack={() => goBack("welcome")}
        />
      ) : (
        <InputStep
          key={step}
          cfg={INPUTS[step]}
          value={week[INPUTS[step].key]}
          onChange={(v) => set(INPUTS[step].key, v)}
          onNext={() => {
            const n = INPUTS[step].next;
            if (n === "done") finish(week);
            else setStep(n);
          }}
          onBack={() => goBack(INPUTS[step].back)}
        />
      )}
    </AppShell>
  );
}

function fmt(cfg: InputConfig, v: number) {
  return cfg.unit === "money"
    ? money(v)
    : `${v % 1 === 0 ? v : v.toFixed(1)}%`;
}

function InputStep({
  cfg,
  value,
  onChange,
  onNext,
  onBack,
}: {
  cfg: InputConfig;
  value: number;
  onChange: (v: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="fade-up flex flex-1 flex-col">
      <button
        onClick={onBack}
        className="mb-3 -ml-1 inline-flex min-h-[44px] w-fit items-center gap-1 px-1 text-[13px] text-ink/60 hover:text-ink/80"
      >
        <span aria-hidden>←</span> Back
      </button>

      <div className="flex flex-col items-center text-center">
        <StepVisual src={cfg.visual} size={128} />
        <h1 className="mt-4 font-display text-[23px] font-semibold leading-snug tracking-tight text-ink">
          {cfg.title}
        </h1>
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink/65">
          {cfg.blurb}
        </p>
      </div>

      <div className="mt-7 rounded-2xl border border-black/10 bg-white p-5">
        <div className="tnum text-center font-display text-[42px] font-semibold leading-none tracking-tight text-ink">
          {fmt(cfg, value)}
        </div>
        <input
          type="range"
          className="mt-4"
          min={cfg.min}
          max={cfg.max}
          step={cfg.step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={cfg.title}
        />
        <div className="mt-1 flex justify-between text-[11px] text-ink/60">
          <span>{fmt(cfg, cfg.min)}</span>
          <span>{fmt(cfg, cfg.max)}</span>
        </div>
      </div>

      <div className="flex-1" />

      <button
        onClick={onNext}
        className="mt-7 w-full rounded-xl bg-amber-400 py-3.5 font-display text-[15px] font-medium text-amber-950 transition hover:bg-amber-300 active:scale-[0.98]"
      >
        Continue
      </button>
    </div>
  );
}

function RevenueStep({
  week,
  setWeek,
  onNext,
  onBack,
}: {
  week: Week;
  setWeek: (w: Week) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="fade-up flex flex-1 flex-col">
      <button
        onClick={onBack}
        className="mb-3 -ml-1 inline-flex min-h-[44px] w-fit items-center gap-1 px-1 text-[13px] text-ink/60 hover:text-ink/80"
      >
        <span aria-hidden>←</span> Back
      </button>

      <h1 className="mt-1 font-display text-[25px] font-semibold leading-tight tracking-tight text-ink">
        What revenue do you expect next week?
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-ink/65">
        Mon 23 to Sun 29 Jun. Drag the bars to shape your week.
      </p>

      <div className="mt-6 flex items-center justify-between rounded-2xl bg-ink p-5 text-white">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
            Weekly revenue
          </p>
          <p className="tnum mt-1 font-display text-[34px] font-semibold leading-none tracking-tight">
            {money(week.rev)}
          </p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath("/brand/birdee-mark.png")} width={26} height={26} alt="" />
        </span>
      </div>

      <div className="mt-6">
        <RevenueBars
          days={week.days}
          onChange={(i, val) => setWeek(setDay(week, i, val))}
        />
      </div>

      <div className="flex-1" />

      <button
        onClick={onNext}
        className="mt-7 w-full rounded-xl bg-amber-400 py-3.5 font-display text-[15px] font-medium text-amber-950 transition hover:bg-amber-300 active:scale-[0.98]"
      >
        Continue
      </button>
    </div>
  );
}

const PROVIDERS = [
  { name: "Xero", color: "#13B5EA", label: "xero" },
  { name: "MYOB", color: "#6100A5", label: "myob" },
];

function ConnectedStep({ provider }: { provider: string }) {
  return (
    <div className="fade-up flex flex-1 flex-col items-center text-center">
      <StepVisual src={assetPath("/brand/spot-success.png")} size={156} />
      <h1 className="mt-4 font-display text-[23px] font-semibold tracking-tight text-ink">
        Connected to {provider}
      </h1>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink/65">
        Birdie pulled your cost of goods and fixed costs from your P&amp;L.
        You can tweak them anytime.
      </p>
      <div className="flex-1" />
      <Link
        href="/app"
        className="mt-7 block w-full rounded-xl bg-amber-400 py-3.5 text-center font-display text-[15px] font-medium text-amber-950 transition hover:bg-amber-300 active:scale-[0.98]"
      >
        See my week
      </Link>
    </div>
  );
}

function ConnectStep({
  onProvider,
  onManual,
  onBack,
}: {
  onProvider: (name: string) => void;
  onManual: () => void;
  onBack: () => void;
}) {
  const [connecting, setConnecting] = useState<string | null>(null);
  // Simulate the OAuth round-trip so the connect button has a real loading
  // state. A real integration would await the provider and surface errors here.
  const connect = (name: string) => {
    if (connecting) return;
    setConnecting(name);
    setTimeout(() => onProvider(name), 900);
  };

  return (
    <div className="fade-up flex flex-1 flex-col">
      <button
        onClick={onBack}
        disabled={!!connecting}
        className="mb-3 -ml-1 inline-flex min-h-[44px] w-fit items-center gap-1 px-1 text-[13px] text-ink/60 hover:text-ink/80 disabled:opacity-50"
      >
        <span aria-hidden>←</span> Back
      </button>

      <div className="flex flex-col items-center text-center">
        <StepVisual src={assetPath("/brand/spot-connect.png")} size={156} />
        <h1 className="mt-4 font-display text-[23px] font-semibold leading-snug tracking-tight text-ink">
          Now connect your accounting
        </h1>
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink/65">
          Your cost of goods and fixed costs come straight from your P&amp;L.
          Connect once and Birdie fills them in automatically, or enter them
          yourself.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {PROVIDERS.map((p) => {
          const busy = connecting === p.name;
          return (
            <button
              key={p.name}
              onClick={() => connect(p.name)}
              disabled={!!connecting}
              aria-busy={busy}
              className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-3 text-left transition-colors hover:border-black/20 hover:bg-black/[0.02] disabled:cursor-default disabled:hover:border-black/10 disabled:hover:bg-white"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-display text-[12px] font-semibold text-white"
                style={{ backgroundColor: p.color }}
              >
                {p.label}
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-medium text-ink">
                  {busy ? `Connecting to ${p.name}…` : `Connect ${p.name}`}
                </span>
                <span className="block text-[12px] text-ink/60">
                  Auto-fills cost of goods &amp; fixed costs
                </span>
              </span>
              {busy ? (
                <span
                  aria-hidden
                  className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-ink/20 border-t-ink/70"
                />
              ) : (
                <span aria-hidden className="text-ink/60">
                  →
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      <button
        onClick={onManual}
        disabled={!!connecting}
        className="mt-6 flex min-h-[44px] w-full items-center justify-center text-center text-[13px] text-ink/65 underline underline-offset-2 hover:text-ink/80 disabled:opacity-50"
      >
        I&apos;ll enter them manually
      </button>
    </div>
  );
}
