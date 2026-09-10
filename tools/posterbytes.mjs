/**
 * Which poster the browser actually fetched, and how big it was.
 *
 *   node tools/posterbytes.mjs [origin] [route,...] [WxH] [dpr]
 *
 * `<video poster>` has no srcset, so nothing in the markup says which file it
 * should be — `rungFor` decides at runtime off a measured box, and the only
 * honest way to check a runtime decision is to watch the wire. This signs in,
 * walks the routes that render a Loop, and prints every /img/ request with the
 * element that asked for it, so a poster that quietly went back to the full-size
 * original is visible rather than averaged away.
 *
 * Signs in through the form because `authed` lives in memory: a cold hit on any
 * client route lands on /login regardless of what was typed in the address bar.
 */
import { chromium } from "./playwright-env.mjs";

const ORIGIN = process.argv[2] || "http://localhost:4200";
const ROUTES = (process.argv[3] || "/feed,/reels,/live").split(",");
const [W, H] = (process.argv[4] || "1440x900").split("x").map(Number);
const DPR = Number(process.argv[5] || 1);

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: DPR,
});
const page = await ctx.newPage();

/** path -> bytes, so a file fetched by two elements is paid for once. */
const seen = new Map();
page.on("response", async (r) => {
  const u = new URL(r.url());
  if (!/^\/img\//.test(u.pathname)) return;
  if (seen.has(u.pathname)) return;
  let n = Number(r.headers()["content-length"] || 0);
  if (!n) {
    try {
      n = (await r.body()).length;
    } catch {
      n = 0;
    }
  }
  seen.set(u.pathname, n);
});

await page.goto(`${ORIGIN}/login`, { waitUntil: "networkidle" });
await page.click("button.btn-blue");
await page.waitForTimeout(600);

for (const route of ROUTES) {
  seen.clear();
  await page.evaluate((r) => {
    history.pushState({}, "", r);
    dispatchEvent(new PopStateEvent("popstate"));
  }, route);
  await page.waitForTimeout(900);

  /* Scroll the whole page so anything held back by useNear is armed. */
  await page.evaluate(async () => {
    const step = innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(900);

  /* What each <video> ended up with, and what each <img> ended up with. */
  const els = await page.evaluate(() =>
    [...document.querySelectorAll("video[poster]")].map((v) => ({
      poster: new URL(v.poster, location.href).pathname,
      box: Math.round(v.getBoundingClientRect().width),
    })),
  );

  const total = [...seen.values()].reduce((a, b) => a + b, 0);
  console.log(`\n== ${route} ==  ${kb(total)} in ${seen.size} image request(s)`);
  if (!els.length) console.log("  (no <video poster> on this route)");
  for (const e of els) {
    const rung = /\.(\d+)\.webp$/.exec(e.poster);
    console.log(
      `  poster  ${e.poster.padEnd(34)} box ${String(e.box).padStart(4)}px  ` +
        `${rung ? `rung ${rung[1]}` : "ORIGINAL"}  ${kb(seen.get(e.poster) || 0)}`,
    );
  }
}

await browser.close();
