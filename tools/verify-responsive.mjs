#!/usr/bin/env node
/**
 * Responsive regression check for the client app.
 *
 *     node tools/verify-responsive.mjs
 *
 * Assumes `npm run preview` is already serving client on :3000.
 *
 * The bar it enforces, per route, per viewport:
 *
 *   1. `scrollWidth <= innerWidth` — nothing runs off the right edge. This is the
 *      check that caught the original bug: every fan route overflowed by exactly
 *      368px at 390px wide, because a flex item defaults to `min-width:auto` and
 *      the search field refused to shrink below its own content.
 *   2. Navigation exists. Above 900px that means the sidebar; below it, the tab
 *      bar. A page you cannot navigate away from is broken even if it fits.
 *   3. No console errors and no failed requests.
 *
 * Media is reported, not enforced, and it is measured by asking each <img>
 * whether it actually decoded rather than by watching for 404s. That distinction
 * matters: `vite preview` answers an unknown path with `index.html` and a 200,
 * so a missing photograph never shows up as a failed request — it shows up as
 * an <img> holding a page of HTML with `naturalWidth === 0`. Watching status
 * codes here would report a clean media run over a site with no pictures in it,
 * which is exactly what an earlier version of this script did.
 *
 * The media is committed and git-tracked — `client/public` is 8.4MB across 183
 * files — so it travels with a clone, and the broken list at the bottom of a run
 * has to read zero on any machine, including a fresh checkout in a container. An
 * earlier version of this note said the opposite, written when the 12MB had to be
 * copied in by hand and a run here proved the layout and nothing about the
 * imagery. That is no longer true. Do not carry it forward and discount a real
 * result.
 *
 * Two things this deliberately does not cover: a <video poster> that fails leaves
 * no trace in `document.images`, and the admin console is a separate application
 * this script never opens. Both are `verify-media.mjs`'s job — it decodes every
 * poster through a fresh Image() and resolves the whole of `lib/brand/media.ts`
 * against both builds, which is stronger than either DOM walk. Run the two
 * together; neither replaces the other.
 *
 * Why every route after the first is reached by pushState rather than `goto`:
 * the store is plain Zustand with no persist middleware, so `authed` is memory
 * only and a full page load wipes it — every protected route would bounce
 * straight back to /login and the run would measure twenty-three copies of the
 * sign-in card. So the script signs in once per viewport and then moves the way
 * the app itself moves, through the History API, which is also a truer test:
 * it exercises the router rather than the server's catch-all rewrite.
 */

import { chromium, launchOpts } from "./playwright-env.mjs";

const BASE = process.env.BASE || "http://localhost:3000";

const ROUTES = [
  "/login", "/signup", "/feed", "/explore", "/reels", "/live", "/messages",
  "/notifications", "/collections", "/subscriptions", "/wallet", "/settings",
  "/creator/sofia",
  "/studio", "/studio/earnings", "/studio/content", "/studio/vault",
  "/studio/tiers", "/studio/fans", "/studio/messages", "/studio/live",
  "/studio/promos", "/studio/analytics", "/studio/payouts", "/studio/verify",
];

/* 390 is an iPhone 14/15, 768 is the widest tablet still under the 900px
   breakpoint — the size that gets the tab bar but not the phone's 560px
   single-column collapse, and therefore the one nobody thinks to check. */
const VIEWPORTS = [
  { name: "phone", width: 390, height: 844, nav: ".tabbar" },
  { name: "tablet", width: 768, height: 1024, nav: ".tabbar" },
  { name: "desktop", width: 1440, height: 900, nav: ".side" },
];

/* /login and /signup render outside the shell — they have no navigation by
   design, because there is nowhere to navigate to until you are signed in. */
const NO_SHELL = new Set(["/login", "/signup"]);

/* Client-side navigation. `pushState` moves the URL without a document request;
   the popstate event is what React Router's history listener is subscribed to,
   and it reads `window.location` — which pushState has already updated. The
   `idx` key is the history library's own bookkeeping; carry it forward or the
   router warns about a state it did not create. */
