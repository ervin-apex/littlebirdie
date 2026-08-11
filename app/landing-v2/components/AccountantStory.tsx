"use client";

import Image from "next/image";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { LANDING_V2_MEDIA } from "../media";
import { CheckpointVideo } from "../motion/CheckpointVideo";
import { usePrefersReducedMotion, useScrollStage } from "../motion/useScrollStage";
import { accountantAct } from "../motion/timeline";

const ACTS = [
  {
    heading: "But my accountant has that info.",
    emphasis: "They should be telling me this stuff.",
    support: "",
    boardTitle: "YR PROFIT THIS WEEK",
    amount: "?",
    boardNote: "",
    pose: LANDING_V2_MEDIA.accountant.objection,
  },
  {
    heading: "Right.",
    emphasis: "But are they?",
    support: "",
    boardTitle: "YR PROFIT TMRW",
    amount: "?",
    boardNote: "",
    pose: LANDING_V2_MEDIA.accountant.attitude,
  },
  {
    heading: "Accountants report what has already happened.",
    emphasis: "Little Birdee tells you YR PROFIT NOW.",
    support: "",
    boardTitle: "YR PROFIT LAST WEEK",
    amount: "$4,140",
    boardNote: "Profit",
    pose: LANDING_V2_MEDIA.accountant.presenting,
  },
  {
    heading: "So you can",
    emphasis: "do something about it NOW.",
    support: "Proactive, not reactive.",
    boardTitle: "YR PROFIT TMRW",
    amount: "$916",
    boardNote: "probable profit tomorrow",
    pose: LANDING_V2_MEDIA.accountant.action,
  },
] as const;

function useActSwap(actIndex: number, exitMs = 220) {
  const currentRef = useRef(actIndex);
  const [current, setCurrent] = useState(actIndex);
  const [previous, setPrevious] = useState<number | null>(null);

  useEffect(() => {
    if (currentRef.current === actIndex) return;

    setPrevious(currentRef.current);
    currentRef.current = actIndex;
    setCurrent(actIndex);

    const timer = window.setTimeout(() => setPrevious(null), exitMs);
    return () => window.clearTimeout(timer);
  }, [actIndex, exitMs]);

  return { current, previous };
}

function AccountantCopy({ actIndex }: { actIndex: number }) {
  if (actIndex === 0) {
    return (
      <h2>
        <span>But my accountant has that info.</span>
        <span>They should be telling me this stuff.</span>
      </h2>
    );
  }

  if (actIndex === 1) {
    return (
      <>
        <p className="lb2-accountant__ghost">
          But my accountant has that info.<br />
          They should be telling me this stuff.
        </p>
        <h2>
          <span>Right.</span>
          <span className="lb2-accountant__gold">But are they?</span>
        </h2>
      </>
    );
  }

  if (actIndex === 2) {
    return (
      <h2>
        <span className="lb2-accountant__context">
          Accountants report what has already happened.
        </span>
        <span>
          Little Birdee tells you{" "}
          <b className="lb2-accountant__gold">YR PROFIT NOW.</b>
        </span>
      </h2>
    );
  }

  return (
    <>
      <h2>
        <span>So you can</span>
        <span className="lb2-accountant__gold">
          do something about it <b className="lb2-accountant__now">NOW.</b>
        </span>
      </h2>
      <p className="lb2-accountant__support">
        Proactive, <span>not reactive.</span>
      </p>
    </>
  );
}

function TransitionLayers({
  actIndex,
  className,
  exitMs = 220,
  render,
}: {
  actIndex: number;
  className: string;
  exitMs?: number;
  render: (index: number) => ReactNode;
}) {
  const { current, previous } = useActSwap(actIndex, exitMs);

  return (
    <>
      {previous !== null && (
        <div
          className={className}
          data-phase="exit"
          data-copy-act={previous}
          data-next-act={current}
        >
          {render(previous)}
        </div>
      )}
      <div
        key={current}
        className={className}
        data-phase="enter"
        data-copy-act={current}
      >
        {render(current)}
      </div>
    </>
  );
}

