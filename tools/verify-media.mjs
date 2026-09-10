#!/usr/bin/env node
/**
 * Media integrity check — the three things `verify-responsive.mjs` cannot see.
 *
 *     cd client && npm run build && npm run preview   # terminal one
 *     cd admin  && npm run build && npm run preview   # terminal two
 *     node tools/verify-media.mjs                     # terminal three
 *
 * `verify-responsive.mjs` walks the client and reads `document.images`. Three
 * blind spots follow from that, and this script is all three:
 *
 *   1. The admin console's imagery is checked by nothing. Different app, its own
 *      routes, its own subset of the manifest.
 *   2. A `<video poster>` that fails leaves no trace in `document.images`. The
 *      posters behind the reels and the video posts were "checked by eye" until
 *      this existed.
 *   3. The DOM only ever shows the assets a visited route happened to paint. A
 *      path that is only used on a route nobody opened is still a broken path.
 *      `lib/brand/media.ts` is the one place the full set is written down, so
 *      the manifest is resolved against the built output of both apps directly.
 *
 * On the manifest pass, "resolves in the other app" is a pass, not a failure.
 * `lib/brand` is a byte-identical copy in both projects and lists every asset,
 * but each app ships only the subset it paints — the moderation exhibits under
 * `/img/e/` are admin-only and are correctly absent from `client/public`. The
 * failure condition is a path that resolves in neither.
 *
 * Why a fresh `new Image()` rather than a `fetch` for the posters: `vite preview`
 * answers an unknown path with `index.html` and a 200, and so does production —
 * the SPA rewrite is a catch-all. The network says nothing useful. Asking the
 * decoder whether the bytes are a picture is the only honest question.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, launchOpts } from "./playwright-env.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLIENT = process.env.BASE_CLIENT || "http://localhost:3000";
const ADMIN = process.env.BASE_ADMIN || "http://localhost:3001";

/* Every admin route that renders imagery, and the client routes that carry a
   <video poster>. Not the full route lists — the ones with nothing to check are
   already covered by verify-responsive.mjs and smoke.mjs. */
const ADMIN_ROUTES = ["/overview", "/users", "/creators", "/kyc", "/moderation",
  "/finance", "/payouts", "/reports", "/audit"];
const POSTER_ROUTES = ["/feed", "/reels", "/live", "/explore", "/creator/sofia",
  "/studio/content", "/studio/live"];

let failures = 0;
const errs = [];

/* ── 1. manifest → built output ──────────────────────────────────────────────
   Static, no browser. Runs first because it is the cheapest and the broadest:
   if an asset never made it into either build, nothing below will tell you. */

