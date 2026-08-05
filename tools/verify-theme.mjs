#!/usr/bin/env node
/**
 * Theme persistence check — drives production builds of client (:3000),
 * admin (:3001) and the marketing site (:3002).
 *
 *     cd client  && npm run build && npm run preview
 *     cd admin   && npm run build && npm run preview
 *     cd landing && npm run build && npm run preview
 *     node tools/verify-theme.mjs
 *
 * Light mode is only worth having if the choice survives the reload, and a
 * choice that survives the reload is only worth having if the page does not
 * arrive in the other palette first. Those are two different failures with two
 * different causes — one is storage, one is ordering — and the second is the
 * one that gets missed, because it passes every assertion that reads the DOM
 * after load. By then the flash has already happened.
 *
 * So the load is sampled frame by frame. A rAF callback runs immediately before
 * the paint of its own frame, which makes the computed background colour read
 * inside it the colour that frame is about to be painted in. Frames from
 * `first-paint` onward are the ones a person actually saw; anything sampled
 * earlier is the browser still presenting the previous document, and counting
 * those would fail a build that is behaving correctly.
 *
 * `first-paint`, not `first-contentful-paint`, and the distinction is the whole
 * check. A background colour is not "contentful", so FCP does not fire until
 * React has rendered text — measured here at 300-400ms on an unthrottled load,
 * while the flash it is supposed to catch is over by 107ms. An earlier version
 * of this file compared the palette against FCP and passed a build with the
 * `index.html` script deleted, three times out of three. It was measuring an
 * instant that arrives after the evidence is gone.
 *
 * The current check was built against that same stripped build and separates
 * cleanly: nine runs of each across 1x, 6x and 20x CPU throttling gave zero
 * on-screen dark frames shipped, and two to five every run without the script.
 *
 * Storage is deliberately hostile in a few of these: a value that is not a
 * palette, and a `localStorage` that throws on access the way Safari private
 * browsing used to. Neither may take the app down, and both must land on dark.
 */

import { chromium, launchOpts } from "./playwright-env.mjs";

/**
 * `signin` is the control that takes the app from public to authenticated, and
 * `null` says the app has no such boundary. The marketing site is one public
 * page: the sections below that sign in and re-measure still run for it, minus
 * the click, because what they are really asserting — that a choice survives a
 * reload — does not depend on there being an inside.
 *
 * Three keys, not one. The product and the marketing site are separate origins
 * in production and a reader of one is not necessarily the user of the other;
 * sharing a key would mean a preference set on either silently rewrote both.
 */
const APPS = [
  { name: "client", base: process.env.BASE_CLIENT || "http://localhost:3000", key: "fanation.theme",
    publicRoutes: ["/login", "/signup"], signin: ".btn-blue" },
  { name: "admin", base: process.env.BASE_ADMIN || "http://localhost:3001", key: "fanation.admin.theme",
    publicRoutes: ["/login"], signin: ".btn-blue" },
  { name: "landing", base: process.env.BASE_LANDING || "http://localhost:3002", key: "fanation.landing.theme",
    publicRoutes: ["/"], signin: null },
];

const DARK = "#07091A";
const LIGHT = "#F3F5FA";

/** The same two hexes as computed by the browser, which is how a frame reads. */
const BG = { dark: "rgb(7, 9, 26)", light: "rgb(243, 245, 250)" };

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ FAIL " + name + (detail ? " — " + detail : "")); }
};

/* Installed before any page script runs — earlier than the inline script in
   `index.html`, which is the only reason the first frames are visible at all.
 *
 * Paint timings are observed before the sampler starts on purpose. If the
 * sampler ever throws, a missing `fp` empties the frame list and quietly
 * disables the one assertion this file exists to make rather than failing it —
 * so the two are ordered, and the whole thing records its own failure into
 * `probeError`, which is asserted on per page. An unhealthy probe has to look
 * like a failure, not like a pass.
 *
 * `document.body` is null for the first few frames: this runs at document-start
 * and the parser has not built it yet. Those frames are skipped rather than
 * recorded as a palette, because a document with no body has no background to
 * flash. */
const PROBE = () => {
  const T = { frames: [], fp: null, fcp: null, probeError: null };
  window.__themeTrace = T;
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.name === "first-paint" && T.fp === null) T.fp = e.startTime;
        if (e.name === "first-contentful-paint" && T.fcp === null) T.fcp = e.startTime;
      }
    }).observe({ type: "paint", buffered: true });

    let held = 0;
    const tick = () => {
      if (document.body) {
        T.frames.push({
          t: performance.now(),
          bg: getComputedStyle(document.body).backgroundColor,
          attr: document.body.getAttribute("data-theme"),
        });
        /* Stop once the app has held a rendered frame five in a row. The window
           being measured is the load; leaving the sampler running would fold
           the deliberate toggles further down into the same trace. */
        held = (document.getElementById("root")?.childElementCount ?? 0) > 0 ? held + 1 : 0;
        if (held >= 5) return;
      }
      if (T.frames.length < 300) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  } catch (e) {
    T.probeError = String(e);
  }
};

