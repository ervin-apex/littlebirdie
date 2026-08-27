export const LANDING_V2_MEDIA = {
  hero: {
    /*
     * The same 24fps animation twice, both with a real alpha channel: VP9 keeps
     * it in a second WebM stream, HEVC in an auxiliary layer. Two files because
     * no single container plays transparently everywhere - WebKit will not take
     * the WebM, everything else will not take the HEVC.
     */
    master: "/media/landing-v2/hero/birdee-entrance-hover-master-alpha-optimized.webm",
    masterHevc: "/media/landing-v2/hero/birdee-entrance-hover-master-alpha.mp4",
    mobileEntrance:
      "/media/landing-v2/hero/birdee-entrance-mobile-alpha-animated.webp",
    mobileHover:
      "/media/landing-v2/hero/birdee-hover-mobile-alpha-animated.webp",
    hoverStart: 6.292,
    poster: "/media/landing-v2/hero/birdee-poster.webp",
  },
  /*
   * The two product videos. Each poster is built from a real frame of the
   * finished cut, so the thumbnail promises exactly what plays. The 960 variant
   * is the <video poster>, which cannot go through next/image.
   */
  videos: {
    setup: {
      src: "/media/landing-v2/videos/setup-walkthrough.mp4",
      poster: "/media/landing-v2/videos/setup-poster.jpg",
      posterSmall: "/media/landing-v2/videos/setup-poster-960.jpg",
      length: "0:49",
    },
    chirp: {
      src: "/media/landing-v2/videos/daily-chirp.mp4",
      poster: "/media/landing-v2/videos/chirp-poster.jpg",
      posterSmall: "/media/landing-v2/videos/chirp-poster-960.jpg",
      length: "0:35",
    },
  },
  visibility: {
    searching: "/media/landing-v2/visibility/hero-v2/birdee-searching.webp",
    concerned: "/media/landing-v2/visibility/hero-v2/birdee-concerned.webp",
  },
  whatWeDo: {
    productStory: {
      desktop: "/media/landing-v2/what-we-do/product-story-desktop-v2.webp",
      medium: "/media/landing-v2/what-we-do/product-story-medium-v2.webp",
      mobile: "/media/landing-v2/what-we-do/product-story-mobile-v2.webp",
    },
  },
  /*
   * These props are trimmed to their own drawn pixels, so a CSS box is the
   * artwork rather than the artwork plus a transparent margin. The margins were
   * not uniform - the four poses filled 42%, 57%, 67% and 69% of their own
   * width - so a single CSS width used to render four visibly different birds.
   * The ratios below are those trimmed files, and the stylesheet places every
   * prop against them.
   */
  accountant: {
    receipt: "/media/landing-v2/accountant/v3/receipt.webp",
    board: "/media/landing-v2/accountant/v3/board.webp",
    objection: "/media/landing-v2/accountant/v3/birdee-objection.webp",
    attitude: "/media/landing-v2/accountant/v3/birdee-attitude.webp",
    presenting: "/media/landing-v2/accountant/v3/birdee-presenting.webp",
    action: "/media/landing-v2/accountant/v3/birdee-action.webp",
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
    /*
     * Two art directions, not three. A portrait screen gets the 9:16 renders,
     * which are composed for that frame - machine bleeding off both sides, the
     * whole upper half left clear for the heading. Everything else gets the wide
     * renders. The old 16:9 mobile slides are gone: a window narrower than 820px
     * but still landscape is better served by the wide art, which is now also
     * the smaller download.
     *
     * The wide renders are not all one ratio - packages and impact are much
     * wider than 16:9 - so each moment carries its own --art-ratio in the
     * stylesheet.
     */
    portraitSequence: [
      "/media/landing-v2/machine/mobile-fullbleed-v5/01-historical.webp",
      "/media/landing-v2/machine/mobile-fullbleed-v5/02-prediction.webp",
      "/media/landing-v2/machine/mobile-fullbleed-v5/03-packages.webp",
      "/media/landing-v2/machine/mobile-fullbleed-v5/04-impact.webp",
      "/media/landing-v2/machine/mobile-fullbleed-v5/05-budget-actual-v2.webp",
    ],
    desktopSequence: [
      "/media/landing-v2/machine/desktop-slides-v4/slide-01-historical.webp",
      "/media/landing-v2/machine/desktop-slides-v4/slide-02-prediction.webp",
      "/media/landing-v2/machine/desktop-slides-v4/slide-03-packages.webp",
      "/media/landing-v2/machine/desktop-slides-v4/slide-04-impact.webp",
      "/media/landing-v2/machine/desktop-slides-v4/slide-05-budget-actual.webp",
    ],
    twoPage: {
      inputs: {
        wide: "/media/landing-v2/machine/two-page-v5/inputs-wide.webp",
        medium: "/media/landing-v2/machine/two-page-v5/inputs-medium.webp",
        portrait: "/media/landing-v2/machine/two-page-v5/inputs-portrait.webp",
      },
      outcome: {
        wide: "/media/landing-v2/machine/two-page-v5/outcome-wide.webp",
        medium: "/media/landing-v2/machine/two-page-v5/outcome-medium.webp",
        portrait: "/media/landing-v2/machine/two-page-v5/outcome-portrait.webp",
      },
    },
    duration: 33.208333,
  },
  pricing: {
    birdee: "/media/landing-v2/pricing/hero-v2/birdee.webp",
    coffees: "/media/landing-v2/pricing/two-coffees.webp",
  },
  fit: {
    forBoard: "/media/landing-v2/fit/who-its-for-board-scott-v2.png",
    birdee: "/media/landing-v2/fit/hero-v2/birdee.webp",
    notForBoard: "/media/landing-v2/fit/who-its-not-for-board.webp",
  },
  privacy: "/media/landing-v2/privacy/hero-v2/birdee-shield.webp",
  community: {
    supportCall: "/media/landing-v2/community/birdee-support-call.png",
    discordSymbol: "/media/landing-v2/community/discord-symbol-white.svg",
  },
  cta: {
    shellDesktop: "/media/landing-v2/cta/cta-shell-desktop-v2.png",
    shellMedium: "/media/landing-v2/cta/cta-shell-medium-v2.png",
    shellMobile: "/media/landing-v2/cta/cta-shell-mobile-v2.png",
  },
  testimonials: {
    idlePoster: "/media/landing-v2/testimonials/birdee-grounded-idle-poster-v3.png",
    idleVideo: "/media/landing-v2/testimonials/birdee-grounded-one-shot-v4.mp4",
    idleImage: "/media/landing-v2/testimonials/birdee-grounded-idle-loop-v3.webp",
  },
} as const;

