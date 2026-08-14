"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { getLandingV2PreloadImages } from "../media";

type LoadState = "loading" | "revealing" | "ready";

type LandingPreloaderProps = {
  children: ReactNode;
};

const MINIMUM_DISPLAY_MS = 850;
const MAXIMUM_WAIT_MS = 10_000;
const REVEAL_DURATION_MS = 360;
const PRELOAD_CONCURRENCY = 4;

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

function waitForImage(image: HTMLImageElement) {
  if (image.complete) {
    return image.naturalWidth > 0
      ? image.decode().catch(() => undefined)
      : Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const finish = () => resolve();
    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
  }).then(() => image.decode().catch(() => undefined));
}

async function preloadSource(url: string) {
  const image = new window.Image();
  image.decoding = "async";
  image.src = url;
  await waitForImage(image);
}

async function preloadWithLimit(
  urls: string[],
  onProgress: (completed: number, total: number) => void,
) {
  let cursor = 0;
  let completed = 0;

  const worker = async () => {
    while (cursor < urls.length) {
      const index = cursor;
      cursor += 1;
      await preloadSource(urls[index]);
      completed += 1;
      onProgress(completed, urls.length);
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(PRELOAD_CONCURRENCY, urls.length) },
      () => worker(),
    ),
  );
}

export function LandingPreloader({ children }: LandingPreloaderProps) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let revealTimer = 0;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const preparePage = async () => {
      const startedAt = performance.now();

      // Give responsive <picture> and next/image elements two paints to choose
      // their real currentSrc before asking the browser to decode them.
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolve());
        });
      });

      const pageImages = Array.from(
        contentRef.current?.querySelectorAll<HTMLImageElement>("img") ?? [],
      );
      for (const image of pageImages) {
        image.loading = "eager";
        image.decoding = "async";
      }

      const sourceUrls = getLandingV2PreloadImages(window.innerWidth, window.innerHeight);
      const essentialWork = Promise.allSettled([
        preloadWithLimit(sourceUrls, () => undefined),
        Promise.allSettled(pageImages.map(waitForImage)),
        document.fonts?.ready ?? Promise.resolve(),
      ]);

      const elapsed = performance.now() - startedAt;
      await Promise.all([
        Promise.race([essentialWork, delay(MAXIMUM_WAIT_MS)]),
        delay(Math.max(0, MINIMUM_DISPLAY_MS - elapsed)),
      ]);

      if (cancelled) return;
      contentRef.current?.removeAttribute("inert");
      setLoadState("revealing");

      revealTimer = window.setTimeout(() => {
        if (cancelled) return;
        document.body.style.overflow = previousOverflow;
        setLoadState("ready");
      }, REVEAL_DURATION_MS);
    };

    void preparePage();

    return () => {
      cancelled = true;
      window.clearTimeout(revealTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="lb2-preload-shell" data-state={loadState}>
      {loadState !== "ready" ? (
        <div
          className="lb2-loader"
          data-state={loadState}
          role="status"
          aria-live="polite"
          aria-label="Preparing Little Birdee"
        >
          <div className="lb2-loader__halo" aria-hidden="true" />
          <div className="lb2-loader__brand" aria-hidden="true">
            <div className="lb2-loader__bird">
              <Image
                src="/brand/birdee-face-square.png"
                alt=""
                width={300}
                height={300}
                priority
              />
              <span className="lb2-loader__chirp lb2-loader__chirp--one" />
              <span className="lb2-loader__chirp lb2-loader__chirp--two" />
            </div>
            <span>Little Birdee</span>
          </div>
        </div>
      ) : null}

      <div
        ref={contentRef}
        className="lb2-preload-content"
        inert={loadState === "loading"}
        aria-busy={loadState !== "ready"}
      >
        {children}
      </div>

      <noscript>
        <style>{`.lb2-loader{display:none!important}.lb2-preload-content{opacity:1!important;visibility:visible!important}`}</style>
      </noscript>
    </div>
  );
}
