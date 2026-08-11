import Image from "next/image";
import { HeroBirdeeV2 } from "./HeroBirdeeV2";
import { LANDING_V2_MEDIA } from "../media";

type HeroSectionProps = {
  primaryAction: { href: string; label: string };
};

export function HeroSection({ primaryAction }: HeroSectionProps) {
  return (
    <section className="lb2-hero" id="top" aria-labelledby="lb2-hero-title">
      <svg
        className="lb2-hero__curve lb2-hero__curve--desktop"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 0H405C430 120 625 190 635 500C642 730 555 905 505 1000H0Z" />
      </svg>
      <svg
        className="lb2-hero__curve lb2-hero__curve--mobile"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 0H355C405 115 695 235 710 520C720 760 595 925 420 1000H0Z" />
      </svg>
      <div className="lb2-shell lb2-hero__inner">
        <div className="lb2-hero__copy">
          <h1 id="lb2-hero-title">
            Improve
            <br />
            yr profit.
          </h1>
          <div className="lb2-hero__lede">
            <p>Your profit, visible and increasable.</p>
            <div className="lb2-hero__price-line">
              <p>For <strong>$12 AUD</strong> a week.</p>
              <div className="lb2-hero__coffee-art" aria-label="About the price of two coffees">
                <Image src={LANDING_V2_MEDIA.pricing.coffees} alt="" fill sizes="120px" priority />
                <Image className="lb2-hero__coffee-mark lb2-hero__coffee-mark--one" src="/brand/birdee-face-square.png" alt="" width={300} height={300} />
                <Image className="lb2-hero__coffee-mark lb2-hero__coffee-mark--two" src="/brand/birdee-face-square.png" alt="" width={300} height={300} />
              </div>
            </div>
          </div>
          <div className="lb2-hero__actions">
            <a className="lb2-button lb2-button--primary" href={primaryAction.href}>
              {primaryAction.label}
            </a>
          </div>
        </div>

        <div className="lb2-hero__stage" aria-hidden="true">
          <HeroBirdeeV2 />
        </div>
      </div>
    </section>
  );
}
