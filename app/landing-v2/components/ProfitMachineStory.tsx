import Image from "next/image";
import { LANDING_V2_MACHINE_PORTRAIT, LANDING_V2_MEDIA } from "../media";

const MACHINE_MOMENTS = [
  { id: "historical", lead: "Takes", accent: "historical numbers", tail: "from yr business." },
  { id: "prediction", lead: "Plus", accent: "a prediction of revenue", tail: "from yr experience." },
  { id: "packages", lead: "Packages", accent: "it up.", tail: "" },
  { id: "impact", lead: "So you can", accent: "impact yr profit", tail: "in real time." },
  { id: "budget-actual", lead: "Then compares that", accent: "budget to actual", tail: "" },
] as const;

export function ProfitMachineStory() {
  return (
    <section className="lb2-machine lb2-flow-story lb2-flow-machine" id="how-it-works" aria-labelledby="lb2-machine-title">
      <h2 className="lb2-sr-only" id="lb2-machine-title">Your probable profit, before it happens</h2>

      {MACHINE_MOMENTS.map((moment, index) => (
        <article className="lb2-flow-machine__moment" data-moment={moment.id} key={moment.id}>
          <div className="lb2-flow-machine__copy">
            <p>What Little Birdee does.</p>
            <h3>{moment.lead} <em>{moment.accent}</em>{moment.tail && <> {moment.tail}</>}</h3>
          </div>

          {/*
            * The stage is what is left of the chapter once the heading has taken
            * its room. It is a size container, so the plate inside can be sized
            * against that leftover height instead of against a guess at it.
            */}
          <div className="lb2-flow-machine__stage">
            <picture className="lb2-flow-machine__picture">
              <source media={LANDING_V2_MACHINE_PORTRAIT} srcSet={LANDING_V2_MEDIA.machine.portraitSequence[index]} />
              <Image
                src={LANDING_V2_MEDIA.machine.desktopSequence[index]}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
              />
            </picture>
          </div>
        </article>
      ))}
    </section>
  );
}