function AccountantBoardDetails({ actIndex }: { actIndex: number }) {
  const act = ACTS[actIndex];

  return (
    <>
      <span className="lb2-accountant__board-title">{act.boardTitle}</span>
      <div
        className="lb2-accountant__board-screen"
        data-value={act.amount === "?" ? "unknown" : "profit"}
      >
        <strong>{act.amount}</strong>
        {act.boardNote && <small>{act.boardNote}</small>}
      </div>
    </>
  );
}

function AccountantBird({
  actIndex,
  videoFailed,
  onVideoError,
}: {
  actIndex: number;
  videoFailed: boolean;
  onVideoError: () => void;
}) {
  if (!videoFailed) {
    return (
      <CheckpointVideo
        activeIndex={actIndex}
        checkpoints={LANDING_V2_MEDIA.accountant.checkpointSegments}
        className="lb2-accountant__bird-media"
        delayMs={70}
        poster={LANDING_V2_MEDIA.accountant.checkpointPoster}
        source={LANDING_V2_MEDIA.accountant.checkpointMaster}
        onError={onVideoError}
      />
    );
  }

  return (
    <Image
      src={ACTS[actIndex].pose}
      alt=""
      fill
      sizes="(max-width: 820px) 48vw, 27vw"
    />
  );
}

export function AccountantStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollStage(sectionRef);
  const reduced = usePrefersReducedMotion();
  const [videoFailed, setVideoFailed] = useState(false);
  const actIndex = accountantAct(progress);

  if (reduced) {
    return (
      <section
        className="lb2-accountant lb2-reduced-story lb2-reduced-story--dark"
        id="accountant"
        aria-labelledby="lb2-accountant-title"
      >
        <div className="lb2-shell">
          <h2 id="lb2-accountant-title">The accountant question, answered plainly.</h2>
          <div className="lb2-reduced-story__grid lb2-reduced-story__grid--four">
            {ACTS.map((item) => (
              <article key={item.boardTitle + item.amount}>
                <div className="lb2-reduced-story__pose">
                  <Image src={item.pose} alt="" fill sizes="(max-width: 700px) 70vw, 22vw" />
                </div>
                <h3>{item.heading} <em>{item.emphasis}</em></h3>
                <div className="lb2-reduced-story__score">
                  <small>{item.boardTitle}</small>
                  <strong>{item.amount}</strong>
                  {item.boardNote && <b>{item.boardNote}</b>}
                </div>
                {item.support && <p>{item.support}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="lb2-accountant lb2-scroll-story"
      id="accountant"
      aria-labelledby="lb2-accountant-title"
    >
      <div className="lb2-scroll-story__sticky">
        <div className="lb2-accountant__stage" data-act={actIndex} aria-hidden="true">
          <div className="lb2-accountant__copy">
            <TransitionLayers
              actIndex={actIndex}
              className="lb2-accountant__copy-layer"
              exitMs={420}
              render={(index) => <AccountantCopy actIndex={index} />}
            />
          </div>

          <div className="lb2-accountant__scene">
            <span className="lb2-accountant__line" />

            <div className="lb2-accountant__receipt">
              <Image src={LANDING_V2_MEDIA.accountant.receipt} alt="" fill sizes="(max-width: 820px) 48vw, 31vw" />
              <div>
                <span>LAST MONTH<br />YOU MADE</span>
                <i />
                <strong>$15,470</strong>
                <b>Profit</b>
              </div>
            </div>

            <div className="lb2-accountant__bird">
              <AccountantBird
                actIndex={actIndex}
                videoFailed={videoFailed}
                onVideoError={() => setVideoFailed(true)}
              />
            </div>

            <div className="lb2-accountant__board">
              <Image src={LANDING_V2_MEDIA.accountant.board} alt="" fill sizes="(max-width: 820px) 52vw, 38vw" />
              <TransitionLayers
                actIndex={actIndex}
                className="lb2-accountant__board-layer"
                render={(index) => <AccountantBoardDetails actIndex={index} />}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="lb2-sr-only">
        <h2 id="lb2-accountant-title">Little Birdee gives you profit you can act on</h2>
        <ol>
          {ACTS.map((item) => (
            <li key={item.boardTitle + item.amount}>
              {item.heading} {item.emphasis} Last month you made $15,470 profit. {item.boardTitle}: {item.amount}. {item.boardNote} {item.support}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
