import { assetPath } from "@/lib/site";
import { LANDING_V2_MEDIA } from "../media";

export function WhatWeDoSection() {
  const productStory = LANDING_V2_MEDIA.whatWeDo.productStory;

  return (
    <section
      className="lb2-what-we-do"
      id="what-we-do"
      aria-labelledby="lb2-what-we-do-title"
    >
      <div className="lb2-what-we-do__inner">
        <div className="lb2-what-we-do__copy">
          <h2 id="lb2-what-we-do-title">what we do</h2>
          <p className="lb2-what-we-do__statement">
            <span>show you your</span>
            <span>profit position <strong>NOW</strong></span>
          </p>
          <p className="lb2-what-we-do__support">
            and give you control of your numbers
          </p>
        </div>

        <div className="lb2-what-we-do__visual">
          <picture className="lb2-what-we-do__picture">
            <source
              media="(max-width: 520px)"
              srcSet={assetPath(productStory.mobile)}
            />
            <source
              media="(max-width: 1100px)"
              srcSet={assetPath(productStory.medium)}
            />
            <img
              src={assetPath(productStory.desktop)}
              alt="Little Birdee dashboard showing an estimated profit of $2,665 and a What If scenario improving it to $2,984"
              width="1448"
              height="1086"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>
      </div>
    </section>
  );
}
