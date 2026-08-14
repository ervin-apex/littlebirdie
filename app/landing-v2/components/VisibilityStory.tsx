import Image from "next/image";
import { LANDING_V2_MEDIA } from "../media";

const QUESTIONS = ["Yesterday?", "Last week?", "Tomorrow?", "This week?"] as const;

const VISIBILITY_MOMENTS = [
  {
    id: "yesterday",
    heading: <>
      Do you know how much profit you made <em>yesterday?</em>
    </>,
    activeQuestion: 0,
    wide: LANDING_V2_MEDIA.visibility.journey.yesterdayWide,
    mobile: LANDING_V2_MEDIA.visibility.journey.yesterdayMobile,
  },
  {
    id: "this-week",
    heading: <>This week?</>,
    activeQuestion: 3,
    wide: LANDING_V2_MEDIA.visibility.journey.thisWeekWide,
    mobile: LANDING_V2_MEDIA.visibility.journey.thisWeekMobile,
  },
  {
    id: "why-not",
    heading: <>Sorry, but&hellip; <em>why not?</em></>,
    activeQuestion: -1,
    wide: LANDING_V2_MEDIA.visibility.journey.whyNotWide,
    mobile: LANDING_V2_MEDIA.visibility.journey.whyNotMobile,
    answer: <>
      If you knew this week&rsquo;s probable profit,
      <strong>you&rsquo;d change something now.</strong>
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
          {/*
            The stage reproduces the box `object-fit: cover` gives the plate, so
            the questions and the calendar can be placed as percentages of the
            artwork and stay pinned to the road however the plate is cropped.
          */}
          <div className="lb2-flow-visibility__stage" aria-hidden="true">
            <picture className="lb2-flow-visibility__plate">
              <source media="(max-width: 820px)" srcSet={moment.mobile} />
              <Image
                src={moment.wide}
                alt=""
                fill
                priority
                sizes="100vw"
              />
            </picture>

            <div className="lb2-flow-visibility__questions">
              {QUESTIONS.map((question, questionIndex) => (
                <span
                  className={moment.activeQuestion === questionIndex ? "is-active" : ""}
                  key={question}
                >
                  {question}
                  <b>?</b>
                </span>
              ))}
            </div>

            <div className="lb2-flow-visibility__calendar">
              <Image src={LANDING_V2_MEDIA.visibility.calendar} alt="" fill sizes="180px" />
              <span><b>10<sup>th</sup></b>next month</span>
            </div>
          </div>

          <div className="lb2-flow-visibility__copy">
            <h3>{moment.heading}</h3>
            {"answer" in moment && moment.answer && <p>{moment.answer}</p>}
          </div>
        </article>
      ))}
    </section>
  );
}
