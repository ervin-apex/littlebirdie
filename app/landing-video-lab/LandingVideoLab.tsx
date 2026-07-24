import Image from "next/image";
import { HeroBirdeeMedia } from "./HeroBirdeeMedia";
import { VideoWaitlistForm } from "./VideoWaitlistForm";
import "./video-lab.css";

export function LandingVideoLab() {
  return (
    <main className="vlab" id="main-content">
      <a className="vlab-skip-link" href="#hero">
        Skip to content
      </a>

      <header className="vlab-nav" aria-label="Little Birdee navigation">
        <a className="vlab-wordmark" href="#hero" aria-label="Little Birdee home">
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
          </a>
        </nav>
      </header>

      <section className="vlab-hero" id="hero" aria-labelledby="hero-title">
        <HeroBirdeeMedia />
        <div className="vlab-hero-grain" aria-hidden="true" />
        <div className="vlab-shell vlab-hero-shell">
          <div className="vlab-hero-copy">
            <p className="vlab-kicker">Little Birdee</p>
            <h1 id="hero-title">Improve yr profit.</h1>
            <p className="vlab-hero-lede">
              See your profit before and as it happens — using the numbers
              already in your business.
            </p>
            <p className="vlab-coffee-line">For less than two coffees a week.</p>
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

      <section
        className="vlab-section vlab-problem"
        id="problem"
        aria-labelledby="problem-title"
      >
        <div className="vlab-shell vlab-problem-grid">
          <div className="vlab-problem-scene" aria-hidden="true">
            <div className="vlab-calendar">
              <span className="vlab-calendar-rings">
                <i />
                <i />
              </span>
              <small>Next month</small>
              <strong>10</strong>
              <span className="vlab-calendar-th">th</span>
            </div>
            <Image
              className="vlab-problem-birdee"
              src="/brand/birdee-reference-concerned-v1.png"
              alt=""
              width={1280}
              height={1280}
              sizes="(max-width: 760px) 46vw, 340px"
            />
          </div>

          <div className="vlab-copy-block">
            <p className="vlab-eyebrow">The problem</p>
            <h2 id="problem-title">
              Your accountant&apos;s great.
              <br />
              Just… slow.
            </h2>
            <p>
              Most owners find out if they made money on the 10th of next
              month. Too late to change anything.
            </p>
            <p className="vlab-plain-proof">
              Birdee shows you profit today — so you can actually do something
              about it.
            </p>
          </div>
        </div>
      </section>

      <section
        className="vlab-section vlab-how"
        id="how-it-works"
        aria-labelledby="how-title"
      >
        <div className="vlab-shell">
          <div className="vlab-section-heading">
            <div>
              <p className="vlab-eyebrow">How it works</p>
              <h2 id="how-title">Four numbers. One answer.</h2>
            </div>
            <p>
              The numbers are already in yr business. Birdee just puts them
              where you can see them.
            </p>
          </div>

          <div className="vlab-step-track">
            <article className="vlab-step-card">
              <span className="vlab-step-number">1</span>
              <p className="vlab-step-label">What comes in</p>
              <h3>Revenue</h3>
              <strong className="vlab-step-value">$18,420</strong>
            </article>

            <span className="vlab-step-operator" aria-hidden="true">
              −
            </span>

            <article className="vlab-step-card vlab-step-card--costs">
              <span className="vlab-step-number">2</span>
              <p className="vlab-step-label">What goes out</p>
              <h3>Wages · COGS · the rest</h3>
              <strong className="vlab-step-value">$14,280</strong>
            </article>

            <span className="vlab-step-operator" aria-hidden="true">
              =
            </span>

            <article className="vlab-step-card vlab-step-card--profit">
              <span className="vlab-profit-light" aria-label="In profit" />
              <p className="vlab-step-label">The one that matters</p>
              <h3>Profit</h3>
              <strong className="vlab-step-value">$4,140</strong>
              <small>Ahead of budget. Get in.</small>
            </article>

            <Image
              className="vlab-how-birdee"
              src="/brand/birdee-reference-profit-v1.png"
              alt=""
              width={760}
              height={738}
              sizes="220px"
            />
          </div>

          <div className="vlab-how-proof">
            <strong>Under 5 minutes a week.</strong>
            <span>Predicted ahead · actual after · plain all the way</span>
          </div>
        </div>
      </section>

      <section
        className="vlab-section vlab-difference"
        id="different"
        aria-labelledby="different-title"
      >
        <div className="vlab-shell">
          <div className="vlab-section-heading">
            <div>
              <p className="vlab-eyebrow">What&apos;s different</p>
              <h2 id="different-title">
                See what&apos;s coming.
                <br />
                See what happened.
              </h2>
            </div>
            <p>
              One useful answer before the week. One plain explanation after
              it.
            </p>
          </div>

          <div className="vlab-tool-grid">
            <article className="vlab-tool-card vlab-tool-card--what-if">
              <span className="vlab-tool-tag">What if</span>
              <h3>Nudge a lever. See profit move.</h3>
              <div className="vlab-lever-demo" aria-hidden="true">
                <div className="vlab-lever-track">
                  <span />
                </div>
                <div className="vlab-lever-values">
                  <span>
                    Wages <strong>− $360</strong>
                  </span>
                  <span>
                    Profit <strong>+ $360</strong>
                  </span>
                </div>
              </div>
            </article>

            <article className="vlab-tool-card vlab-tool-card--happened">
              <span className="vlab-tool-tag">What happened</span>
              <h3>No spreadsheet archaeology.</h3>
              <ul>
                <li>
                  <span className="vlab-signal vlab-signal--red" />
                  <div>
                    <strong>Wages ran high</strong>
                    <small>$240 over budget</small>
                  </div>
                </li>
                <li>
                  <span className="vlab-signal" />
                  <div>
                    <strong>Revenue did its bit</strong>
                    <small>$180 ahead</small>
                  </div>
                </li>
              </ul>
            </article>

            <Image
              className="vlab-difference-birdee"
              src="/brand/birdee-reference-business-v1.png"
              alt=""
              width={912}
              height={773}
              sizes="(max-width: 760px) 180px, 250px"
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
            <h2 id="pricing-title">About two coffees a week.</h2>
            <p className="vlab-price-line">$9–12 AUD / week</p>
            <p>
              No spreadsheets. No numbers degree. No waiting for next month.
            </p>
            <a className="vlab-primary-button" href="#waitlist">
              Get on the list
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="vlab-coffee-scene" aria-hidden="true">
            <div className="vlab-coffee-bench">
              <span className="vlab-cup vlab-cup--one">
                <i />
              </span>
              <span className="vlab-cup vlab-cup--two">
                <i />
              </span>
            </div>
            <Image
              className="vlab-pricing-birdee"
              src="/brand/birdee-reference-neutral-v1.png"
              alt=""
              width={664}
              height={746}
              sizes="(max-width: 760px) 48vw, 360px"
            />
            <span className="vlab-coffee-note">That&apos;s it.</span>
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
            <p className="vlab-kicker">Get the chirp</p>
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
              src="/brand/birdee-reference-welcome-v1.png"
              alt=""
              fill
              sizes="(max-width: 760px) 78vw, 520px"
            />
          </div>

          <footer className="vlab-footer">
            <a href="#hero">Little Birdee</a>
            <span>Made by operators, for operators.</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
