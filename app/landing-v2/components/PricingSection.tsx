import Image from "next/image";
import { ArrowBendDownRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { LANDING_V2_MEDIA } from "../media";

type PricingSectionProps = {
  primaryAction: { href: string; label: string };
};

const PROMISES = [
  ["No introductory offer.", "No free trial."],
  ["No 45-minute sales call.", "No tiered pricing."],
  ["No lock-in.", "Cancel anytime."],
] as const;

export function PricingSection({ primaryAction }: PricingSectionProps) {
  return (
    <section className="lb2-pricing" id="pricing" aria-labelledby="lb2-pricing-title">
      <div className="lb2-shell lb2-pricing__main">
        <div className="lb2-pricing__price">
          <div className="lb2-pricing__amount">
            <strong><sup>$</sup>12</strong>
            <span>AUD<br />a week.</span>
          </div>
          <h2 id="lb2-pricing-title">That&rsquo;s the price.</h2>
          <a className="lb2-button lb2-button--ink" href={primaryAction.href}>
            {primaryAction.label}<ArrowUpRight size={21} weight="bold" aria-hidden="true" />
          </a>
        </div>

        <div className="lb2-pricing__coffee" aria-label="About the price of two coffees">
          <ArrowBendDownRight size={42} weight="bold" aria-hidden="true" />
          <div className="lb2-pricing__coffee-art" aria-hidden="true">
            <Image src={LANDING_V2_MEDIA.pricing.coffees} alt="" fill sizes="230px" />
            <Image className="lb2-pricing__coffee-mark lb2-pricing__coffee-mark--one" src="/brand/birdee-face-square.png" alt="" width={300} height={300} />
            <Image className="lb2-pricing__coffee-mark lb2-pricing__coffee-mark--two" src="/brand/birdee-face-square.png" alt="" width={300} height={300} />
          </div>
        </div>

        <div className="lb2-pricing__aside">
          <div className="lb2-pricing__bubble">And we&rsquo;re not trying to sell you a course.</div>
          <Image src={LANDING_V2_MEDIA.pricing.birdee} alt="" width={1254} height={1254} sizes="340px" />
        </div>
      </div>

      <div className="lb2-shell lb2-pricing__promises">
        {PROMISES.map((group) => (
          <div key={group[0]}>
            <p>{group[0]}<br />{group[1]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
