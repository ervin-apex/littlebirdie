import Image from "next/image";
import {
  ArrowUpRight,
  Check,
  Database,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { DailyChirp } from "./DailyChirp";
import { DifferenceLens } from "./DifferenceLens";
import { HeroBirdee } from "./HeroBirdee";
import { ProblemBirdee } from "./ProblemBirdee";
import { SiteNav } from "./SiteNav";
import "./landing.css";

const LEDGER = [
  { kind: "What comes in", name: "Revenue", value: "$18,420", out: false },
  { kind: "What goes out", name: "Wages", value: "− $8,200", out: true },
  { kind: "What goes out", name: "COGS", value: "− $3,140", out: true },
  { kind: "What goes out", name: "The rest", value: "− $2,940", out: true },
];

export function LandingPage({
  fontClassName,
  homeHref,
}: {
  fontClassName: string;
  homeHref: string;
}) {
  return (
    <div className={`lb-landing ${fontClassName}`}>
      <a className="lb-skip-link" href="#hero">
        Skip to content
      </a>

      <SiteNav homeHref={homeHref} />

      <main id="main-content">
        <section className="lb-hero" id="hero" aria-labelledby="hero-title">
          <div className="lb-hero__field" aria-hidden="true" />

          <svg
            className="lb-hero__cutout"
            viewBox="0 0 1000 800"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              className="lb-hero__curve--wide"
              d="M0 0H575C558 140 530 300 468 420C399 556 294 659 165 718C105 746 49 783 0 800Z"
            />
            <path
              className="lb-hero__curve--narrow"
              d="M0 0H672C670 200 664 400 656 520C640 640 440 748 0 770Z"
            />
          </svg>

          <HeroBirdee />

          <div className="lb-hero__shell">
            <div className="lb-hero__copy">
              <p className="lb-eyebrow">Little Birdee</p>
              <h1 id="hero-title">Improve yr profit.</h1>
              <p className="lb-hero__lede">
                See your profit before and as it happens.
              </p>
              <p className="lb-hero__proof">
                5 min a week &middot; $12 AUD. That&rsquo;s it.
              </p>
              <a className="lb-cta lb-cta--hero" href="/auth?mode=signup">
                Create account
                <span className="lb-cta__arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            </div>

            <div className="lb-hero__badge" aria-label="Five minutes a week">
              <strong>5 min</strong>
              <span>a week</span>
            </div>
          </div>
        </section>

        <section
          className="lb-problem"
          id="problem"
          aria-labelledby="problem-title"
        >
          <svg
            className="lb-problem__cove"
            viewBox="0 0 1000 800"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              className="lb-problem__curve--wide"
              d="M0 0H1000V42C812 58 649 96 558 177C466 259 526 348 447 455C354 581 185 653 0 712Z"
            />
            {/* Mobile runs the yellow as a band that closes above the copy
                instead of a diagonal sweeping down through it. */}
            <path
              className="lb-problem__curve--narrow"
              d="M0 0H1000V640C900 700 760 742 520 764C340 780 150 788 0 792Z"
            />
          </svg>

          <div className="lb-shell lb-problem__grid">
            <div
              className="lb-problem__scene lb-reveal-left"
              aria-hidden="true"
            >
              <div className="lb-problem__calendar">
                <span className="lb-problem__calendar-band" />
                <span className="lb-problem__calendar-ring lb-problem__calendar-ring--left" />
                <span className="lb-problem__calendar-ring lb-problem__calendar-ring--right" />
                <small className="lb-problem__calendar-eyebrow">
                  Next month
                </small>
                <strong className="lb-problem__calendar-day">
                  10
                  <span className="lb-problem__calendar-ordinal">th</span>
                </strong>
              </div>
              <ProblemBirdee />
            </div>

            <div className="lb-problem__copy lb-reveal-rise">
              <p className="lb-eyebrow">The problem</p>
              <h2 className="lb-section-title" id="problem-title">
                Your accountant&rsquo;s
                <br />
                great. Just&hellip; slow.
              </h2>
              <p className="lb-problem__line">
                Most owners find out if they made money on the 10th of next
                month.
              </p>
              <p className="lb-problem__line">Too late to change anything.</p>
              <p className="lb-problem__line lb-problem__answer">
                Birdee shows you profit today.
              </p>
              <p className="lb-problem__line">
                So you can actually do something about it.
              </p>
              <p className="lb-problem__price">
                <Check size={17} weight="bold" aria-hidden="true" />
                Just $12 AUD a week.
              </p>
            </div>
          </div>
        </section>

        <section
          className="lb-how"
          id="how-it-works"
          aria-labelledby="how-title"
        >
          <div className="lb-shell lb-how__grid">
            <div className="lb-how__copy lb-reveal-rise">
              <p className="lb-eyebrow">How it works</p>
              <h2 id="how-title">
                Four numbers.
                <br />
                <span>One useful answer.</span>
              </h2>
              <p className="lb-how__lede">
                The numbers are already in yr business.
              </p>
              <p>
                Birdee brings them together and shows you the one that matters.
              </p>
              <div className="lb-how__note">
                <span className="lb-how__note-icon" aria-hidden="true">
                  <Check size={15} weight="bold" />
                </span>
                <p>
                  No spreadsheets.<strong> Under 5 min a week.</strong>
                </p>
              </div>
            </div>

            <div className="lb-how__stage lb-reveal-right">
              <span className="lb-how__perch-shoulder" aria-hidden="true" />
              <span className="lb-how__perch-bird" aria-hidden="true">
                <Image
                  src="/media/landing-video-lab/birdee-four-numbers-perch-v1.webp"
                  alt=""
                  width={1254}
                  height={1254}
                  sizes="(max-width: 999px) 43vw, 300px"
                />
              </span>

              <div className="lb-ledger">
                <div className="lb-ledger__head">
                  <span className="lb-ledger__head-label">
                    <i className="lb-ledger__live-dot" aria-hidden="true" />
                    Your weekly numbers
                  </span>
                  <span className="lb-ledger__badge">Profit ready</span>
                </div>

                <ul>
                  {LEDGER.map((row) => (
                    <li className="lb-ledger__row" key={row.name}>
                      <span className="lb-ledger__tick" aria-hidden="true">
                        <Check size={14} weight="bold" />
                      </span>
                      <span className="lb-ledger__name">
                        <small>{row.kind}</small>
                        <strong>{row.name}</strong>
                      </span>
                      <strong
                        className={`lb-ledger__value lb-tnum${
                          row.out ? " lb-ledger__value--out" : ""
                        }`}
                      >
                        {row.value}
                      </strong>
                    </li>
                  ))}
                </ul>

                <div className="lb-ledger__total">
                  <span className="lb-ledger__total-figure">
                    <small>Profit</small>
                    <strong className="lb-tnum">$4,140</strong>
                  </span>
                  <span className="lb-ledger__verdict">
                    <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
                    Ahead of budget. Get in.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="lb-different"
          id="different"
          aria-labelledby="different-title"
        >
          <div className="lb-shell">
            <div className="lb-different__heading">
              <p className="lb-eyebrow">What&rsquo;s different</p>
              <h2 id="different-title">
                See what&rsquo;s coming. See what happened.
              </h2>
            </div>

            <DifferenceLens />
          </div>
        </section>

        <section
          className="lb-chirp"
          id="daily-chirp"
          aria-labelledby="daily-title"
        >
          <DailyChirp />
        </section>

        <section
          className="lb-pricing"
          id="pricing"
          aria-labelledby="pricing-title"
        >
          <div className="lb-shell lb-pricing__grid">
            <div className="lb-pricing__copy">
              <p className="lb-eyebrow">Pricing</p>
              <h2 id="pricing-title">$12 a week. That&rsquo;s it.</h2>
              <ul className="lb-pricing__promises">
                {["No setup fee", "No tiers", "Cancel whenever"].map(
                  (promise) => (
                    <li key={promise}>
                      <span aria-hidden="true">
                        <Check size={13} weight="bold" />
                      </span>
                      {promise}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <Image
              className="lb-pricing__art"
              src="/media/landing-video-lab/birdee-pricing-scene-v3.png"
              alt=""
              width={1672}
              height={941}
              sizes="(max-width: 999px) 94vw, 700px"
            />
          </div>

          <div className="lb-shell lb-pricing__cta">
            <a className="lb-cta" href="/auth?mode=signup">
              Create account
              <span className="lb-cta__arrow" aria-hidden="true">
                ↗
              </span>
            </a>
            <p>Less than two coffees.</p>
          </div>
        </section>

        <section
          className="lb-privacy"
          id="privacy"
          aria-labelledby="privacy-title"
        >
          <div className="lb-shell lb-privacy__grid">
            <div className="lb-privacy__lead">
              <Image
                className="lb-privacy__shield"
                src="/media/landing-video-lab/birdee-privacy-shield-v1.png"
                alt=""
                width={1254}
                height={1254}
                sizes="(max-width: 999px) 140px, 192px"
              />
              <div className="lb-privacy__lead-copy">
                <p className="lb-eyebrow lb-eyebrow--dark">Privacy</p>
                <h2 id="privacy-title">
                  Your numbers
                  <br />
                  stay yours.
                </h2>
              </div>
            </div>

            <div className="lb-privacy__points">
              <article>
                <span aria-hidden="true">
                  <Database size={18} weight="bold" />
                </span>
                <h3>What we use</h3>
                <p>
                  We only use your accounting numbers to calculate your profit.
                  That&rsquo;s it.
                </p>
              </article>
              <article>
                <span aria-hidden="true">
                  <Check size={18} weight="bold" />
                </span>
                <h3>Why we use it</h3>
                <p>
                  To show you profit before and as it happens, so you can make
                  better calls.
                </p>
              </article>
              <article>
                <span aria-hidden="true">
                  <X size={18} weight="bold" />
                </span>
                <h3>How to remove it</h3>
                <p>
                  Remove your data or cancel anytime. We&rsquo;ll delete
                  everything. No hassle.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section
          className="lb-signup"
          id="get-started"
          aria-labelledby="get-started-title"
        >
          <div className="lb-signup__grid">
            <div className="lb-signup__copy">
              <p className="lb-eyebrow lb-eyebrow--on-brand">Get started</p>
              <h2 id="get-started-title">
                Don&rsquo;t know if you made money yesterday?
                <br />
                Let&rsquo;s fix that.
              </h2>

              <div className="lb-signup__actions">
                <a className="lb-signup__cta" href="/auth?mode=signup">
                  Create account
                  <span aria-hidden="true">↗</span>
                </a>
                <p className="lb-signup__alt">
                  Already have an account?{" "}
                  <a href="/auth?mode=login">Log in</a>
                </p>
              </div>
              <p className="lb-signup__terms">
                $12 AUD a week. Cancel whenever.
              </p>
            </div>

            <div className="lb-signup__stage" aria-hidden="true">
              <span className="lb-signup__ping" />
              <span className="lb-signup__chirp">chirp!</span>
              <Image
                className="lb-signup__cheer"
                src="/media/landing-video-lab/birdee-waitlist-cheer-v1.png"
                alt=""
                width={1254}
                height={1254}
                sizes="(max-width: 999px) 78vw, 500px"
              />
            </div>
          </div>

          <footer className="lb-footer">
            <a className="lb-footer__mark" href={homeHref}>
              <Image
                src="/brand/birdee-face-square.png"
                alt=""
                width={300}
                height={300}
              />
              little birdee
            </a>
            <nav aria-label="Landing page details">
              <a href="#how-it-works">How it works</a>
              <a href="#pricing">Pricing</a>
              <a href="#privacy">Privacy</a>
            </nav>
            <span className="lb-footer__sign-off">
              Made by operators, for operators.
            </span>
          </footer>
        </section>
      </main>
    </div>
  );
}