async function routerGo(page, path) {
  await page.evaluate((p) => {
    const idx = (window.history.state && window.history.state.idx) || 0;
    window.history.pushState({ usr: null, key: String(idx + 1), idx: idx + 1 }, "", p);
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
    window.scrollTo(0, 0);
  }, path);
  await page.waitForFunction((p) => location.pathname === p, path, { timeout: 5000 }).catch(() => {});
  await page.waitForLoadState("networkidle");
  /* pathname changes the instant pushState returns — React has not necessarily
     committed yet, and two animation frames do not guarantee that it has. A large
     enough subtree commits across more frames than two, which is exactly how the
     sign-in assertion in smoke.mjs came to read the login page while sitting at
     /feed. What actually holds this call site together is not the frames but the
     three round-trips stacked above them — waitForFunction, networkidle, and this
     evaluate — landing on a shell that is already mounted, so only the route's own
     subtree has to swap. That was measured rather than assumed: every route at
     every viewport sampled at this exact instant and again 1.5s later, 225
     measurements, zero differences and zero overflow verdicts that would have
     flipped. If a route ever grows heavy enough to break it, this is the line that
     fails first, and the fix is to poll on that route's own content the way
     smoke.mjs does — not to add a third frame. */
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

const browser = await chromium.launch(launchOpts);

let failures = 0;
const brokenImages = new Set();

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  console.log(`\n═══ ${vp.name} — ${vp.width}×${vp.height} ═══`);

  /* Sign in once, through the form, the way a user does. Everything after this
     is a router move inside the same document, so `authed` survives. */
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.click("button.btn-blue");
  await page.waitForFunction(() => location.pathname === "/feed", null, { timeout: 5000 });

  for (const route of ROUTES) {
    const errors = [];
    const badRequests = [];

    const onConsole = (m) => { if (m.type() === "error") errors.push(m.text()); };
    const onPageError = (e) => errors.push(String(e));
    const onResponse = (r) => { if (r.status() >= 400) badRequests.push(`${r.status()} ${r.url()}`); };

    page.on("console", onConsole);
    page.on("pageerror", onPageError);
    page.on("response", onResponse);

    await routerGo(page, route);

    const m = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement.scrollWidth,
      innerWidth: window.innerWidth,
      path: location.pathname,
      /* `complete` is true for a finished load and for a finished failure alike;
         `naturalWidth === 0` on a complete image is the browser saying it has
         the bytes and cannot decode them. Reported as a set of sources rather
         than a tally, because the same avatar appears on nine routes and three
         viewports — a count would say 81 where the truth is one missing file. */
      broken: [...document.images]
        .filter((i) => i.complete && i.naturalWidth === 0)
        .map((i) => new URL(i.currentSrc || i.src, location.href).pathname),
    }));
    m.broken.forEach((p) => brokenImages.add(p));

    const overflow = m.scrollWidth - m.innerWidth;
    const navCount = await page.locator(vp.nav).count();
    const navVisible = navCount > 0 && (await page.locator(vp.nav).first().isVisible());
    const wantsNav = !NO_SHELL.has(route);

    const problems = [];
    if (overflow > 0) problems.push(`overflows by ${overflow}px`);
    if (wantsNav && !navVisible) problems.push(`no ${vp.nav}`);
    if (errors.length) problems.push(`${errors.length} console error(s): ${errors[0].slice(0, 90)}`);
    if (badRequests.length) problems.push(`${badRequests.length} failed request(s): ${badRequests[0]}`);
    if (m.path !== route) problems.push(`landed on ${m.path}`);

    if (problems.length) { failures++; console.log(`  ✗ ${route.padEnd(22)} ${problems.join("; ")}`); }
    else console.log(`  ✓ ${route.padEnd(22)} ${m.scrollWidth}px wide`);

    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("response", onResponse);

    /* /login and /signup unmount the shell and clear nothing else, but the run
       has to get back inside it before the next protected route. */
    if (NO_SHELL.has(route)) await routerGo(page, "/feed");
  }

  /* The More drawer only exists on a phone. Open it once and confirm it renders
     the full navigation — the tab bar carries four destinations, the drawer is
     where the other six live. */
  if (vp.name === "phone") {
    await routerGo(page, "/feed");
    await page.click('.tabbar button[aria-label="More"]');
    await page.waitForSelector(".navdrawer", { timeout: 3000 });
    const links = await page.locator(".navdrawer a").count();
    const ok = links >= 10;
    if (!ok) failures++;
    console.log(`  ${ok ? "✓" : "✗"} More drawer opens with ${links} links`);
    await page.keyboard.press("Escape").catch(() => {});
    await page.click('.navdrawer button[aria-label="Close menu"]').catch(() => {});

    await routerGo(page, "/messages");
    const listPane = await page.getAttribute(".dm", "data-pane");
    await page.locator(".dm-list .row.gap12").first().click();
    const chatPane = await page.getAttribute(".dm", "data-pane");
    const paneOk = listPane === "list" && chatPane === "chat";
    if (!paneOk) failures++;
    console.log(`  ${paneOk ? "✓" : "✗"} messenger panes: ${listPane} → ${chatPane}`);
  }

  await ctx.close();
}

await browser.close();

console.log(`\n${failures === 0 ? "PASS" : `FAIL — ${failures} problem(s)`}`);

/* Distinct files, not occurrences — the same avatar across nine routes and three
   viewports is one file, not 27. This line has to read zero. */
const broken = [...brokenImages].sort();
console.log(`${broken.length} image(s) failed to decode` +
  (broken.length ? ` — no bytes behind these paths:` : ""));
for (const p of broken.slice(0, 12)) console.log(`    ${p}`);
if (broken.length > 12) console.log(`    …and ${broken.length - 12} more`);

process.exit(failures === 0 ? 0 : 1);
