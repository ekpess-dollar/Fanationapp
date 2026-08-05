/**
 * How wide is each photograph actually painted?
 *
 *   node tools/boxes.mjs            # client, 1440 and 390
 *   BOX_W=1280 node tools/boxes.mjs # one width instead of the pair
 *
 * `srcset` without `sizes` is a loaded gun. The browser has to choose a
 * candidate before layout exists, so absent a `sizes` hint it assumes the image
 * fills the viewport and reaches for the largest rung on the ladder — which on
 * a 216px sidebar thumbnail is worse than shipping no ladder at all. So `sizes`
 * has to be written per call site, and writing it from reading CSS is guessing.
 * This measures it.
 *
 * The grouping key is deliberately not the file. The same photograph is painted
 * at six different sizes across the app and the question is not "how big is
 * music-1" but "how big is the box that this component puts a photograph in".
 * So each row is keyed by the route, the asset directory (which is also the
 * intrinsic shape — everything in `m/` is 1100x734) and the ancestor class
 * chain, which is the closest thing the DOM has to a call-site identity without
 * annotating the source.
 *
 * Both viewports are walked because `sizes` is a media query and one number
 * cannot express it. A tile that is a third of a 1440px page is usually the
 * whole width of a 390px one, and that flip is the entire reason the attribute
 * takes a query list rather than a length.
 */

import { chromium } from "./playwright-env.mjs";

const BASE = process.env.BASE || "http://localhost:4200";
const WIDTHS = process.env.BOX_W ? [+process.env.BOX_W] : [1440, 390];

const ROUTES = [
  "/login", "/signup", "/feed", "/explore", "/reels", "/live", "/messages",
  "/notifications", "/collections", "/subscriptions", "/wallet", "/settings",
  "/creator/sofia", "/studio", "/studio/content", "/studio/vault",
  "/studio/live", "/studio/earnings",
];

/* Signed-out routes are reachable cold. Everything else needs the button on
   /login pressed, because `authed` is an in-memory zustand field with no
   persisted key — a page.goto would land back on /login and measure that. */
const PUBLIC = new Set(["/login", "/signup"]);

const probe = () =>
  [...document.images]
    .filter((i) => i.naturalWidth > 0 && i.clientWidth > 0)
    .map((i) => {
      const path = new URL(i.currentSrc || i.src, location.href).pathname;
      const dir = (path.match(/\/img\/([a-z]+)\//) || [, path.split("/")[1] || "?"])[1];
      const chain = [];
      for (let el = i.parentElement, n = 0; el && n < 4; el = el.parentElement, n++) {
        const cls = (el.className || "").toString().trim().split(/\s+/).filter(Boolean).slice(0, 3);
        chain.push(cls.length ? "." + cls.join(".") : el.tagName.toLowerCase());
      }
      return { dir, box: Math.round(i.clientWidth), chain: chain.join(" < "), nat: i.naturalWidth };
    });

const rows = new Map();
const add = (w, route, r) => {
  const key = `${w}|${route}|${r.dir}|${r.chain}`;
  const cur = rows.get(key) || { w, route, dir: r.dir, chain: r.chain, nat: r.nat, n: 0, min: 1e9, max: 0 };
  cur.n++;
  cur.min = Math.min(cur.min, r.box);
  cur.max = Math.max(cur.max, r.box);
  rows.set(key, cur);
};

const browser = await chromium.launch();
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  for (const r of await page.evaluate(probe)) add(w, "/login", r);

  await page.click("button.btn-blue");
  await page.waitForTimeout(400);

  for (const route of ROUTES) {
    if (route === "/login") continue;
    if (PUBLIC.has(route)) {
      /* A signed-out route cannot be reached by pushState from inside the app —
         the router would keep the session. Take it on its own context. */
      const c2 = await browser.newContext({ viewport: { width: w, height: 900 } });
      const p2 = await c2.newPage();
      await p2.goto(BASE + route, { waitUntil: "networkidle" });
      for (const r of await p2.evaluate(probe)) add(w, route, r);
      await c2.close();
      continue;
    }
    await page.evaluate((r) => {
      history.pushState({}, "", r);
      dispatchEvent(new PopStateEvent("popstate"));
    }, route);
    await page.waitForTimeout(500);
    /* Scroll the whole page so lazy images below the fold actually decode —
       an unpainted image has a clientWidth of 0 and would drop out of the set,
       which would silently exclude exactly the tiles a ladder is for. */
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += innerHeight) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      scrollTo(0, 0);
    });
    await page.waitForTimeout(400);
    for (const r of await page.evaluate(probe)) add(w, route, r);
  }
  await ctx.close();
}
await browser.close();

const all = [...rows.values()].sort(
  (a, b) => a.w - b.w || a.dir.localeCompare(b.dir) || b.max - a.max,
);
let lastW = null;
let lastDir = null;
for (const r of all) {
  if (r.w !== lastW) {
    console.log(`\n══ viewport ${r.w}px ${"═".repeat(60)}`);
    lastW = r.w;
    lastDir = null;
  }
  if (r.dir !== lastDir) {
    console.log(`\n  ${r.dir}/   intrinsic ${r.nat}px`);
    lastDir = r.dir;
  }
  const box = r.min === r.max ? `${r.max}` : `${r.min}-${r.max}`;
  console.log(`    ${String(box).padStart(9)}px  n=${String(r.n).padStart(3)}  ${r.route.padEnd(17)} ${r.chain}`);
}
console.log("");
