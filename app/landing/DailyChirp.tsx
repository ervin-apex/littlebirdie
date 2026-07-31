"use client";

import Image from "next/image";
import { useState } from "react";
import { ChirpBirdeeCanvas } from "./ChirpBirdeeCanvas";

const CHIRPS = {
  morning: { label: "Morning", clock: "8:30", stamp: "8:30 am" },
  afternoon: { label: "Afternoon", clock: "2:30", stamp: "2:30 pm" },
  close: { label: "After close", clock: "9:15", stamp: "9:15 pm" },
} as const;

type ChirpTime = keyof typeof CHIRPS;

const ORDER: ChirpTime[] = ["morning", "afternoon", "close"];

export function DailyChirp() {
  const [chirp, setChirp] = useState<ChirpTime>("morning");
  const active = CHIRPS[chirp];

  return (
    <div className="lb-shell lb-chirp__grid">
      <div className="lb-chirp__copy">
        <p className="lb-eyebrow lb-eyebrow--dark">Daily chirp</p>
        <h2>
          One chirp.
          <br />
          One useful answer.
        </h2>
        <p className="lb-chirp__lede">
          Choose a time that suits you. Birdee gives you a chirp. Tap once to see
          how profit is looking and what moved it.
        </p>

        <ol className="lb-chirp__steps">
          <li>
            <span aria-hidden="true">1</span>
            <div>
              <strong>Choose your time</strong>
              <small>Morning, afternoon or after close.</small>
            </div>
          </li>
          <li>
            <span aria-hidden="true">2</span>
            <div>
              <strong>Get the chirp</strong>
              <small>A small prompt when your numbers are ready.</small>
            </div>
          </li>
          <li>
            <span aria-hidden="true">3</span>
            <div>
              <strong>See your profit</strong>
              <small>One answer, with the numbers behind it nearby.</small>
            </div>
          </li>
        </ol>

        <div className="lb-chirp__try">
          <span className="lb-chirp__try-label" id="lb-chirp-try">
            Try it:
          </span>
          <div
            className="lb-segmented"
            role="group"
            aria-labelledby="lb-chirp-try"
          >
            {ORDER.map((key) => (
              <button
                key={key}
                className="lb-segment"
                type="button"
                onClick={() => setChirp(key)}
                aria-pressed={chirp === key}
              >
                {CHIRPS[key].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lb-chirp__wrap">
        <div className="lb-chirp__stage">
          <span className="lb-chirp__disc" aria-hidden="true" />
          <span className="lb-chirp__bezel" aria-hidden="true" />

          <div
            className="lb-chirp__phone"
            role="img"
            aria-label={`Illustrative Little Birdee lock-screen notification at ${active.stamp} showing profit today of $4,140, ahead of budget`}
          >
            <div className="lb-chirp__screen">
              <div className="lb-chirp__clock">
                <strong className="lb-tnum">{active.clock}</strong>
                <span>Wednesday, 15 May</span>
              </div>
              <div className="lb-chirp__notification">
                <div className="lb-chirp__notification-head">
                  <Image
                    src="/brand/birdee-face-square.png"
                    alt=""
                    width={300}
                    height={300}
                  />
                  <strong>Little Birdee</strong>
                  <time>{active.stamp}</time>
                </div>
                <div className="lb-chirp__notification-body">
                  <span>Profit today</span>
                  <strong className="lb-tnum">$4,140</strong>
                  <small>Ahead of budget. Get in.</small>
                </div>
              </div>
            </div>
          </div>

          <ChirpBirdeeCanvas />
        </div>
      </div>
    </div>
  );
}
