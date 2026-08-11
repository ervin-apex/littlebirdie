const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(
  "C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);

const BASE_URL = process.env.LB_VERIFY_URL || "http://127.0.0.1:3000";
const outputDir = path.resolve("output/landing-v2-qa");
fs.mkdirSync(outputDir, { recursive: true });

const report = {
  baseUrl: BASE_URL,
  createdAt: new Date().toISOString(),
  checks: [],
  errors: [],
  screenshots: [],
};

function check(name, pass, details = "") {
  report.checks.push({ name, pass: Boolean(pass), details });
  if (!pass) report.errors.push(`${name}: ${details}`);
}

async function screenshot(page, name) {
  const target = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: target, fullPage: false, animations: "disabled" });
  report.screenshots.push(target);
}

async function setStoryProgress(page, selector, progress) {
  await page.evaluate(
    ({ selector, progress }) => {
      const section = document.querySelector(selector);
      if (!section) throw new Error(`Missing story section ${selector}`);
      const max = Math.max(1, section.offsetHeight - window.innerHeight);
      window.scrollTo({ top: section.offsetTop + max * progress, behavior: "instant" });
    },
    { selector, progress },
  );
  await page.waitForTimeout(450);
}

async function waitForVideoFrame(page, selector) {
  await page.locator(selector).evaluate((video) => new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const timeout = window.setTimeout(finish, 1500);
    const done = () => {
      window.clearTimeout(timeout);
      finish();
    };
    if (typeof video.requestVideoFrameCallback === "function") {
      video.requestVideoFrameCallback(done);
      video.currentTime = Math.max(0, video.duration - 0.045);
    } else if (video.seeking) {
      video.addEventListener("seeked", done, { once: true });
    } else {
      done();
    }
  }));
}

async function scrollToSectionStart(page, selector) {
  await page.evaluate((selector) => {
    const section = document.querySelector(selector);
    const nav = document.querySelector(".lb2-nav");
    if (!section) throw new Error(`Missing section ${selector}`);
    window.scrollTo({
      top:
        section.getBoundingClientRect().top +
        window.scrollY -
        (nav?.getBoundingClientRect().height || 0),
      behavior: "instant",
    });
  }, selector);
  await page.waitForTimeout(350);
}

