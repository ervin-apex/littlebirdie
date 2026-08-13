import Image from "next/image";
import { LANDING_V2_MEDIA } from "../media";

const VISIBILITY_MOMENTS = [
  {
    id: "yesterday",
    heading: <>Do you know how much profit you made <em>yesterday?</em></>,
    activeQuestion: 0,
    birdee: LANDING_V2_MEDIA.visibility.searchingPoster,
    birdeeAlt: "Little Birdee looking for the answer",
  },
  {
    id: "this-week",
    heading: <>This week?</>,
    activeQuestion: 3,
    birdee: LANDING_V2_MEDIA.visibility.searchingPoster,
    birdeeAlt: "Little Birdee looking ahead to this week",
  },
  {
    id: "why-not",
    heading: <>Sorry, but&hellip; <em>why not?</em></>,
    activeQuestion: -1,
    birdee: LANDING_V2_MEDIA.visibility.whyNotPoster,
    birdeeAlt: "Little Birdee lowering the binoculars",
    answer: <>If you knew this week&rsquo;s probable profit, <strong>you&rsquo;d change something now.</strong></>,
  },
] as const;

const QUESTIONS = ["Yesterday?", "Last week?", "Tomorrow?", "This week?"];

export function VisibilityStory() {
  return (
    <section className="lb2-visibility lb2-flow-story lb2-flow-visibility" id="visibility" aria-labelledby="lb2-visibility-title">
      <h2 className="lb2-sr-only" id="lb2-visibility-title">Do you know your profit now?</h2>

      {VISIBILITY_MOMENTS.map((moment, momentIndex) => (
        <article className="lb2-flow-visibility__moment" data-moment={moment.id} key={moment.id}>
          <div className="lb2-flow-visibility__copy">
            <span className="lb2-flow-index">0{momentIndex + 1}</span>
            <h3>{moment.heading}</h3>
            {"answer" in moment && moment.answer && <p>{moment.answer}</p>}
          </div>

          <div className="lb2-flow-visibility__scene" aria-hidden="true">
            <picture className="lb2-flow-visibility__road">
              <source media="(max-width: 520px)" srcSet={LANDING_V2_MEDIA.visibility.roadMobile} />
              <Image
                src={LANDING_V2_MEDIA.visibility.roadDesktop}
                alt=""
                fill
                sizes="(max-width: 820px) 88vw, 72vw"
              />
            </picture>

            <div className="lb2-flow-visibility__questions">
              {QUESTIONS.map((question, index) => (
                <span className={moment.activeQuestion === index ? "is-active" : ""} key={question}>
                  {question}<b>?</b>
                </span>
              ))}
            </div>

            <div className="lb2-flow-visibility__calendar">
              <Image src={LANDING_V2_MEDIA.visibility.calendar} alt="" fill sizes="180px" />
              <span><b>10<sup>th</sup></b>next month</span>
            </div>

            <div className="lb2-flow-visibility__birdee">
              <Image src={moment.birdee} alt={moment.birdeeAlt} fill sizes="(max-width: 520px) 58vw, 32vw" />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