/**
 * Phones held upright use the compact 4:5 composition. Wider upright devices
 * use the 4:3 medium composition so each breakpoint has an asset shaped for
 * the space it actually occupies.
 *
 * Shared by the `<picture>` source, the preload list and the `--art-ratio`
 * block in the stylesheet - all three have to agree or a screen preloads one
 * art direction, is styled for a second and displays a third.
 */
export const LANDING_V2_MACHINE_PORTRAIT = "(max-width: 820px) and (orientation: portrait)";
export const LANDING_V2_MACHINE_MEDIUM = "(min-width: 600px) and (max-aspect-ratio: 3 / 2)";

/**
 * Images that must be decoded before the landing page is revealed.
 *
 * Only the machine composition needed by the current breakpoint is included;
 * loading both art directions would make the loading screen slower on the
 * mobile devices it is intended to protect.
 */
export function getLandingV2PreloadImages(viewportWidth: number, viewportHeight: number) {
  const machinePortrait = viewportWidth <= 820 && viewportWidth <= viewportHeight;
  const machineMedium = viewportWidth >= 600 && viewportWidth / viewportHeight <= 1.5;
  const machineFrames = machinePortrait
    ? [
        LANDING_V2_MEDIA.machine.twoPage.inputs.portrait,
        LANDING_V2_MEDIA.machine.twoPage.outcome.portrait,
      ]
    : machineMedium
      ? [
          LANDING_V2_MEDIA.machine.twoPage.inputs.medium,
          LANDING_V2_MEDIA.machine.twoPage.outcome.medium,
        ]
      : [
          LANDING_V2_MEDIA.machine.twoPage.inputs.wide,
          LANDING_V2_MEDIA.machine.twoPage.outcome.wide,
        ];

  return Array.from(new Set([
    "/brand/birdee-face-square.png",
    LANDING_V2_MEDIA.hero.poster,
    LANDING_V2_MEDIA.visibility.searching,
    LANDING_V2_MEDIA.visibility.concerned,
    LANDING_V2_MEDIA.accountant.receipt,
    LANDING_V2_MEDIA.accountant.board,
    LANDING_V2_MEDIA.accountant.objection,
    LANDING_V2_MEDIA.accountant.attitude,
    LANDING_V2_MEDIA.accountant.presenting,
    LANDING_V2_MEDIA.accountant.action,
    ...machineFrames,
    LANDING_V2_MEDIA.pricing.birdee,
    LANDING_V2_MEDIA.pricing.coffees,
    LANDING_V2_MEDIA.fit.forBoard,
    LANDING_V2_MEDIA.fit.birdee,
    LANDING_V2_MEDIA.fit.notForBoard,
    LANDING_V2_MEDIA.privacy,
  ]));
}
