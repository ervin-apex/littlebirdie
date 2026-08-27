import Image from "next/image";
import {
  LANDING_V2_MACHINE_MEDIUM,
  LANDING_V2_MACHINE_PORTRAIT,
  LANDING_V2_MEDIA,
} from "../media";

type MachinePlateProps = {
  page: "inputs" | "outcome";
  priority?: boolean;
};

function MachinePlate({ page, priority = false }: MachinePlateProps) {
  const artwork = LANDING_V2_MEDIA.machine.twoPage[page];
  const alt = page === "inputs"
    ? "Little Birdee loading historical numbers and a revenue prediction into the profit machine"
    : "The profit machine showing $4,140 probable profit this week while Little Birdee holds the actual figure of $4,320";

  return (
    <div className="lb2-machine-page__art">
      <picture className="lb2-machine-page__picture">
        <source media={LANDING_V2_MACHINE_PORTRAIT} srcSet={artwork.portrait} />
        <source media={LANDING_V2_MACHINE_MEDIUM} srcSet={artwork.medium} />
        <Image
          src={artwork.wide}
          alt={alt}
          fill
          priority={priority}
          sizes="100vw"
        />
      </picture>
    </div>
  );
}

export function ProfitMachineStory() {
  return (
    <section
      className="lb2-machine lb2-machine-pages"
      id="how-it-works"
      aria-labelledby="lb2-machine-title"
    >
      <h2 className="lb2-sr-only" id="lb2-machine-title">
        How it works
      </h2>

      <article className="lb2-machine-page" data-page="inputs">
        <div className="lb2-machine-page__copy">
          <p>How it works</p>
          <h3>
            <span className="lb2-machine-page__primary">
              Takes <em>historical numbers</em>
              <span>from your business</span>
            </span>
            <span className="lb2-machine-page__support">
              Plus a <em>prediction of revenue</em> from your experience
            </span>
          </h3>
        </div>
        <MachinePlate page="inputs" priority />
      </article>

      <article className="lb2-machine-page" data-page="outcome">
        <div className="lb2-machine-page__copy lb2-machine-page__copy--outcome">
          <h3>
            <span className="lb2-machine-page__setup">Packages it up</span>
            <span className="lb2-machine-page__comparison">Then compares budget to actual</span>
            <span className="lb2-machine-page__bridge">So you can</span>
            <em className="lb2-machine-page__payoff">Impact your profit</em>
            <span className="lb2-machine-page__time">in real time</span>
          </h3>
        </div>
        <MachinePlate page="outcome" />
      </article>
    </section>
  );
}
