import Image from "next/image";
import { LANDING_V2_MEDIA } from "../media";

export function FitSection() {
  return (
    <section className="lb2-fit" id="who-its-for" aria-labelledby="lb2-fit-title">
      <div className="lb2-shell lb2-fit__frame">
        <div className="lb2-fit__heading">
          <p className="lb2-kicker">What we do.</p>
          <h2 id="lb2-fit-title">Simply show you<br /><em>your profit</em> in real time.</h2>
        </div>
        <div className="lb2-fit__stage" aria-hidden="true">
          <Image className="lb2-fit__for" src={LANDING_V2_MEDIA.fit.forBoard} alt="" width={1568} height={1003} sizes="(max-width: 800px) 94vw, 57vw" />
          <Image className="lb2-fit__birdee" src={LANDING_V2_MEDIA.fit.birdee} alt="" width={1254} height={1254} sizes="(max-width: 800px) 45vw, 24vw" />
          <Image className="lb2-fit__not-for" src={LANDING_V2_MEDIA.fit.notForBoard} alt="" width={1365} height={1152} sizes="(max-width: 800px) 43vw, 22vw" />
        </div>
        <div className="lb2-fit__dont">
          <strong>WHAT WE DON&rsquo;T DO.</strong>
          <p>Tell you how to run your business. Take up your time.<br />Cost you an arm and a leg.</p>
        </div>
        <div className="lb2-sr-only">
          <h3>Who it&rsquo;s for</h3>
          <p>Hospitality, retail, gyms, hairdressers, Pilates, plumbers and exotic pet stores. You get the idea.</p>
          <h3>Who it&rsquo;s not for</h3>
          <p>E-commerce, and those that do not want more profit.</p>
        </div>
      </div>
    </section>
  );
}
