"use client";

import Image from "next/image";
import { Check, ClockCounterClockwise, Flask } from "@phosphor-icons/react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

type Lens = "whatif" | "happened";

const ORDER: Lens[] = ["whatif", "happened"];

const BASE_PROFIT = 4140;
const PROFIT_PER_PCT = 268;
const PCT_MIN = -10;
const PCT_MAX = 10;

const money = (value: number) => `$${Math.round(value).toLocaleString("en-AU")}`;

const signedPct = (pct: number) => {
  if (pct === 0) return "0%";
  return pct > 0 ? `+${pct}%` : `−${Math.abs(pct)}%`;
};

/* The switch means two different things at two sizes, so it carries two
   different contracts rather than one that half-fits both.
   Wide: both panels are on screen together — that side-by-side *is* the section's
   argument ("See what's coming. See what happened."), so the switch only shifts
   emphasis. Toggle buttons with aria-pressed.
   Narrow: the panels stack, so showing both costs a screen of scrolling and the
   switch has nothing visible to do. One panel at a time, as real tabs with
   arrow-key support.
   Emphasis is carried by the surface — background, border, tactile shadow — and
   never by dimming text: the inactive panel at the opacity that would read as
   clearly secondary also drops its body copy to ~3.9:1. */
export function DifferenceLens() {
  const sliderId = useId();
  const idBase = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<Lens, HTMLButtonElement | null>>({
    whatif: null,
    happened: null,
  });

  const [pct, setPct] = useState(5);
  const [lens, setLens] = useState<Lens>("whatif");
  const [dragFrac, setDragFrac] = useState<number | null>(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsCompact(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const delta = pct * PROFIT_PER_PCT;
  const tone = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const deltaLabel =
    (delta > 0 ? "↑ " : delta < 0 ? "↓ " : "") + money(Math.abs(delta));

  const knobPos =
    dragFrac !== null
      ? `${(dragFrac * 100).toFixed(1)}%`
      : lens === "whatif"
        ? "18%"
        : "82%";

  const fracFromEvent = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragFrac(fracFromEvent(event.clientX));

    const move = (moveEvent: globalThis.PointerEvent) =>
      setDragFrac(fracFromEvent(moveEvent.clientX));

    const up = (upEvent: globalThis.PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setLens(fracFromEvent(upEvent.clientX) > 0.5 ? "happened" : "whatif");
      setDragFrac(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onTabKeys = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = ORDER.indexOf(lens);
    let next: Lens | undefined;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = ORDER[(index + 1) % ORDER.length];
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = ORDER[(index - 1 + ORDER.length) % ORDER.length];
    } else if (event.key === "Home") {
      next = ORDER[0];
    } else if (event.key === "End") {
      next = ORDER[ORDER.length - 1];
    }

    if (!next) return;
    event.preventDefault();
    setLens(next);
    chipRefs.current[next]?.focus();
  };

  const tabId = (lensName: Lens) => `${idBase}-${lensName}-tab`;
  const panelId = (lensName: Lens) => `${idBase}-${lensName}-panel`;

  const chipProps = (lensName: Lens) => {
    const active = lens === lensName;
    return {
      ref: (node: HTMLButtonElement | null) => {
        chipRefs.current[lensName] = node;
      },
      className: "lb-lens__chip",
      type: "button" as const,
      "data-active": active,
      onClick: () => setLens(lensName),
      ...(isCompact
        ? {
            role: "tab",
            "aria-selected": active,
            "aria-controls": panelId(lensName),
            id: tabId(lensName),
            tabIndex: active ? 0 : -1,
            onKeyDown: onTabKeys,
          }
        : { "aria-pressed": active }),
    };
  };

  const panelProps = (lensName: Lens) => {
    const active = lens === lensName;
    return {
      className: "lb-panel",
      "data-active": active,
      ...(isCompact
        ? {
            role: "tabpanel",
            id: panelId(lensName),
            "aria-labelledby": tabId(lensName),
            hidden: !active,
            tabIndex: 0,
          }
        : {}),
    };
  };

  return (
    <>
      <div className="lb-lens">
        <Image
          className="lb-lens__bird"
          src="/brand/birdee-reference-neutral-v1.png"
          alt=""
          width={655}
          height={760}
          sizes="136px"
        />

        <div
          className="lb-lens__switch"
          role={isCompact ? "tablist" : "group"}
          aria-label="Choose a view"
        >
          <span className="lb-lens__shadow" aria-hidden="true" />

          <button {...chipProps("whatif")}>
            <Flask size={18} weight="bold" aria-hidden="true" />
            What if
          </button>

          {/* Decorative twin of the two chips: the same choice, expressed as a
              lever Birdee is perched on. Keyboard and AT users get the chips. */}
          <div
            ref={trackRef}
            className="lb-lens__track"
            data-dragging={dragFrac !== null}
            onPointerDown={startDrag}
            aria-hidden="true"
          >
            <b className="lb-lens__knob" style={{ left: knobPos }} />
          </div>

          <button {...chipProps("happened")}>
            <ClockCounterClockwise size={18} weight="bold" aria-hidden="true" />
            What happened
          </button>
        </div>
      </div>

      <div className="lb-different__panels">
        <article {...panelProps("whatif")}>
          <span className="lb-panel__tag">What if</span>
          <h3>See your next move.</h3>
          <p className="lb-panel__question">
            What if I increase prices by {signedPct(pct)}?
          </p>

          <div className="lb-lever">
            <div className="lb-lever__scale" aria-hidden="true">
              <span>&minus;10%</span>
              <span>&minus;5%</span>
              <span>Base</span>
              <span>+5%</span>
              <span>+10%</span>
            </div>
            <input
              id={sliderId}
              className="lb-range"
              type="range"
              min={PCT_MIN}
              max={PCT_MAX}
              step={1}
              value={pct}
              aria-label="Price change percentage"
              aria-valuetext={signedPct(pct)}
              onChange={(event) => setPct(Number(event.target.value))}
              style={
                {
                  "--lb-range-fill": `${((pct - PCT_MIN) / (PCT_MAX - PCT_MIN)) * 100}%`,
                } as CSSProperties
              }
            />
            <p className="lb-lever__hint">
              Drag the lever. Profit updates as you go.
            </p>
          </div>

          <div className="lb-projection">
            <span className="lb-projection__figure">
              <small>Projected profit</small>
              <strong className="lb-tnum" aria-live="polite">
                {money(BASE_PROFIT + delta)}
              </strong>
            </span>
            <span className="lb-projection__delta lb-tnum" data-tone={tone}>
              {deltaLabel}
            </span>
          </div>
        </article>

        <article {...panelProps("happened")}>
          <span className="lb-panel__tag">What happened</span>
          <h3>Know why it changed.</h3>
          <ul className="lb-drivers">
            <li>
              <strong>Wages were higher than expected</strong>
              <small className="lb-tnum" data-tone="down">
                +$1,260
              </small>
            </li>
            <li>
              <strong>Revenue ahead of forecast</strong>
              <small className="lb-tnum" data-tone="up">
                +$2,420
              </small>
            </li>
          </ul>
          <div className="lb-explained">
            <span className="lb-explained__figure">
              <small>That&rsquo;s why profit is</small>
              <strong className="lb-tnum">{money(BASE_PROFIT)}</strong>
            </span>
            <span className="lb-explained__seal" aria-hidden="true">
              <Check size={19} weight="bold" />
            </span>
          </div>
        </article>
      </div>
    </>
  );
}
