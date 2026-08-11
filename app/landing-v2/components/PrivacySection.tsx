import Image from "next/image";
import { LANDING_V2_MEDIA } from "../media";

const POINTS = [
  "We only use them to calculate your profit.",
  "Remove your data whenever you like.",
  "Cancel anytime. We’ll delete everything.",
] as const;

export function PrivacySection() {
  return (
    <section className="lb2-privacy" id="privacy" aria-labelledby="lb2-privacy-title">
      <div className="lb2-shell lb2-privacy__grid">
        <div className="lb2-privacy__lead">
          <Image src={LANDING_V2_MEDIA.privacy} alt="" width={1254} height={1254} sizes="(max-width: 800px) 58vw, 520px" />
        </div>
        <div className="lb2-privacy__copy">
          <h2 id="lb2-privacy-title">Your numbers<br /><em>stay yours.</em></h2>
          <div className="lb2-privacy__points">
            {POINTS.map((point) => <p key={point}>{point}</p>)}
          </div>
        </div>
      </div>
    </section>
  );
}