console.log("— MANIFEST —");
const manifest = [...new Set(
  (readFileSync(join(ROOT, "client/src/lib/brand/media.ts"), "utf8")
    .match(/"\/[^"]+"/g) || []).map((s) => s.slice(1, -1))
)].sort();

const inClient = [], inAdmin = [], inNeither = [];
for (const p of manifest) {
  const c = existsSync(join(ROOT, "client/dist", p));
  const a = existsSync(join(ROOT, "admin/dist", p));
  if (c) inClient.push(p);
  if (a) inAdmin.push(p);
  if (!c && !a) inNeither.push(p);
}
console.log(`  ${manifest.length} path(s) declared in lib/brand/media.ts`);
console.log(`  client/dist resolves ${inClient.length}, admin/dist resolves ${inAdmin.length}`);
if (inNeither.length) {
  failures += inNeither.length;
  console.log(`  ✗ ${inNeither.length} resolve in neither build:`);
  inNeither.slice(0, 12).forEach((p) => console.log(`      ${p}`));
  if (inNeither.length > 12) console.log(`      …and ${inNeither.length - 12} more`);
} else {
  console.log("  ✓ every declared path resolves in at least one build");
}

const browser = await chromium.launch(launchOpts);

const settle = async (p) => {
  await p.waitForLoadState("networkidle");
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

/* Same reason as verify-responsive.mjs: auth is in memory with no persist
   middleware, so a full load bounces to /login. Sign in once, then move through
   the History API the way the router does. */
const go = async (p, path) => {
  await p.evaluate((x) => {
    const idx = (history.state && history.state.idx) || 0;
    history.pushState({ usr: null, key: String(idx + 1), idx: idx + 1 }, "", x);
    dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
    scrollTo(0, 0);
  }, path);
  await p.waitForFunction((x) => location.pathname === x, path, { timeout: 5000 }).catch(() => {});
  await settle(p);
};

/* ── 2. admin console images ─────────────────────────────────────────────── */

console.log("\n— ADMIN images —");
const a = await browser.newPage({ viewport: { width: 1440, height: 900 } });
a.on("pageerror", (e) => errs.push("admin: " + e.message));
a.on("console", (m) => { if (m.type() === "error") errs.push("admin console: " + m.text()); });

await a.goto(ADMIN + "/login", { waitUntil: "networkidle" });
await a.click("button:has-text('Sign in')");
await a.waitForURL("**/overview", { timeout: 8000 });
await settle(a);

const brokenImgs = new Set();
let imgTotal = 0;
for (const r of ADMIN_ROUTES) {
  await go(a, r);
  const m = await a.evaluate(() => ({
    total: document.images.length,
    /* `complete` is true for a finished load and a finished failure alike;
       `naturalWidth === 0` on a complete image is the browser saying it has the
       bytes and cannot decode them. */
    broken: [...document.images]
      .filter((i) => i.complete && i.naturalWidth === 0)
      .map((i) => new URL(i.currentSrc || i.src, location.href).pathname),
  }));
  imgTotal += m.total;
  m.broken.forEach((p) => brokenImgs.add(p));
  console.log(`  ${m.broken.length ? "✗" : "✓"} ${r.padEnd(14)} ${m.total} image(s), ${m.broken.length} broken`);
}

/* ── 3. client video posters ─────────────────────────────────────────────── */

console.log("\n— CLIENT <video poster> —");
const c = await browser.newPage({ viewport: { width: 1440, height: 900 } });
c.on("pageerror", (e) => errs.push("client: " + e.message));

await c.goto(CLIENT + "/login", { waitUntil: "networkidle" });
await c.click("button.btn-blue");
await c.waitForURL("**/feed", { timeout: 8000 });
await settle(c);

const brokenPosters = new Set();
let posterTotal = 0;
for (const r of POSTER_ROUTES) {
  await go(c, r);
  const m = await c.evaluate(async () => {
    const srcs = [...new Set([...document.querySelectorAll("video[poster]")]
      .map((v) => new URL(v.poster, location.href).pathname))];
    const bad = [];
    await Promise.all(srcs.map((s) => new Promise((res) => {
      const im = new Image();
      im.onload = () => { if (im.naturalWidth === 0) bad.push(s); res(); };
      im.onerror = () => { bad.push(s); res(); };
      im.src = s;
    })));
    return { total: srcs.length, bad };
  });
  posterTotal += m.total;
  m.bad.forEach((p) => brokenPosters.add(p));
  console.log(`  ${m.bad.length ? "✗" : "✓"} ${r.padEnd(18)} ${m.total} poster(s), ${m.bad.length} undecodable`);
}

await browser.close();

/* Distinct files, not occurrences — the same avatar on nine routes is one file. */
failures += brokenImgs.size + brokenPosters.size + errs.length;

console.log(`\nmanifest paths declared:  ${manifest.length}, unresolved: ${inNeither.length}`);
console.log(`admin images checked:     ${imgTotal}, distinct broken: ${brokenImgs.size}`);
[...brokenImgs].sort().forEach((p) => console.log("    " + p));
console.log(`client posters checked:   ${posterTotal}, distinct undecodable: ${brokenPosters.size}`);
[...brokenPosters].sort().forEach((p) => console.log("    " + p));
console.log(`page/console errors:      ${errs.length}`);
errs.slice(0, 8).forEach((e) => console.log("    " + e));

console.log(`\n${failures === 0 ? "PASS" : `FAIL — ${failures} problem(s)`}`);
process.exit(failures === 0 ? 0 : 1);
