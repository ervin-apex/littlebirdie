"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { LANDING_V2_MEDIA } from "../media";
import { OneShotVideo } from "../motion/OneShotVideo";
import { visibilityAct } from "../motion/timeline";
import { useRichStoryMedia } from "../motion/useRichStoryMedia";
import { usePrefersReducedMotion, useScrollStage } from "../motion/useScrollStage";

const QUESTIONS = ["Yesterday?", "Last week?", "Tomorrow?", "This week?"];

export function VisibilityStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollStage(sectionRef);
  const reduced = usePrefersReducedMotion();
  const richMedia = useRichStoryMedia();
  const [videoFailed, setVideoFailed] = useState(false);
  const act = visibilityAct(progress);

  if (reduced) {
    return (
      <section
        className="lb2-visibility lb2-reduced-story"
        id="visibility"
        aria-labelledby="lb2-visibility-title"
      >
        <div className="lb2-shell">
          <h2 id="lb2-visibility-title">Do you know your profit <em>now?</em></h2>
          <div className="lb2-reduced-story__grid">
            <article>
              <div className="lb2-reduced-story__media">
                <Image src={LANDING_V2_MEDIA.visibility.searchingPoster} alt="Little Birdee looking for the answer" fill sizes="92vw" />
              </div>
              <span>01</span>
              <h3>Do you know how much profit you made <em>yesterday?</em></h3>
            </article>
            <article>
              <div className="lb2-reduced-story__media">
                <Image src={LANDING_V2_MEDIA.visibility.searchingPoster} alt="Little Birdee still looking for the answer" fill sizes="92vw" />
              </div>
              <span>02</span>
              <h3><em>This week?</em></h3>
            </article>
            <article>
              <div className="lb2-reduced-story__media">
                <Image src={LANDING_V2_MEDIA.visibility.whyNotPoster} alt="Little Birdee lowering the binoculars" fill sizes="92vw" />
              </div>
              <span>03</span>
              <h3>Sorry, but… <em>why not?</em></h3>
              <p>If you knew this week&rsquo;s probable profit, you&rsquo;d change something now.</p>
            </article>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="lb2-visibility lb2-scroll-story"
      id="visibility"
      aria-labelledby="lb2-visibility-title"
    >
      <div className="lb2-scroll-story__sticky">
        <div className="lb2-visibility__stage" data-act={act} aria-hidden="true">
          <div className="lb2-visibility__headline">
            <h2 data-visible={act === 0}>
              Do you know how much<br className="lb2-visibility__desktop-break" /> profit you made <br className="lb2-visibility__mobile-break" />yesterday?
            </h2>
            <h2 data-visible={act === 1}>This week?</h2>
            <h2 className="lb2-visibility__why" data-visible={act === 2}>
              Sorry, but…<br /><em>why not?</em>
            </h2>
          </div>

          <div className="lb2-visibility__scene">
            <picture className="lb2-visibility__road">
              <source media="(max-width: 520px)" srcSet={LANDING_V2_MEDIA.visibility.roadMobile} />
              <Image src={LANDING_V2_MEDIA.visibility.roadDesktop} alt="" fill sizes="100vw" />
            </picture>

            <div className="lb2-visibility__questions">
              {QUESTIONS.map((question, index) => (
                <div
                  key={question}
                  className={(act === 0 && index === 0) || (act === 1 && index === 3) ? "is-active" : ""}
                >
                  <span>{question}</span><b>?</b>
                </div>
              ))}
            </div>

            <div className="lb2-visibility__calendar">
              <Image src={LANDING_V2_MEDIA.visibility.calendar} alt="" fill sizes="180px" />
              <span><b>10<sup>th</sup></b>next month</span>
            </div>

            <div className="lb2-visibility__birdee">
              {richMedia && !videoFailed && (
                <>
                  <OneShotVideo
                    active={act < 2}
                    className="lb2-visibility__searching"
                    playKey={act}
                    playbackRate={1.45}
                    poster={LANDING_V2_MEDIA.visibility.searchingPoster}
                    src={LANDING_V2_MEDIA.visibility.searching}
                    onError={() => setVideoFailed(true)}
                  />
                  <OneShotVideo
                    active={act === 2}
                    className="lb2-visibility__lowering"
                    playKey={act}
                    playbackRate={1.2}
                    poster={LANDING_V2_MEDIA.visibility.whyNotPoster}
                    src={LANDING_V2_MEDIA.visibility.lowering}
                    onError={() => setVideoFailed(true)}
                  />
                </>
              )}
              <Image
                className="lb2-visibility__birdee-still"
                src={act === 2 ? LANDING_V2_MEDIA.visibility.whyNotPoster : LANDING_V2_MEDIA.visibility.searchingPoster}
                alt=""
                fill
                sizes="(max-width: 700px) 58vw, 34vw"
              />
            </div>
          </div>

          <p className="lb2-visibility__answer" data-visible={act === 2}>
            If you knew this week&rsquo;s probable profit,
            <strong>you&rsquo;d change something now.</strong>
          </p>
        </div>
      </div>

      <div className="lb2-sr-only">
        <h2 id="lb2-visibility-title">Do you know your profit now?</h2>
        <ol>
          <li>Do you know how much profit you made yesterday?</li>
          <li>Do you know how much profit you made this week?</li>
          <li>Sorry, but why not? If you knew this week&rsquo;s probable profit, you&rsquo;d change something now.</li>
        </ol>
      </div>
    </section>
  );
}
