import Image from "next/image";
import { BirdeeScene } from "./BirdeeScene";
import { DifferenceLeverValues } from "./DifferenceLeverValues";
import { GuidedBirdeeChapter } from "./GuidedBirdeeChapter";
import { HeroBirdeeMedia } from "./HeroBirdeeMedia";
import { ProfitPerch } from "./ProfitPerch";
import { VideoWaitlistForm } from "./VideoWaitlistForm";
import "./video-lab.css";

export function LandingVideoLab({ homeHref }: { homeHref: string }) {
  return (
    <main className="vlab" id="main-content">
      <a className="vlab-skip-link" href="#hero">
        Skip to content
      </a>

      <header className="vlab-nav" aria-label="Little Birdee navigation">
        <a className="vlab-wordmark" href={homeHref} aria-label="Little Birdee home">
          <Image
            className="vlab-wordmark-birdee"
            src="/brand/birdee-face-square.png"
            alt=""
            width={300}
            height={300}
            priority
          />
          <span>little birdee</span>
        </a>
        <nav className="vlab-nav-links" aria-label="Landing page">
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
          <a className="vlab-nav-cta" href="#waitlist">
            Get on the list
            <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <section className="vlab-hero" id="hero" aria-labelledby="hero-title">
        <HeroBirdeeMedia />
        <svg
          className="vlab-hero-cutout"
          viewBox="0 0 1000 800"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M0 0H575C558 140 530 300 468 420C399 556 294 659 165 718C105 746 49 783 0 800Z" />
        </svg>
        <div className="vlab-hero-grain" aria-hidden="true" />
        <div className="vlab-shell vlab-hero-shell">
          <div className="vlab-hero-copy">
            <p className="vlab-kicker">Little Birdee</p>
            <h1 id="hero-title">Improve yr profit.</h1>
            <p className="vlab-hero-lede">
              See your profit before and as it happens.
            </p>
            <p className="vlab-coffee-line">
              <span className="vlab-desktop-proof">
                5 min a week · $12 AUD. That&apos;s it.
              </span>
              <span className="vlab-mobile-proof">
                5 min a week · $12 AUD. That&apos;s it.
              </span>
            </p>
            <a className="vlab-primary-button" href="#waitlist">
              Get on the list
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="vlab-hero-note" aria-label="Five minutes a week">
            <strong>5 min</strong>
            <span>a week</span>
          </div>
        </div>
      </section>

      <GuidedBirdeeChapter>
      <section
        className="vlab-section vlab-problem"
        id="problem"
        aria-labelledby="problem-title"
        data-guide-step="problem"
      >
        <svg
          className="vlab-problem-cove"
          viewBox="0 0 1000 800"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M0 0H1000V42C812 58 649 96 558 177C466 259 526 348 447 455C354 581 185 653 0 712Z" />
        </svg>

        <div className="vlab-shell vlab-problem-grid">
          <div className="vlab-problem-scene" aria-hidden="true">
            <div className="vlab-calendar">
              <span className="vlab-calendar-rings">
                <i />
                <i />
              </span>
              <small>Next month</small>
              <span className="vlab-calendar-flip-page" aria-hidden="true">
                9
              </span>
              <strong>10</strong>
              <span className="vlab-calendar-th">th</span>
            </div>
            <BirdeeScene
              step="problem"
              className="vlab-problem-birdee"
              poster="/media/landing-video-lab/birdee-problem-thoughtful-v1.png"
              videoSrc="/media/landing-video-lab/problem-birdee-seedance-v2-alpha.webm"
              width={1254}
              height={1254}
              sizes="(max-width: 760px) 112vw, 600px"
            />
          </div>

          <div className="vlab-copy-block">
            <p className="vlab-eyebrow">The problem</p>
            <h2 id="problem-title">
              Your accountant&apos;s
              <br />
              great. Just… slow.
            </h2>
            <p>
              Most owners find out if they made money on the 10th of next
              month.
            </p>
            <p>Too late to change anything.</p>
            <p className="vlab-plain-proof">
              Birdee shows you profit today.
            </p>
            <p>So you can actually do something about it.</p>
            <p className="vlab-problem-price">Just $12 AUD a week.</p>
          </div>
        </div>
      </section>

      <section
        className="vlab-section vlab-how"
        id="how-it-works"
        aria-labelledby="how-title"
        data-guide-step="how"
      >
        <ProfitPerch />
      </section>

      <section
        className="vlab-section vlab-difference"
        id="different"
        aria-labelledby="different-title"
        data-guide-step="different"
      >
        <div className="vlab-shell">
          <div className="vlab-section-heading vlab-difference-heading">
            <p className="vlab-eyebrow">What&apos;s different</p>
            <h2 id="different-title">
              See what&apos;s coming. See what happened.
            </h2>
          </div>

          <div className="vlab-workbench">
            <article className="vlab-workbench-panel vlab-workbench-panel--what-if">
              <span className="vlab-tool-tag">What if</span>
              <h3>See your next move.</h3>
              <p className="vlab-workbench-question">
                What if I increase prices by 5%?
              </p>
              <div className="vlab-lever-demo" aria-hidden="true">
                <div className="vlab-lever-labels">
                  <span>−10%</span>
                  <span>−5%</span>
                  <span>Base</span>
                  <span>+5%</span>
                  <span>+10%</span>
                </div>
                <div className="vlab-lever-track">
                  <span />
                </div>
              </div>
              <div className="vlab-projected-profit">
                <span>Projected profit</span>
                <strong>$5,480</strong>
                <small>↑ $1,340</small>
              </div>
              <DifferenceLeverValues />
            </article>

            <div className="vlab-workbench-guide" aria-hidden="true">
              <Image
                className="vlab-workbench-birdee"
                src="/brand/birdee-reference-neutral-v1.png"
                alt=""
                width={664}
                height={746}
                sizes="(max-width: 760px) 145px, 190px"
              />
              <div className="vlab-difference-switch">
                <span>
                  <i aria-hidden="true">◉</i>
                  What if
                </span>
                <b aria-hidden="true" />
                <span>
                  <i aria-hidden="true">▥</i>
                  What happened
                </span>
              </div>
            </div>

            <article className="vlab-workbench-panel vlab-workbench-panel--happened">
              <span className="vlab-tool-tag">What happened</span>
              <h3>Know why it changed.</h3>
              <ul>
                <li>
                  <strong>Wages were higher than expected</strong>
                  <small>+$1,260</small>
                </li>
                <li>
                  <strong>Revenue ahead of forecast</strong>
                  <small>+$2,420</small>
                </li>
              </ul>
              <div className="vlab-explained-profit">
                <span>That&apos;s why profit is</span>
                <strong>$4,140</strong>
                <i aria-hidden="true">✓</i>
              </div>
            </article>
          </div>
        </div>
      </section>
      </GuidedBirdeeChapter>

      <section
        className="vlab-section vlab-daily"
        id="daily-chirp"
        aria-labelledby="daily-title"
      >
        <div className="vlab-shell vlab-daily-grid">
          <div className="vlab-daily-copy">
            <p className="vlab-kicker">Daily chirp</p>
            <h2 id="daily-title">
              One chirp.
              <br />
              One useful answer.
            </h2>
            <p className="vlab-daily-lede">
              Choose a time that suits you. Birdee gives you a chirp. Tap once
              to see how profit is looking and what moved it.
            </p>
            <ol className="vlab-daily-steps">
              <li>
                <span aria-hidden="true">1</span>
                <div>
                  <strong>Choose your time</strong>
                  <small>Morning, afternoon or after close.</small>
                </div>
              </li>
              <li>
                <span aria-hidden="true">2</span>
                <div>
                  <strong>Get the chirp</strong>
                  <small>A small prompt when your numbers are ready.</small>
                </div>
              </li>
              <li>
                <span aria-hidden="true">3</span>
                <div>
                  <strong>See your profit</strong>
                  <small>One answer, with the numbers behind it nearby.</small>
                </div>
              </li>
            </ol>
          </div>

          <div className="vlab-phone-scene">
            <div
              className="vlab-phone"
              role="img"
              aria-label="Illustrative Little Birdee lock-screen notification showing profit today"
            >
              <div className="vlab-phone-speaker" aria-hidden="true" />
              <div className="vlab-phone-screen">
                <div className="vlab-lock-time">
                  <strong>8:30</strong>
                  <span>Wednesday, 15 May</span>
                </div>
                <div className="vlab-lock-notification">
                  <div className="vlab-lock-notification-header">
                    <Image
                      src="/brand/birdee-face-square.png"
                      alt=""
                      width={300}
                      height={300}
                    />
                    <strong>Little Birdee</strong>
                    <time>8:30 am</time>
                  </div>
                  <div>
                    <span>Profit today</span>
                    <strong>$4,140</strong>
                    <small>Ahead of budget. Get in.</small>
                  </div>
                </div>
              </div>
            </div>

            <Image
              className="vlab-daily-birdee"
              src="/media/landing-video-lab/birdee-daily-chirp-hug-v1.png"
              alt=""
              width={1254}
              height={1254}
              sizes="(max-width: 760px) 160px, 220px"
            />
          </div>
        </div>
      </section>

      <section
        className="vlab-section vlab-pricing"
        id="pricing"
        aria-labelledby="pricing-title"
      >
        <div className="vlab-shell vlab-pricing-grid">
          <div className="vlab-pricing-copy">
            <p className="vlab-eyebrow">Pricing</p>
            <h2 id="pricing-title">$12 a week. That&apos;s it.</h2>
            <ul className="vlab-price-promises">
              <li>No setup fee</li>
              <li>No tiers</li>
              <li>Cancel whenever</li>
            </ul>
          </div>

          <div className="vlab-coffee-scene" aria-hidden="true">
            <Image
              className="vlab-pricing-scene-art"
              src="/media/landing-video-lab/birdee-pricing-scene-v3.png"
              alt=""
              width={1672}
              height={941}
              sizes="(max-width: 760px) 94vw, 720px"
            />
          </div>
        </div>
        <div className="vlab-shell vlab-pricing-cta-wrap">
          <a className="vlab-primary-button" href="#waitlist">
            Get on the list
            <span aria-hidden="true">↗</span>
          </a>
          <p>Less than two coffees.</p>
        </div>
      </section>

      <section
        className="vlab-section vlab-trust"
        id="privacy"
        aria-labelledby="privacy-title"
      >
        <div className="vlab-shell vlab-trust-grid">
          <div className="vlab-trust-lead">
            <Image
              className="vlab-trust-birdee"
              src="/media/landing-video-lab/birdee-privacy-shield-v1.png"
              alt=""
              width={1254}
              height={1254}
              sizes="(max-width: 760px) 120px, 190px"
            />
            <div className="vlab-trust-copy">
              <p className="vlab-kicker">Privacy</p>
              <h2 id="privacy-title">
                Your numbers
                <br />
                stay yours.
              </h2>
            </div>
          </div>

          <div className="vlab-trust-points">
            <article>
              <span aria-hidden="true">⌁</span>
              <div>
                <h3>What we use</h3>
                <p>
                  We only use your accounting numbers to calculate your profit.
                  That&apos;s it.
                </p>
              </div>
            </article>
            <article>
              <span aria-hidden="true">✓</span>
              <div>
                <h3>Why we use it</h3>
                <p>
                  To show you profit before and as it happens, so you can make
                  better calls.
                </p>
              </div>
            </article>
            <article>
              <span aria-hidden="true">×</span>
              <div>
                <h3>How to remove it</h3>
                <p>
                  Remove your data or cancel anytime. We&apos;ll delete
                  everything. No hassle.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section
        className="vlab-waitlist"
        id="waitlist"
        aria-labelledby="waitlist-title"
      >
        <div className="vlab-waitlist-shell">
          <div className="vlab-waitlist-copy">
            <p className="vlab-kicker">Get on the list</p>
            <h2 id="waitlist-title">
              Don&apos;t know if you made money yesterday?
              <br />
              Let&apos;s fix that.
            </h2>
            <VideoWaitlistForm />
          </div>

          <div className="vlab-waitlist-stage" aria-hidden="true">
            <span className="vlab-chirp">chirp!</span>
            <Image
              src="/media/landing-video-lab/birdee-waitlist-cheer-v1.png"
              alt=""
              fill
              sizes="(max-width: 760px) 78vw, 520px"
            />
          </div>

          <footer className="vlab-footer">
            <a className="vlab-footer-mark" href={homeHref}>
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
            <span>Made by operators, for operators.</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
