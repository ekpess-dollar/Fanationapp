#!/usr/bin/env node
/**
 * Names the element that is making a page too wide.
 *
 *     node tools/diag-overflow.mjs /feed /creator/sofia
 *     node tools/diag-overflow.mjs --width 768 /studio/analytics
 *
 * This is the second half of `verify-responsive.mjs`. That script tells you a
 * route overflows by 9px; this one tells you which div did it and which of its
 * computed properties is responsible — width, min-width, flex-basis, padding,
 * box-sizing, grid-template-columns. Every overflow in this codebase has come
 * down to one of those six, and three of them were an inline style beating a
 * media query, which only shows up when you print the computed value.
 *
 * Two filters do the real work. The first walks each candidate's ancestors
 * looking for a clipping `overflow-x`: an avatar in a horizontal story strip
 * sticks past the viewport by design and is not a bug, and without this filter
 * a clean page reports thirty-five offenders. The second drops any element that
 * has an offending descendant, so what prints is the innermost thing at fault
 * rather than the whole chain from <body> down to it.
 */

import { chromium, launchOpts } from "./playwright-env.mjs";

const argv = process.argv.slice(2);
const wIx = argv.indexOf("--width");
const WIDTH = wIx === -1 ? 390 : Number(argv[wIx + 1]);
/* Skip the flag and the value that follows it. The `wIx !== -1` guard matters:
   without it, a missing --width leaves wIx at -1, wIx + 1 is 0, and the filter
   silently eats the first route you asked for. */
const ROUTES = argv.filter((a, i) => !a.startsWith("--") && !(wIx !== -1 && i === wIx + 1));
if (!ROUTES.length) {
  console.error("usage: node tools/diag-overflow.mjs [--width 390] /route [/route…]");
  process.exit(2);
}

const BASE = process.env.BASE || "http://localhost:3000";
const BAD = ROUTES;

const browser = await chromium.launch(launchOpts);
const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

await page.goto(BASE + "/login", { waitUntil: "networkidle" });
await page.click("button.btn-blue");
await page.waitForFunction(() => location.pathname === "/feed");

const go = async (p) => {
  await page.evaluate((path) => {
    const idx = (window.history.state && window.history.state.idx) || 0;
    window.history.pushState({ usr: null, key: String(idx + 1), idx: idx + 1 }, "", path);
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
    window.scrollTo(0, 0);
  }, p);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

for (const route of BAD) {
  await go(route);
  const res = await page.evaluate(() => {
    const W = window.innerWidth;
    const doc = document.scrollingElement.scrollWidth;

    /* An element only pushes the document wider if nothing between it and the
       root clips it. Anything inside an overflow-x:auto strip is allowed to
       stick out — that is what a horizontal scroller is for. */
    const clipped = (el) => {
      for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === "auto" || ox === "scroll" || ox === "hidden" || ox === "clip") return true;
      }
      return false;
    };

    const path = (el) => {
      const bits = [];
      for (let p = el; p && p !== document.body; p = p.parentElement) {
        const c = (p.className || "").toString().trim().split(/\s+/).filter(Boolean).slice(0, 3).join(".");
        bits.unshift(p.tagName.toLowerCase() + (c ? "." + c : ""));
      }
      return bits.slice(-5).join(" > ");
    };

    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.right <= W + 0.5) continue;
      if (clipped(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.position === "fixed") continue;
      out.push({
        path: path(el),
        w: +r.width.toFixed(1),
        left: +r.left.toFixed(1),
        right: +r.right.toFixed(1),
        text: (el.textContent || "").trim().slice(0, 34),
        minW: cs.minWidth, maxW: cs.maxWidth, width: cs.width,
        flex: cs.flexBasis + " / " + cs.flexShrink,
        grid: cs.gridTemplateColumns.slice(0, 44),
        disp: cs.display,
        pad: cs.paddingLeft + " " + cs.paddingRight,
        box: cs.boxSizing,
      });
    }
    /* Deepest first, then keep only the ones with no offending descendant. */
    const keep = out.filter((o, i) => !out.some((q, j) => j !== i && q.path.startsWith(o.path + " >")));
    return { doc, W, keep };
  });

  console.log(`\n### ${route} — scrollWidth ${res.doc} vs ${res.W} (over ${res.doc - res.W}) — ${res.keep.length} unclipped offender(s)`);
  for (const o of res.keep.slice(0, 10)) {
    console.log(`  ${o.path}`);
    console.log(`     w=${o.w} left=${o.left} right=${o.right} | disp=${o.disp} width=${o.width} minW=${o.minW} maxW=${o.maxW} basis/shrink=${o.flex} pad=${o.pad} box=${o.box}`);
    if (o.grid && o.grid !== "none") console.log(`     grid-cols: ${o.grid}`);
    if (o.text) console.log(`     "${o.text}"`);
  }
}

await browser.close();
