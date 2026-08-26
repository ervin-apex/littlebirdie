import Image from "next/image";
import { CalendarBlank, Timer } from "@phosphor-icons/react/dist/ssr";
import { ChirpBirdeeCanvas } from "../../landing/ChirpBirdeeCanvas";

export function DailyChirpSection() {
  return (
    <section className="lb2-daily" id="daily-chirp" aria-labelledby="lb2-daily-title">
      <div className="lb2-shell lb2-daily__grid">
        <div className="lb2-daily__copy">
          <h2 id="lb2-daily-title">Your<br /><em>Daily Chirp.</em></h2>
          <p>Little Birdee will chirp your profit<br />right to your phone.</p>
          <div className="lb2-daily__proof">
            <span><i><Timer size={25} weight="bold" aria-hidden="true" /></i><b>10 min to set up</b></span>
            <span><i><CalendarBlank size={25} weight="bold" aria-hidden="true" /></i><b>1 min a day</b></span>
          </div>
        </div>

        <div className="lb2-daily__stage">
          <span className="lb2-daily__disc" aria-hidden="true" />
          <span className="lb2-daily__bezel" aria-hidden="true" />
          <div
            className="lb2-daily__phone"
            role="img"
            aria-label="A Daily Chirp showing probable profit this week of $4,140, ahead of budget"
          >
            <div className="lb2-daily__screen">
              <div className="lb2-daily__clock"><span>Monday, May 12</span><strong>9:41</strong></div>
              <div className="lb2-daily__notification">
                <div className="lb2-daily__notification-head">
                  <Image src="/brand/birdee-face-square.png" alt="" width={300} height={300} />
                  <span className="lb2-daily__notification-sender">
                    <strong>Little Birdee</strong>
                    <small>Daily Chirp</small>
                  </span>
                  <time>9:41 AM</time>
                </div>
                <p>
                  <strong>Profit this week: $4,140</strong>
                  <span>Ahead of budget. Get in.</span>
                </p>
              </div>
            </div>
          </div>
          <ChirpBirdeeCanvas />
          <span className="lb2-daily__chirp-line" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
