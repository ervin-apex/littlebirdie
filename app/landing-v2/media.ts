export const LANDING_V2_MEDIA = {
  hero: {
    master: "/media/landing-v2/hero/birdee-entrance-hover-master-alpha-optimized.webm",
    mobileMaster:
      "/media/landing-v2/hero/birdee-entrance-hover-master-alpha-optimized.webm",
    hoverStart: 6.292,
    poster: "/media/landing-v2/hero/birdee-poster.webp",
  },
  visibility: {
    searching: "/media/landing-v2/visibility/birdee-searching-clean-alpha.webm",
    lowering: "/media/landing-v2/visibility/birdee-lowers-binoculars-concerned-alpha.webm",
    searchingPoster: "/media/landing-v2/visibility/hero-v2/birdee-searching.webp",
    whyNotPoster: "/media/landing-v2/visibility/hero-v2/birdee-concerned.webp",
    roadDesktop: "/media/landing-v2/visibility/road-desktop.png",
    roadMobile: "/media/landing-v2/visibility/road-mobile.png",
    calendar: "/media/landing-v2/visibility/calendar-blank.png",
  },
  accountant: {
    receipt: "/media/landing-v2/accountant/receipt-blank.png",
    board: "/media/landing-v2/accountant/profit-board-blank.png",
    objection: "/media/landing-v2/accountant/hero-v2/birdee-objection.webp",
    attitude: "/media/landing-v2/accountant/hero-v2/birdee-attitude.webp",
    presenting: "/media/landing-v2/accountant/hero-v2/birdee-presenting.webp",
    action: "/media/landing-v2/accountant/hero-v2/birdee-action.webp",
  },
  machine: {
    master: "/media/landing-v2/machine/profit-machine-master-text-locked.mp4",
    mobileMaster: "/media/landing-v2/machine/profit-machine-master-mobile-scrub.mp4",
    posters: [
      "/media/landing-v2/machine/chapter-01-static.webp",
      "/media/landing-v2/machine/chapter-02-static.webp",
      "/media/landing-v2/machine/chapter-03-static.webp",
      "/media/landing-v2/machine/chapter-04-static.webp",
      "/media/landing-v2/machine/chapter-05-static.webp",
    ],
    mobileSequence: [
      "/media/landing-v2/machine/mobile-slides-v4/01-historical.webp",
      "/media/landing-v2/machine/mobile-slides-v4/02-prediction.webp",
      "/media/landing-v2/machine/mobile-slides-v4/03-packages.webp",
      "/media/landing-v2/machine/mobile-slides-v4/04-impact.webp",
      "/media/landing-v2/machine/mobile-slides-v4/05-budget-actual.webp",
    ],
    phoneSequence: [
      "/media/landing-v2/machine/mobile-fullbleed-v5/01-historical.webp",
      "/media/landing-v2/machine/mobile-fullbleed-v5/02-prediction.webp",
      "/media/landing-v2/machine/mobile-fullbleed-v5/03-packages.webp",
      "/media/landing-v2/machine/mobile-fullbleed-v5/04-impact.webp",
      "/media/landing-v2/machine/mobile-fullbleed-v5/05-budget-actual-v2.webp",
    ],
    desktopSequence: [
      "/media/landing-v2/machine/desktop-slides-v3/slide-01-historical.webp",
      "/media/landing-v2/machine/desktop-slides-v3/slide-02-prediction.webp",
      "/media/landing-v2/machine/desktop-slides-v3/slide-03-packages.webp",
      "/media/landing-v2/machine/desktop-slides-v3/slide-04-impact.webp",
      "/media/landing-v2/machine/desktop-slides-v3/slide-05-budget-actual.webp",
    ],
    duration: 33.208333,
  },
  daily: "/media/landing-v2/daily/birdee-phone-hug.png",
  pricing: {
    birdee: "/media/landing-v2/pricing/hero-v2/birdee.webp",
    coffees: "/media/landing-v2/pricing/two-coffees.png",
  },
  fit: {
    forBoard: "/media/landing-v2/fit/who-its-for-board.png",
    birdee: "/media/landing-v2/fit/hero-v2/birdee.webp",
    notForBoard: "/media/landing-v2/fit/who-its-not-for-board.png",
  },
  privacy: "/media/landing-v2/privacy/hero-v2/birdee-shield.webp",
} as const;

/**
 * Images that must be decoded before the landing page is revealed.
 *
 * Only the machine composition needed by the current breakpoint is included;
 * loading all three art directions would make the loading screen slower on the
 * mobile devices it is intended to protect.
 */
export function getLandingV2PreloadImages(viewportWidth: number) {
  const machineFrames = viewportWidth <= 520
    ? LANDING_V2_MEDIA.machine.phoneSequence
    : viewportWidth <= 820
      ? LANDING_V2_MEDIA.machine.mobileSequence
      : LANDING_V2_MEDIA.machine.desktopSequence;

  const road = viewportWidth <= 520
    ? LANDING_V2_MEDIA.visibility.roadMobile
    : LANDING_V2_MEDIA.visibility.roadDesktop;

  return Array.from(new Set([
    "/brand/birdee-face-square.png",
    LANDING_V2_MEDIA.hero.poster,
    road,
    LANDING_V2_MEDIA.visibility.calendar,
    LANDING_V2_MEDIA.visibility.searchingPoster,
    LANDING_V2_MEDIA.visibility.whyNotPoster,
    LANDING_V2_MEDIA.accountant.receipt,
    LANDING_V2_MEDIA.accountant.board,
    LANDING_V2_MEDIA.accountant.objection,
    LANDING_V2_MEDIA.accountant.attitude,
    LANDING_V2_MEDIA.accountant.presenting,
    LANDING_V2_MEDIA.accountant.action,
    ...machineFrames,
    LANDING_V2_MEDIA.daily,
    LANDING_V2_MEDIA.pricing.birdee,
    LANDING_V2_MEDIA.pricing.coffees,
    LANDING_V2_MEDIA.fit.forBoard,
    LANDING_V2_MEDIA.fit.birdee,
    LANDING_V2_MEDIA.fit.notForBoard,
    LANDING_V2_MEDIA.privacy,
  ]));
}
