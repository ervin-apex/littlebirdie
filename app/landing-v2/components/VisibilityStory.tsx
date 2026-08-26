import Image from "next/image";
import { LANDING_V2_MEDIA } from "../media";

const VISIBILITY_MOMENTS = [
  {
    id: "yesterday",
    heading: <>
      <span>Do you know how much</span>
      <span>profit your business made</span>
      <em>yesterday?</em>
    </>,
  },
  {
    id: "why-not",
    heading: <>Sorry, but&hellip; <em>why not?</em></>,
    answer: <>
      <span>If you could see this week&rsquo;s probable profit</span>
      <strong>you&rsquo;d try and improve it, right?</strong>
    </>,
  },
] as const;

export function VisibilityStory() {
  return (
    <section
      className="lb2-visibility lb2-flow-story lb2-flow-visibility"
      id="visibility"
      aria-labelledby="lb2-visibility-title"
    >
      <h2 className="lb2-sr-only" id="lb2-visibility-title">
        Do you know your profit now?
      </h2>

      {VISIBILITY_MOMENTS.map((moment) => (
        <article
          className="lb2-flow-visibility__moment"
          data-moment={moment.id}
          key={moment.id}
        >
          {moment.id === "yesterday" ? (
            <div className="lb2-flow-visibility__approved">
              <div className="lb2-flow-visibility__copy lb2-flow-visibility__approved-copy">
                <h3>{moment.heading}</h3>
                <div className="lb2-flow-visibility__alternatives" aria-label="Other profit periods">
                  <p>or tomorrow</p>
                  <p>or last week</p>
                  <p>or next week</p>
                </div>
              </div>

              <Image
                className="lb2-flow-visibility__approved-birdee"
                src={LANDING_V2_MEDIA.visibility.searching}
                alt=""
                width={1254}
                height={1254}
                priority
                sizes="(max-width: 820px) 72vw, (max-width: 1100px) 48vw, 34vw"
              />
            </div>
          ) : (
            <div className="lb2-flow-visibility__why-not">
              <div className="lb2-flow-visibility__why-not-copy">
                <h3>{moment.heading}</h3>
                {moment.answer && <p>{moment.answer}</p>}
              </div>

              <Image
                className="lb2-flow-visibility__why-not-birdee"
                src={LANDING_V2_MEDIA.visibility.concerned}
                alt=""
                width={1254}
                height={1254}
                priority
                sizes="(max-width: 820px) 134vw, (max-width: 1100px) 74vw, 56vw"
              />
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
