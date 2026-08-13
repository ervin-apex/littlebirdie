import Image from "next/image";
import { LANDING_V2_MEDIA } from "../media";

const MACHINE_MOMENTS = [
  { lead: "Takes", accent: "historical numbers", tail: "from yr business." },
  { lead: "Plus", accent: "a prediction of revenue", tail: "from yr experience." },
  { lead: "Packages", accent: "it up.", tail: "" },
  { lead: "So you can", accent: "impact yr profit", tail: "in real time." },
  { lead: "Then compares that", accent: "budget to actual", tail: "" },
] as const;

export function ProfitMachineStory() {
  return (
    <section className="lb2-machine lb2-flow-story lb2-flow-machine" id="how-it-works" aria-labelledby="lb2-machine-title">
      <div className="lb2-flow-machine__intro">
        <p>What Little Birdee does.</p>
        <h2 id="lb2-machine-title">Your probable profit, <em>before it happens.</em></h2>
      </div>

      {MACHINE_MOMENTS.map((moment, index) => (
        <article className="lb2-flow-machine__moment" key={moment.accent}>
          <div className="lb2-flow-machine__copy">
            <span className="lb2-flow-index">0{index + 1}</span>
            <p>What Little Birdee does.</p>
            <h3>{moment.lead} <em>{moment.accent}</em>{moment.tail && <> {moment.tail}</>}</h3>
          </div>

          <picture className="lb2-flow-machine__picture">
            <source media="(max-width: 520px)" srcSet={LANDING_V2_MEDIA.machine.phoneSequence[index]} />
            <source media="(max-width: 820px)" srcSet={LANDING_V2_MEDIA.machine.mobileSequence[index]} />
            <Image
              src={LANDING_V2_MEDIA.machine.desktopSequence[index]}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
            />
          </picture>
        </article>
      ))}
    </section>
  );
}
