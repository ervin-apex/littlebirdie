"use client";

import {
  ChartBar,
  ChartPieSlice,
  Cube,
  TrendUp,
  UsersThree,
} from "@phosphor-icons/react";
import { assetPath } from "@/lib/site";

const LEVERS = [
  { label: "Revenue", Icon: ChartBar },
  { label: "Wages", Icon: UsersThree },
  { label: "COGS", Icon: Cube },
  { label: "F+V", Icon: ChartPieSlice },
];

export function WelcomeOnboardingVisual() {
  return (
    <aside className="onboarding-art onboarding-art--welcome" aria-hidden="true">
      <span className="onboarding-flight-streaks">
        <i />
        <i />
        <i />
      </span>

      <div className="onboarding-birdee-stage onboarding-birdee-stage--flying">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetPath("/brand/birdee-reference-welcome-v1.png")}
          alt=""
          className="onboarding-birdee-art"
        />
      </div>

      <div className="onboarding-flow-diagram">
        <div className="onboarding-lever-stack">
          {LEVERS.map(({ label, Icon }) => (
            <div className="onboarding-lever" key={label}>
              <Icon weight="regular" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <svg
          className="onboarding-flow-lines"
          viewBox="0 0 160 292"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <marker
              id="onboarding-flow-arrow"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0 0L10 5L0 10Z" fill="rgba(255,255,255,0.96)" />
            </marker>
          </defs>
          <path d="M0 32C66 32 86 112 146 112" markerEnd="url(#onboarding-flow-arrow)" />
          <path d="M0 108C66 108 86 136 146 136" markerEnd="url(#onboarding-flow-arrow)" />
          <path d="M0 184C66 184 86 160 146 160" markerEnd="url(#onboarding-flow-arrow)" />
          <path d="M0 260C66 260 86 184 146 184" markerEnd="url(#onboarding-flow-arrow)" />
        </svg>

        <div className="onboarding-profit-token">
          <TrendUp weight="bold" />
          <span>Profit now</span>
          <span className="onboarding-profit-chirp">
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
    </aside>
  );
}

export function BusinessOnboardingVisual() {
  return (
    <aside className="onboarding-art onboarding-art--business" aria-hidden="true">
      <div className="onboarding-birdee-stage onboarding-birdee-stage--business">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetPath("/brand/birdee-reference-business-v1.png")}
          alt=""
          className="onboarding-birdee-art"
        />
      </div>
    </aside>
  );
}
