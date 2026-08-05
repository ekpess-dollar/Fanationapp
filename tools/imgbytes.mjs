/**
 * What the landing page actually downloads in pictures, per viewport.
 *
 *   node tools/imgbytes.mjs <origin> [WxH,...]
 *
 * The point is not the total — `perfaudit.mjs` already reports that. The point
 * is *which* rung the browser picked, because a `sizes` that over-declares by a
 * breakpoint is invisible in a total and obvious in this list. Anything served
 * as text/html is a rung that does not exist: the preview server and Vercel both
 * SPA-fall-back rather than 404, so a missing candidate arrives as a 200 full of
 * markup and the <img> paints nothing.
 */
import { chromium } from "./playwright-env.mjs";

const origin = process.argv[2] || "http://localhost:4202";
const sizes = (process.argv[3] || "1440x900,390x844").split(",");

const browser = await chromium.launch();
for (const s of sizes) {
  const [w, h] = s.split("x").map(Number);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const hits = [];
  page.on("response", async (r) => {
    const u = new URL(r.url()).pathname;
    if (!/\.(webp|jpg|png|avif)$/.test(u)) return;
    const ct = r.headers()["content-type"] || "";
    let len = 0;
    try { len = (await r.body()).length; } catch { /* redirect or aborted */ }
    hits.push({ u, ct, len, ok: r.status() === 200 && ct.startsWith("image/") });
  });
  await page.goto(origin, { waitUntil: "load" });
  /* Scroll the whole page so every lazy picture is asked for. */
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
  });
  await page.waitForTimeout(1200);

  /* Any <img> that ended up with no pixels is a broken candidate. */
  const broken = await page.evaluate(() =>
    [...document.images]
      .filter((i) => !i.complete || i.naturalWidth === 0)
      .map((i) => i.currentSrc || i.src),
  );

  const total = hits.reduce((a, b) => a + b.len, 0);
  const bad = hits.filter((x) => !x.ok);
  console.log(`\n== ${s} ==`);
  for (const x of hits.sort((a, b) => b.len - a.len))
    console.log(`   ${(x.len / 1024).toFixed(1).padStart(7)} KB  ${x.ok ? " " : "✗"} ${x.u}`);
  console.log(`   ${"-".repeat(50)}`);
  console.log(`   ${(total / 1024).toFixed(1).padStart(7)} KB  in ${hits.length} request(s)`);
  if (bad.length) console.log(`   ✗ ${bad.length} served as ${[...new Set(bad.map((b) => b.ct))].join(", ")}`);
  if (broken.length) console.log(`   ✗ ${broken.length} <img> painted nothing: ${broken.join(", ")}`);
  if (!bad.length && !broken.length) console.log(`   ok  every candidate resolved to an image`);
  await ctx.close();
}
await browser.close();