const settle = async (pg) => {
  await pg.waitForLoadState("networkidle");
  await pg.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

const read = (pg) =>
  pg.evaluate(() => ({
    body: document.body.getAttribute("data-theme"),
    meta: document.querySelector('meta[name="theme-color"]')?.getAttribute("content") ?? null,
    rooted: (document.getElementById("root")?.childElementCount ?? 0) > 0,
    trace: window.__themeTrace,
  }));

const stored = (pg, key) => pg.evaluate((k) => localStorage.getItem(k), key);

/**
 * Waited for, then counted.
 *
 * `locator.count()` does not auto-wait and `locator.click()` does, so counting
 * the moment `networkidle` returns reads zero and the very next line clicks the
 * element successfully — a race that reports as an app fault. The count is
 * still asserted exactly, because two toggles rendering at once would be a real
 * bug worth catching.
 */
const toggleCount = async (pg) => {
  const t = pg.locator('button[title="Toggle light / dark"]');
  await t.first().waitFor({ state: "visible" });
  return t.count();
};

/** The probe measures the app; nothing measures the probe. This does. */
const probeOk = (label, s) => {
  ok(label + ": probe installed cleanly", !s.trace?.probeError, s.trace?.probeError);
};

/** Frames the browser actually put on screen for this document. */
const onScreen = (trace) =>
  trace && trace.fp !== null ? trace.frames.filter((f) => f.t >= trace.fp) : [];

/**
 * Nothing in the wrong palette reached the screen during the load.
 *
 * Three assertions rather than one, because the interesting one can pass for
 * two uninteresting reasons: no frames captured at all, or a background colour
 * that never matches either constant. Both would read as "no flash found".
 */
const noFlash = (label, s, want) => {
  const other = want === "dark" ? "light" : "dark";
  const shown = onScreen(s.trace);
  const wrong = shown.filter((f) => f.bg === BG[other]);
  const fp = s.trace?.fp === null || s.trace?.fp === undefined ? "none" : Math.round(s.trace.fp) + "ms";
  ok(label + ": frames were captured on screen", shown.length > 0, "first-paint: " + fp);
  ok(label + ": palette constants match this app", shown.some((f) => f.bg === BG[want]),
    "expected " + BG[want] + ", saw " + JSON.stringify([...new Set(shown.map((f) => f.bg))]));
  ok(label + ": no " + other + " frame reaches the screen", wrong.length === 0,
    wrong.length + " of " + shown.length + " on-screen frames were " + other +
    ", at " + JSON.stringify(wrong.map((f) => Math.round(f.t))) + "ms — first-paint " + fp);
};

const browser = await chromium.launch(launchOpts);

for (const app of APPS) {
  console.log("\n" + app.name + " — " + app.base);
  const ctx = await browser.newContext();
  await ctx.addInitScript(PROBE);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  // ── 1. A visitor who has never chosen ──────────────────────────────────────
  await page.goto(app.base + "/", { waitUntil: "domcontentloaded" });
  await settle(page);
  let s = await read(page);
  probeOk("first visit", s);
  ok("first visit renders dark", s.body === "dark", "got " + s.body);
  noFlash("first visit", s, "dark");
  ok("theme-color matches dark", s.meta === DARK, "got " + s.meta);
  ok("loading alone writes nothing to storage", (await stored(page, app.key)) === null);

  // ── 2. The screens you see before you have signed in ───────────────────────
  /* The toggle used to live only in the shell, which meant the one palette a
     visitor could not choose was the one they were looking at. `/login` and
     `/signup` render outside the shell — nesting them would loop, because the
     shell sends anyone unauthenticated back to `/login` — so they carry their
     own control, and the exact count in §3 stays exact rather than softening to
     "at least one".
   *
   * The reload here matters more than any other in this file: `/login` is the
   * first document most people load, so the signed-out screen is where a flash
   * would actually be seen. */
  let n = await toggleCount(page);
  ok("exactly one toggle on the signed-out screen", n === 1, "found " + n);
  await page.locator('button[title="Toggle light / dark"]').first().click();
  await settle(page);
  s = await read(page);
  ok("signed-out toggle switches to light", s.body === "light", "got " + s.body);
  ok("signed-out theme-color follows to light", s.meta === LIGHT, "got " + s.meta);
  ok("signed-out choice is written to storage", (await stored(page, app.key)) === "light");

  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page);
  s = await read(page);
  probeOk("signed-out reload", s);
  ok("signed-out choice survives reload", s.body === "light", "got " + s.body);
  noFlash("signed-out reload on light", s, "light");

  /* Every public route, by its own path rather than by the redirect, so a
     toggle dropped from one of them cannot hide behind another. */
  for (const r of app.publicRoutes) {
    await page.goto(app.base + r, { waitUntil: "domcontentloaded" });
    await settle(page);
    n = await toggleCount(page);
    ok("exactly one toggle on " + r, n === 1, "found " + n);
    s = await read(page);
    ok(r + " holds light", s.body === "light", "got " + s.body);
    noFlash("direct load of " + r + " on light", s, "light");
  }

  /* Back to dark, so §3 starts where it did before this section existed. */
  await page.goto(app.base + "/", { waitUntil: "domcontentloaded" });
  await settle(page);
  await page.locator('button[title="Toggle light / dark"]').first().click();
  await settle(page);
  ok("signed-out toggle returns to dark", (await read(page)).body === "dark");
  ok("signed-out dark is stored explicitly", (await stored(page, app.key)) === "dark");

  // ── 3. An explicit choice, from inside ─────────────────────────────────────
  /* An app with no signed-in state skips the crossing and makes the choice
     where it stands. §4 needs light in storage and a page to reload; both are
     satisfied either way. */
  if (app.signin) {
    await page.click(app.signin);
    await settle(page);
    n = await toggleCount(page);
    ok("exactly one toggle once signed in", n === 1, "found " + n);
  }
  await page.locator('button[title="Toggle light / dark"]').first().click();
  await settle(page);
  s = await read(page);
  ok("toggle switches to light", s.body === "light", "got " + s.body);
  ok("theme-color follows to light", s.meta === LIGHT, "got " + s.meta);
  ok("choice is written to storage", (await stored(page, app.key)) === "light");

  // ── 4. The reload, which is the whole point ────────────────────────────────
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page);
  s = await read(page);
  probeOk("reload", s);
  ok("choice survives reload", s.body === "light", "got " + s.body);
  noFlash("reload on light", s, "light");
  ok("theme-color survives reload", s.meta === LIGHT, "got " + s.meta);

  // ── 5. Choosing dark is a choice too, not just the absence of one ──────────
  /* The reload in §4 dropped the session — auth lives in memory — so the apps
     that have an inside have to sign in again to reach the toggle. */
  if (app.signin) {
    await page.click(app.signin);
    await settle(page);
  }
  await page.locator('button[title="Toggle light / dark"]').first().waitFor({ state: "visible" });
  await page.locator('button[title="Toggle light / dark"]').first().click();
  await settle(page);
  ok("toggling back stores dark explicitly", (await stored(page, app.key)) === "dark");
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page);
  s = await read(page);
  ok("dark survives reload", s.body === "dark", "got " + s.body);
  noFlash("reload on dark", s, "dark");

  // ── 6. A stored value nobody wrote ─────────────────────────────────────────
  await page.evaluate((k) => localStorage.setItem(k, "chartreuse"), app.key);
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page);
  s = await read(page);
  ok("unrecognised stored value falls back to dark", s.body === "dark", "got " + s.body);
  ok("unrecognised stored value still renders the app", s.rooted);
  ok("unrecognised stored value raises nothing", errors.length === 0, errors[0]);

  await ctx.close();

  // ── 7. Storage that throws on access ───────────────────────────────────────
  const blocked = await browser.newContext();
  await blocked.addInitScript(PROBE);
  await blocked.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() { throw new DOMException("The operation is insecure.", "SecurityError"); },
    });
  });
  const bp = await blocked.newPage();
  const bErrors = [];
  bp.on("pageerror", (e) => bErrors.push(String(e)));
  await bp.goto(app.base + "/", { waitUntil: "domcontentloaded" });
  await settle(bp);
  s = await read(bp);
  probeOk("blocked storage", s);
  ok("blocked storage still boots the app", s.rooted);
  ok("blocked storage renders dark", s.body === "dark", "got " + s.body);
  noFlash("blocked storage", s, "dark");
  ok("blocked storage raises nothing", bErrors.length === 0, bErrors[0]);
  await blocked.close();

  // ── 8. Two tabs of the same app ────────────────────────────────────────────
  const shared = await browser.newContext();
  const a = await shared.newPage();
  const b = await shared.newPage();
  await a.goto(app.base + "/", { waitUntil: "domcontentloaded" });
  await b.goto(app.base + "/", { waitUntil: "domcontentloaded" });
  await settle(a);
  await settle(b);
  await a.evaluate((k) => localStorage.setItem(k, "light"), app.key);
  let followed = false;
  for (let i = 0; i < 60 && !followed; i++) {
    followed = (await b.evaluate(() => document.body.getAttribute("data-theme"))) === "light";
    if (!followed) await new Promise((r) => setTimeout(r, 50));
  }
  ok("a second tab follows the change", followed);
  await shared.close();

  // ── 9. The device the flash actually shows up on ───────────────────────────
  /* Unthrottled, the gap between first paint and React mounting is small enough
     that a broken build can get lucky. 6x is roughly a mid-range Android, which
     is most of this audience, and it widens that gap to hundreds of
     milliseconds — the stripped build painted dark for ~290ms here. */
  const slow = await browser.newContext();
  await slow.addInitScript(PROBE);
  await slow.addInitScript(([k]) => { try { localStorage.setItem(k, "light"); } catch (e) { /* not under test here */ } }, [app.key]);
  const sp = await slow.newPage();
  const cdp = await slow.newCDPSession(sp);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  await sp.goto(app.base + "/", { waitUntil: "domcontentloaded" });
  await settle(sp);
  s = await read(sp);
  probeOk("throttled 6x", s);
  ok("throttled 6x renders light", s.body === "light", "got " + s.body);
  noFlash("throttled 6x on light", s, "light");
  await slow.close();
}

await browser.close();

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
