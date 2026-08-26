import Image from "next/image";
import { LANDING_V2_MEDIA } from "../media";

const SUPPORT_CALLS = [
  { day: "Tuesday", time: "4pm AEST" },
  { day: "Thursday", time: "4pm AEST" },
] as const;

export function CommunitySection() {
  return (
    <section
      className="lb2-community"
      id="community"
      aria-labelledby="lb2-community-title"
    >
      <div className="lb2-shell lb2-community__grid">
        <div className="lb2-community__scene" aria-hidden="true">
          <Image
            src={LANDING_V2_MEDIA.community.supportCall}
            alt=""
            width={1469}
            height={1071}
            sizes="(max-width: 820px) 108vw, (max-width: 1100px) 82vw, 48vw"
          />
        </div>

        <div className="lb2-community__copy">
          <h2 id="lb2-community-title">Community</h2>
          <p className="lb2-community__lead">Two group support calls a week</p>

          <div className="lb2-community__schedule">
            {SUPPORT_CALLS.map((call) => (
              <p key={call.day}>
                <span>{call.day}</span>{" "}
                <time dateTime="16:00+10:00">{call.time}</time>
              </p>
            ))}
          </div>

          <div className="lb2-community__discord">
            <Image
              src={LANDING_V2_MEDIA.community.discordSymbol}
              alt=""
              width={64}
              height={48}
            />
            <div>
              <h3>Little Birdee Discord</h3>
              <p>Connect and riff about your business and industry</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
