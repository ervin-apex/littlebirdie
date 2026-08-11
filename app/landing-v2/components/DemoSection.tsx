import Image from "next/image";
import { Play } from "@phosphor-icons/react/dist/ssr";
import { LANDING_V2_MEDIA } from "../media";

export function DemoSection() {
  return (
    <section className="lb2-demo" id="demo" aria-labelledby="lb2-demo-title">
      <div className="lb2-shell lb2-demo__panel">
        <div className="lb2-demo__heading">
          <h2 id="lb2-demo-title">See <em>Little Birdee</em> in action.</h2>
          <p>A quick look at how it all works.</p>
        </div>
        <div className="lb2-demo__frame" role="img" aria-label="Little Birdee product demo video coming soon">
          <div className="lb2-demo__phone" aria-hidden="true">
            <span>9:41</span>
            <div><small>YR PROFIT THIS WEEK</small><strong>$4,140</strong><b>Ahead of budget. Get in.</b></div>
          </div>
          <span className="lb2-demo__play" aria-hidden="true"><Play size={48} weight="fill" /></span>
          <span className="lb2-demo__watch">WATCH DEMO</span>
          <Image className="lb2-demo__birdee" src={LANDING_V2_MEDIA.fit.birdee} alt="" width={1254} height={1254} sizes="34vw" />
          <div className="lb2-demo__controls" aria-hidden="true"><Play size={20} weight="fill" /><i /><span>◖))</span><b>⌗</b></div>
        </div>
      </div>
    </section>
  );
}