async function verifyViewport(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const runtimeErrors = [];
  const mediaRequests = [];
  page.on("request", (request) => {
    if (request.url().includes("/media/landing-v2/")) mediaRequests.push(request.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));

  const response = await page.goto(`${BASE_URL}/landing-v2`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const label = `${viewport.width}x${viewport.height}`;
  check(`${label} HTTP 200`, response?.status() === 200, String(response?.status()));
  check(`${label} title`, (await page.title()).includes("Little Birdee"), await page.title());
  check(`${label} one h1`, (await page.locator("h1").count()) === 1, String(await page.locator("h1").count()));
  check(`${label} all sections`, (await page.locator("main > section").count()) === 8, String(await page.locator("main > section").count()));
  check(`${label} no framework overlay`, (await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count()) === 0);

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  check(`${label} no horizontal overflow`, overflow.scrollWidth <= overflow.clientWidth + 1, JSON.stringify(overflow));

  const mediaHygiene = await page.evaluate(() => ({
    videoCount: document.querySelectorAll("video").length,
    unmuted: [...document.querySelectorAll("video")].filter((video) => !video.muted).length,
    controls: [...document.querySelectorAll("video")].filter((video) => video.controls).length,
  }));
  check(`${label} all video muted`, mediaHygiene.unmuted === 0, JSON.stringify(mediaHygiene));
  check(`${label} no video controls`, mediaHygiene.controls === 0, JSON.stringify(mediaHygiene));
  check(`${label} machine media lazy before scroll`, !mediaRequests.some((url) => url.includes("profit-machine-master")), mediaRequests.join(" | "));
  check(`${label} demo held back until media is ready`, (await page.locator("#demo").count()) === 0);
  const ctaLabels = await page.locator("a.lb2-button[href]").allTextContents();
  check(`${label} account CTAs use approved copy`, ctaLabels.every((text) => text.trim().startsWith("Create account")), ctaLabels.join(" | "));

  await screenshot(page, `${label}-hero`);
  for (const [storyProgress, storyName] of [
    [0.1, "yesterday"],
    [0.5, "this-week"],
    [0.86, "why-not"],
  ]) {
    await setStoryProgress(page, "#visibility", storyProgress);
    const visibilityClip = page.locator('.lb2-visibility__birdee video[data-active="true"]');
    if (await visibilityClip.count()) {
      await visibilityClip.evaluate((video) => { video.playbackRate = 16; });
      await page.waitForFunction(
        () => document.querySelector('.lb2-visibility__birdee video[data-active="true"]')?.ended,
        undefined,
        { timeout: 2500 },
      );
    }
    await screenshot(page, `${label}-visibility-${storyName}`);
  }
  await setStoryProgress(page, "#accountant", 0.08);
  await screenshot(page, `${label}-accountant-question`);
  await setStoryProgress(page, "#accountant", 0.88);
  await screenshot(page, `${label}-accountant-final`);
  await page.evaluate(() => {
    const machine = document.querySelector("#how-it-works");
    if (!machine) throw new Error("Missing machine section");
    window.scrollTo({ top: Math.max(0, machine.offsetTop - window.innerHeight * 0.45), behavior: "instant" });
  });
  await page.waitForTimeout(350);
  await screenshot(page, `${label}-accountant-machine-seam`);
  await setStoryProgress(page, "#how-it-works", 1);
  await waitForVideoFrame(page, ".lb2-machine__video");
  await screenshot(page, `${label}-machine-final`);
  check(`${label} machine has no player timeline`, (await page.locator(".lb2-machine__timeline").count()) === 0);
  check(`${label} machine media loads near story`, mediaRequests.some((url) => url.includes("profit-machine-master")), mediaRequests.join(" | "));

  await scrollToSectionStart(page, "#daily-chirp");
  const chirpVideo = page.locator("#daily-chirp .lb-chirp__source");
  await page.waitForTimeout(250);
  const chirpState = await chirpVideo.evaluate((video) => ({
    src: video.currentSrc,
    loop: video.loop,
    paused: video.paused,
    currentTime: video.currentTime,
  }));
  check(`${label} daily chirp uses original route resource`, chirpState.src.includes("daily-birdee-chirp-raw.mp4"), JSON.stringify(chirpState));
  check(`${label} daily chirp is one-shot`, !chirpState.loop && (!chirpState.paused || chirpState.currentTime > 0), JSON.stringify(chirpState));
  await screenshot(page, `${label}-daily-chirp`);
  await scrollToSectionStart(page, "#pricing");
  await screenshot(page, `${label}-pricing`);
  await scrollToSectionStart(page, "#who-its-for");
  await screenshot(page, `${label}-fit`);
  await scrollToSectionStart(page, "#privacy");
  await screenshot(page, `${label}-privacy`);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await page.waitForTimeout(250);
  await screenshot(page, `${label}-footer`);

  const failedImages = await page.evaluate(() =>
    [...document.images]
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src),
  );
  check(`${label} no broken images`, failedImages.length === 0, failedImages.join(" | "));

  if (viewport.width > 820) {
    await page.goto(`${BASE_URL}/landing-v2`, { waitUntil: "networkidle" });
    await page.locator('.lb2-nav__desktop a[href="#pricing"]').click();
    let anchor;
    for (let attempt = 0; attempt < 14; attempt += 1) {
      await page.waitForTimeout(400);
      anchor = await page.evaluate(() => ({
        top: document.querySelector("#pricing")?.getBoundingClientRect().top,
        nav: document.querySelector(".lb2-nav")?.getBoundingClientRect().height,
      }));
      if (Number(anchor.top) >= Number(anchor.nav) - 4 && Number(anchor.top) <= Number(anchor.nav) + 40) break;
    }
    check(`${label} pricing anchor clears header`, Number(anchor.top) >= Number(anchor.nav) - 4 && Number(anchor.top) <= Number(anchor.nav) + 40, JSON.stringify(anchor));
  } else {
    await page.goto(`${BASE_URL}/landing-v2`, { waitUntil: "networkidle" });
    await page.waitForTimeout(150);
    const toggle = page.locator(".lb2-nav__toggle");
    await toggle.click();
    await page.waitForFunction(
      () => document.querySelector(".lb2-nav__toggle")?.getAttribute("aria-expanded") === "true",
      undefined,
      { timeout: 3000 },
    );
    check(`${label} mobile menu opens`, (await toggle.getAttribute("aria-expanded")) === "true");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(80);
    check(`${label} Escape closes mobile menu`, (await toggle.getAttribute("aria-expanded")) === "false");
    check(`${label} Escape restores focus`, await toggle.evaluate((element) => document.activeElement === element));
  }

  check(`${label} no runtime errors`, runtimeErrors.length === 0, runtimeErrors.join(" | "));
  await context.close();
}

async function verifyStoryTimelines(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${BASE_URL}/landing-v2`, { waitUntil: "networkidle" });

  for (const [progress, expected, name] of [
    [0.1, "yesterday", "visibility-act-01-yesterday"],
    [0.5, "this week", "visibility-act-02-this-week"],
    [0.86, "why not", "visibility-act-03-why-not"],
  ]) {
    await setStoryProgress(page, "#visibility", progress);
    const copy = (await page.locator('.lb2-visibility__headline h2[data-visible="true"]').innerText()).toLowerCase();
    check(`visibility ${progress} copy`, copy.includes(expected), copy);
    const activeVideo = page.locator('.lb2-visibility__birdee video[data-active="true"]');
    check(`visibility ${progress} one active clip`, (await activeVideo.count()) === 1, String(await activeVideo.count()));
    const initialState = await activeVideo.evaluate((video) => ({
      currentTime: video.currentTime,
      duration: video.duration,
      loop: video.loop,
      paused: video.paused,
      playbackRate: video.playbackRate,
      src: video.currentSrc,
    }));
    check(`visibility ${progress} clip does not loop`, !initialState.loop, JSON.stringify(initialState));
    const expectedRate = progress < 2 / 3 ? 1.45 : 1.2;
    check(
      `visibility ${progress} authored playback speed`,
      Math.abs(initialState.playbackRate - expectedRate) < 0.01,
      JSON.stringify(initialState),
    );
    if (progress >= 2 / 3) {
      check(
        "visibility concerned clip is the shortened endpoint",
        initialState.src.includes("concerned") && initialState.duration <= 2.81,
        JSON.stringify(initialState),
      );
    }
    await activeVideo.evaluate((video) => { video.playbackRate = 16; });
    await page.waitForFunction(
      () => document.querySelector('.lb2-visibility__birdee video[data-active="true"]')?.ended,
      undefined,
      { timeout: 2500 },
    );
    const heldState = await activeVideo.evaluate((video) => ({
      currentTime: video.currentTime,
      duration: video.duration,
      ended: video.ended,
      paused: video.paused,
    }));
    check(
      `visibility ${progress} holds its last frame`,
      heldState.ended && heldState.paused && Math.abs(heldState.duration - heldState.currentTime) < 0.08,
      JSON.stringify(heldState),
    );
    await screenshot(page, name);
  }

  const finalBeforeScroll = await page.locator('.lb2-visibility__lowering').evaluate((video) => video.currentTime);
  await setStoryProgress(page, "#visibility", 0.94);
  const finalAfterScroll = await page.locator('.lb2-visibility__lowering').evaluate((video) => video.currentTime);
  check(
    "visibility why-not is not scroll scrubbed",
    Math.abs(finalBeforeScroll - finalAfterScroll) < 0.02,
    `${finalBeforeScroll} -> ${finalAfterScroll}`,
  );

  for (const [progress, title, amount] of [
    [0.1, "YR PROFIT THIS WEEK", "?"],
    [0.3, "YR PROFIT TMRW", "?"],
    [0.6, "YR PROFIT LAST WEEK", "$4,140"],
    [0.9, "YR PROFIT TMRW", "$916"],
  ]) {
    await setStoryProgress(page, "#accountant", progress);
    const boardTitle = await page.locator(".lb2-accountant__board-title").innerText();
    const boardAmount = await page.locator(".lb2-accountant__board-screen strong").innerText();
    check(`accountant ${progress} board`, boardTitle === title && boardAmount === amount, `${boardTitle} / ${boardAmount}`);
  }

  for (const [progress, expected] of [
    [0.05, "historical numbers"],
    [0.14, "prediction of revenue"],
    [0.25, "packages"],
    [0.5, "impact yr profit"],
    [0.95, "budget to actual"],
  ]) {
    await setStoryProgress(page, "#how-it-works", progress);
    const copy = (await page.locator(".lb2-machine__mobile-copy").innerText()).toLowerCase();
    check(`machine ${progress} copy`, copy.includes(expected), copy);
    const state = await page.locator(".lb2-machine__video").evaluate((video) => ({
      currentTime: video.currentTime,
      paused: video.paused,
    }));
    check(`machine ${progress} paused`, state.paused, JSON.stringify(state));
    const expectedTime = Math.min(1, progress / 0.86) * 33.208333;
    check(`machine ${progress} seek`, Math.abs(state.currentTime - expectedTime) < 0.75, JSON.stringify(state));
  }

  await setStoryProgress(page, "#how-it-works", 0.9);
  const holdStart = await page.locator(".lb2-machine__video").evaluate((video) => video.currentTime);
  await setStoryProgress(page, "#how-it-works", 0.98);
  const holdEnd = await page.locator(".lb2-machine__video").evaluate((video) => video.currentTime);
  check(
    "machine final frame holds through the reserved scroll tail",
    Math.abs(holdStart - 33.208333) < 0.12 && Math.abs(holdEnd - 33.208333) < 0.12,
    `${holdStart} -> ${holdEnd}`,
  );

  for (const [progress, name] of [
    [0.178 * 0.86, "machine-seam-01-before"],
    [0.186 * 0.86, "machine-seam-01-after"],
    [0.36 * 0.86, "machine-seam-02-before"],
    [0.368 * 0.86, "machine-seam-02-after"],
    [0.814 * 0.86, "machine-final-seam-before"],
    [0.822 * 0.86, "machine-final-seam-after"],
  ]) {
    await setStoryProgress(page, "#how-it-works", progress);
    await screenshot(page, name);
  }
  check("story timelines no runtime errors", errors.length === 0, errors.join(" | "));
  await context.close();
}

async function verifyReducedMotion(browser) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${BASE_URL}/landing-v2`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const label = `${viewport.width}x${viewport.height}`;
    const state = await page.evaluate(() => ({
      machineVideos: document.querySelectorAll("#how-it-works video").length,
      visibilityCards: document.querySelectorAll("#visibility .lb2-reduced-story__grid article").length,
      accountantCards: document.querySelectorAll("#accountant .lb2-reduced-story__grid article").length,
      machineCards: document.querySelectorAll("#how-it-works .lb2-reduced-story__grid article").length,
      smooth: getComputedStyle(document.documentElement).scrollBehavior,
    }));
    check(`${label} reduced motion shows all visibility acts`, state.visibilityCards === 3, JSON.stringify(state));
    check(`${label} reduced motion shows all accountant acts`, state.accountantCards === 4, JSON.stringify(state));
    check(`${label} reduced motion shows all machine acts`, state.machineCards === 5, JSON.stringify(state));
    check(`${label} reduced motion uses machine stills`, state.machineVideos === 0, JSON.stringify(state));
    check(`${label} reduced motion disables smooth scroll`, state.smooth === "auto", JSON.stringify(state));
    for (const [selector, name] of [["#visibility", "visibility"], ["#accountant", "accountant"], ["#how-it-works", "machine"]]) {
      await scrollToSectionStart(page, selector);
      await screenshot(page, `${label}-reduced-${name}`);
    }
    check(`${label} reduced motion no runtime errors`, errors.length === 0, errors.join(" | "));
    await context.close();
  }
}

async function verifyLegacyRoutes(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const root = await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  check("legacy root still loads", root?.status() === 200 && (await page.locator("h1").first().innerText()).includes("profit"));
  await page.goto(`${BASE_URL}/landing`, { waitUntil: "domcontentloaded" });
  check("legacy /landing redirect remains", new URL(page.url()).pathname === "/", page.url());
  await context.close();
}

(async () => {
  const chromePath = [
    process.env.LB_CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].find((candidate) => candidate && fs.existsSync(candidate));

  const browser = await chromium.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
  });
  try {
    await verifyLegacyRoutes(browser);
    await verifyStoryTimelines(browser);
    for (const viewport of [
      { width: 1904, height: 864 },
      { width: 1440, height: 900 },
      { width: 1280, height: 800 },
      { width: 1024, height: 768 },
      { width: 651, height: 900 },
      { width: 481, height: 786 },
      { width: 390, height: 844 },
    ]) {
      await verifyViewport(browser, viewport);
    }
    await verifyReducedMotion(browser);
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    passed: report.checks.filter((item) => item.pass).length,
    failed: report.checks.filter((item) => !item.pass).length,
    errors: report.errors,
    outputDir,
  }, null, 2));
  if (report.errors.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
