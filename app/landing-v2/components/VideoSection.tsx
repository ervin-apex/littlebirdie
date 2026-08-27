"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "@phosphor-icons/react";
import { LANDING_V2_MEDIA } from "../media";

/**
 * The two product videos, as click-to-play cards.
 *
 * Nothing loads until someone asks for it: the cards are posters, and the
 * <video> is only mounted on click. The MP4s are 5-9MB each, so autoplaying or
 * even preloading both would cost every visitor ~14MB for something most will
 * never press.
 */
const CLIPS = [
  {
    id: "setup",
    ...LANDING_V2_MEDIA.videos.setup,
    title: "Setting up",
    blurb: "What the first ten minutes looks like, start to finish.",
  },
  {
    id: "chirp",
    ...LANDING_V2_MEDIA.videos.chirp,
    title: "Your Daily Chirp",
    blurb: "Yesterday's profit, against your budget, before you open.",
  },
] as const;

export function VideoSection() {
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <section className="lb2-videos" id="videos" aria-labelledby="lb2-videos-title">
      <div className="lb2-shell">
        <div className="lb2-videos__heading">
          <span className="lb2-videos__eyebrow">Watch</span>
          <h2 id="lb2-videos-title">
            See it <em>actually work.</em>
          </h2>
        </div>

        <div className="lb2-videos__grid">
          {CLIPS.map((clip) => (
            <article className="lb2-videos__card" key={clip.id}>
              <div className="lb2-videos__frame">
                {playing === clip.id ? (
                  <video
                    className="lb2-videos__player"
                    src={clip.src}
                    poster={clip.posterSmall}
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                  />
                ) : (
                  <button
                    type="button"
                    className="lb2-videos__play-button"
                    onClick={() => setPlaying(clip.id)}
                    aria-label={`Play: ${clip.title}, ${clip.length}`}
                  >
                    <Image
                      className="lb2-videos__poster"
                      src={clip.poster}
                      alt=""
                      width={1920}
                      height={1080}
                      sizes="(max-width: 900px) 92vw, 46vw"
                    />
                    <span className="lb2-videos__play" aria-hidden="true">
                      <Play size={34} weight="fill" />
                    </span>
                    <span className="lb2-videos__length" aria-hidden="true">{clip.length}</span>
                  </button>
                )}
              </div>
              <div className="lb2-videos__meta">
                <h3>{clip.title}</h3>
                <p>{clip.blurb}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
