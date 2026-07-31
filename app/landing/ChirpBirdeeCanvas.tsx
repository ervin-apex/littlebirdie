"use client";

import { useEffect, useRef } from "react";

const SRC = "/media/landing-video-lab/daily-birdee-chirp-raw.mp4";

/* The source clip is a 960×960 green-plate render with an "AI generated"
   watermark burned into the bottom-right corner. Both are stripped per frame on
   a canvas, which also leaves the phone's screen aperture transparent so the
   live HTML lock-screen underneath shows through.
   Measured on the shipped file: plate ≈ rgb(12 210 14), phone bezel spans
   x 280–676 / y 82–865, and the watermark sits inside the box below — which
   overlaps the bezel's bottom-right corner, so only *light* pixels in that box
   are erased and the dark bezel survives. */
const WATERMARK = { x0: 630, x1: 945, y0: 775, y1: 935 };

function stripPlateAndWatermark(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const frame = ctx.getImageData(0, 0, w, h);
  const d = frame.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const dominance = g - (r > b ? r : b);

    if (dominance > 56) {
      // Solidly green: drop it.
      d[i + 3] = 0;
    } else if (dominance > 16) {
      // Edge pixel: feather the alpha and pull the green spill out of the
      // colour so the silhouette doesn't keep a green rim.
      d[i + 3] = Math.round(d[i + 3] * (56 - dominance) / 40);
      const cap = ((r + b) / 2) * 1.12;
      if (g > cap) d[i + 1] = cap;
    }
  }

  for (let y = WATERMARK.y0; y <= WATERMARK.y1; y++) {
    const row = y * w * 4;
    for (let x = WATERMARK.x0; x <= WATERMARK.x1; x++) {
      const i = row + x * 4;
      if (d[i + 3] && d[i] + d[i + 1] + d[i + 2] > 210) d[i + 3] = 0;
    }
  }

  ctx.putImageData(frame, 0, 0);
}

export function ChirpBirdeeCanvas() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const { width, height } = canvas;
    let raf = 0;

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(video, 0, 0, width, height);
      stripPlateAndWatermark(ctx, width, height);
    };

    const pump = () => {
      drawFrame();
      if (!video.paused && !video.ended) raf = requestAnimationFrame(pump);
    };

    // Backgrounding the tab stops rAF, which would strand the canvas on a stale
    // frame while the clip keeps running. Pick the loop back up on return.
    const resume = () => {
      if (document.hidden || video.paused || video.ended) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(pump);
    };
    document.addEventListener("visibilitychange", resume);

    video.addEventListener("seeked", drawFrame);
    video.addEventListener("ended", drawFrame);

    // A cached or already-buffered file fires loadeddata before this effect
    // runs, so paint the first frame directly rather than waiting on an event
    // that has been and gone.
    if (video.readyState >= 2) drawFrame();
    else video.addEventListener("loadeddata", drawFrame, { once: true });

    let observer: IntersectionObserver | undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Hold the final pose — Birdee already peeking out — and never animate.
      const seekToEnd = () => {
        video.currentTime = Math.max(0, video.duration - 0.05);
      };
      if (video.readyState >= 1) seekToEnd();
      else video.addEventListener("loadedmetadata", seekToEnd, { once: true });
    } else {
      // The design polled getBoundingClientRect because its runtime emitted no
      // scroll events; here a real observer does the same job for less work.
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer?.disconnect();
          video.currentTime = 0;
          void video
            .play()
            .then(() => {
              raf = requestAnimationFrame(pump);
            })
            .catch(drawFrame);
        },
        { rootMargin: "30% 0px" },
      );
      observer.observe(canvas);
    }

    return () => {
      observer?.disconnect();
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", resume);
      video.removeEventListener("loadeddata", drawFrame);
      video.removeEventListener("seeked", drawFrame);
      video.removeEventListener("ended", drawFrame);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="lb-chirp__canvas"
        width={960}
        height={960}
        aria-hidden="true"
      />
      <video
        ref={videoRef}
        className="lb-chirp__source"
        muted
        playsInline
        preload="auto"
        src={SRC}
        aria-hidden="true"
      />
    </>
  );
}
