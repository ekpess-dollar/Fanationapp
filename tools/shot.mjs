/**
 * Screenshot a list of routes in both palettes at one or more viewports.
 *
 *   node tools/shot.mjs <origin> <themeKey> <outDir> <w>x<h>[,<w>x<h>...] <route>[,<route>...]
 *
 * Signed-out routes only — `authed` lives in memory, so anything behind the
 * shell needs the sign-in click that `smoke.mjs` does, not a `page.goto`.
 * The theme is written to localStorage before the first frame, which is the
 * same door the pre-paint script in index.html reads through.
 */
import { chromium } from "./playwright-env.mjs";
import { mkdirSync } from "node:fs";

const [origin, themeKey, outDir, sizes, routes] = process.argv.slice(2);
if (!routes) {
  console.error("usage: shot.mjs <origin> <themeKey> <outDir> <WxH,...> <route,...>");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
for (const size of sizes.split(",")) {
  const [w, h] = size.split("x").map(Number);
  for (const theme of ["dark", "light"]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await ctx.addInitScript(([k, t]) => localStorage.setItem(k, t), [themeKey, theme]);
    const page = await ctx.newPage();
    for (const route of routes.split(",")) {
      await page.goto(origin + route, { waitUntil: "networkidle" });
      await page.waitForTimeout(700);
      const name = (route === "/" ? "root" : route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, ""));
      const file = `${outDir}/${name}-${theme}-${w}x${h}.png`;
      await page.screenshot({ path: file });
      console.log(file);
    }
    await ctx.close();
  }
}
await browser.close();
