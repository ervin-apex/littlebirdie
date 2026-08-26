import type { CSSProperties } from "react";
import { LANDING_V2_MEDIA } from "../media";

type CallToActionSectionProps = {
  primaryAction: { href: string };
};

export function CallToActionSection({ primaryAction }: CallToActionSectionProps) {
  const shellStyle = {
    "--lb2-cta-shell-desktop": `url("${LANDING_V2_MEDIA.cta.shellDesktop}")`,
    "--lb2-cta-shell-medium": `url("${LANDING_V2_MEDIA.cta.shellMedium}")`,
    "--lb2-cta-shell-mobile": `url("${LANDING_V2_MEDIA.cta.shellMobile}")`,
  } as CSSProperties;

  return (
    <section
      className="lb2-cta"
      id="get-started"
      aria-labelledby="lb2-cta-title"
    >
      <div className="lb2-cta__stage" style={shellStyle}>
        <div className="lb2-cta__card">
          <h2 id="lb2-cta-title">
            <span>Want to make</span>
            <em>more profit?</em>
          </h2>

          <svg
            className="lb2-cta__underline"
            viewBox="0 0 820 92"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M18 39C210 18 493 15 681 35C715 39 741 43 765 50L711 65C750 66 783 73 805 84" />
          </svg>

          <p className="lb2-cta__support">First, make it visible</p>
          <a className="lb2-cta__button" href={primaryAction.href}>
            Show me my profit
          </a>
          <p className="lb2-cta__trust">
            $12 AUD a week <span aria-hidden="true">•</span> Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
