export function revealAfterFirstVideoFrame(
  video: HTMLVideoElement,
  onReady: () => void,
) {
  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    onReady();
  };

  if (typeof video.requestVideoFrameCallback === "function") {
    video.requestVideoFrameCallback(reveal);

    // Some WebKit/Chromium combinations do not deliver the compositor
    // callback for a paused video after a programmatic seek. loadeddata has
    // already guaranteed a decoded current frame, so avoid leaving the static
    // fallback permanently above healthy rich media.
    window.setTimeout(reveal, 240);
    return;
  }

  // loadeddata guarantees a current frame on browsers that do not expose the
  // compositor callback.
  reveal();
}
