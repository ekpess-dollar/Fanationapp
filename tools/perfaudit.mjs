#!/usr/bin/env node
/**
 * What the product actually costs to load, measured rather than reasoned about.
 *
 *     node tools/perfaudit.mjs                 # all three apps
 *     node tools/perfaudit.mjs client          # one app
 *
 * Reads BASE_CLIENT / BASE_ADMIN / BASE_LANDING from env, the same convention
 * as verify-theme.mjs and verify-media.mjs. Defaults 3000/3001/3002.
 *
 * Four things, because four different mistakes hide in four different places
 * and a single "page weight" number hides all of them at once:
 *
 *   1. COLD ENTRY — everything the browser pulls for the first screen a visitor
 *      ever sees, split by kind. This is the only number a first-time visitor
 *      experiences, and for the client it is /login, not /feed: the app has no
 *      persisted auth, so a cold hit on any route lands on the sign-in screen.
 *
 *   2. NAVIGATION DELTA — bytes pulled by one client-side route change, with
 *      the cold entry already paid for. A SPA that ships one bundle has a small
 *      delta and a huge entry; one that splits has the opposite. Neither shape
 *      is wrong on its own — what is wrong is a route pulling a megabyte of
 *      photographs nobody scrolled to.
 *
 *   3. OVERSIZE — intrinsic pixels against the box the image is painted into,
 *      at this device pixel ratio. A 1100px-wide file in a 233px-wide slot is
 *      not a small mistake: bytes scale with area, so 4.7x linear is 22x the
 *      pixels decoded and roughly that much of the file wasted.
 *
 *   4. EAGER MEDIA — <img loading="lazy"> is honoured by the browser and needs
 *      no help. <video poster> has no such attribute: the poster is fetched as
 *      soon as the element is parsed, wherever it sits on the page. So the
 *      posters are counted separately, with the distance from each one to the
 *      fold, because that distance is the whole argument for deferring them.
 *
 * Layout shift is recorded alongside, since a font or an image arriving late is
 * both a byte problem and a stability problem and it is cheaper to observe both
 * in one pass. Only shifts without recent input count, per the CLS definition.
 *
 * Transferred size, not decoded size: `encodedBodySize` plus headers is what
 * crosses the wire. A preview server serves uncompressed, so these figures are
 * larger than production behind gzip for text and identical for media, which
 * already carries its own compression. The image and video numbers are the ones
 * to act on; treat the JS and CSS figures as upper bounds.
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, launchOpts } from "./playwright-env.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KB = (n) => (n / 1024).toFixed(1) + " KB";

const APPS = {
  client: {
    base: process.env.BASE_CLIENT || "http://localhost:3000",
    entry: "/login",
    signin: "button.btn-blue",
    landsOn: "/feed",
    routes: ["/feed", "/explore", "/reels", "/live", "/messages", "/notifications",
      "/collections", "/subscriptions", "/wallet", "/settings", "/creator/sofia",
      "/studio", "/studio/content", "/studio/vault", "/studio/earnings"],
  },
  admin: {
    base: process.env.BASE_ADMIN || "http://localhost:3001",
    entry: "/login",
    signin: "button:has-text('Sign in')",
    landsOn: "/overview",
    routes: ["/overview", "/users", "/creators", "/kyc", "/moderation", "/finance",
      "/payouts", "/reports", "/audit"],
  },
  landing: {
    base: process.env.BASE_LANDING || "http://localhost:3002",
    entry: "/",
    signin: null,
    landsOn: null,
    routes: [],
  },
};

const only = process.argv[2];
const picked = only ? { [only]: APPS[only] } : APPS;
if (only && !APPS[only]) {
  console.error(`unknown app "${only}" — expected client, admin or landing`);
  process.exit(2);
}

/* Classify by what the byte is, not by where it came from. A .webp served from
   /assets and one served from /img cost the same and are fixed the same way. */
const kindOf = (url, type) => {
  const p = new URL(url).pathname.toLowerCase();
  if (/\.(webp|jpe?g|png|gif|avif|svg|ico)$/.test(p)) return "image";
  if (/\.(mp4|webm|mov)$/.test(p)) return "video";
  if (/\.(woff2?|ttf|otf|eot)$/.test(p)) return "font";
  if (/\.css$/.test(p)) return "css";
  if (/\.m?jsx?$/.test(p) || /\.tsx?$/.test(p)) return "js";
  if (type === "document" || /\.html?$/.test(p) || p === "/") return "html";
  return "other";
};

/* One recorder per page. Playwright's response event fires before the body has
   necessarily arrived, so size is read from the performance timeline instead —
   `transferSize` is what the browser itself counted, including headers, and it
   is zero for a memory-cache hit, which is exactly the semantics wanted here. */
const record = async (page) => page.evaluate(() =>
  performance.getEntriesByType("resource").map((e) => ({
    url: e.name,
    type: e.initiatorType,
    size: e.transferSize || e.encodedBodySize || 0,
    dur: Math.round(e.duration),
  })));

const settle = async (p) => {
  await p.waitForLoadState("networkidle").catch(() => {});
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

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

/* CLS has to be installed before the document runs, and it has to survive the
   navigation, so it goes in via addInitScript rather than evaluate. */
const CLS_HOOK = `
  window.__cls = 0; window.__shifts = [];
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__cls += e.value;
        if (e.value > 0.001) window.__shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime) });
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch {}
`;

const browser = await chromium.launch(launchOpts);
const summary = [];

for (const [name, app] of Object.entries(picked)) {
  console.log(`\n${"═".repeat(74)}\n  ${name.toUpperCase()}   ${app.base}\n${"═".repeat(74)}`);

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(CLS_HOOK);
  const page = await ctx.newPage();

  /* ── 1. cold entry ─────────────────────────────────────────────────────── */

  await page.goto(app.base + app.entry, { waitUntil: "load" });
  await settle(page);
  /* Give a late font swap or a deferred image somewhere to land before the
     shift score is read. networkidle already waited; this is for the paint. */
  await page.waitForTimeout(900);

  const cold = await record(page);
  const byKind = {};
  for (const r of cold) {
    const k = kindOf(r.url, r.type);
    (byKind[k] ||= { n: 0, b: 0 }).n++;
    byKind[k].b += r.size;
  }
  const coldTotal = cold.reduce((s, r) => s + r.size, 0);
  const { cls, shifts, nav } = await page.evaluate(() => {
    const n = performance.getEntriesByType("navigation")[0] || {};
    return {
      cls: +(window.__cls || 0).toFixed(4),
      shifts: (window.__shifts || []).slice(0, 5),
      nav: { dcl: Math.round(n.domContentLoadedEventEnd || 0), load: Math.round(n.loadEventEnd || 0) },
    };
  });

  console.log(`\n  COLD ENTRY  ${app.entry}`);
  console.log(`    ${cold.length} request(s), ${KB(coldTotal)} transferred`);
  for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1].b - a[1].b)) {
    const pct = coldTotal ? ((v.b / coldTotal) * 100).toFixed(0) : "0";
    console.log(`      ${k.padEnd(7)} ${String(v.n).padStart(3)} file(s)  ${KB(v.b).padStart(10)}  ${pct.padStart(3)}%`);
  }
  console.log(`    DOMContentLoaded ${nav.dcl}ms · load ${nav.load}ms`);
  console.log(`    ${cls > 0.1 ? "✗" : "✓"} CLS ${cls}${cls > 0.1 ? "   FAILS the 0.1 threshold" : ""}`);
  if (shifts.length) console.log(`      shifts: ${shifts.map((s) => `${s.v}@${s.t}ms`).join(", ")}`);

  const top = cold.filter((r) => r.size > 20_000).sort((a, b) => b.size - a.size).slice(0, 8);
  if (top.length) {
    console.log(`    heaviest:`);
    top.forEach((r) => console.log(`      ${KB(r.size).padStart(10)}  ${new URL(r.url).pathname}`));
  }

  /* ── 2. oversize + eager media, on the entry screen ────────────────────── */

  const shot = async (p) => p.evaluate(() => {
    const dpr = devicePixelRatio;
    const imgs = [...document.images]
      .filter((i) => i.naturalWidth > 0 && i.clientWidth > 0)
      .map((i) => {
        const need = i.clientWidth * dpr;
        return {
          src: new URL(i.currentSrc || i.src, location.href).pathname,
          nat: i.naturalWidth, box: Math.round(i.clientWidth),
          ratio: +(i.naturalWidth / need).toFixed(2),
          srcset: !!i.srcset, lazy: i.loading === "lazy",
        };
      });
    const fold = innerHeight;
    const posters = [...document.querySelectorAll("video[poster]")].map((v) => {
      const r = v.getBoundingClientRect();
      return {
        src: new URL(v.poster, location.href).pathname,
        /* Distance from the bottom of the viewport to the top of the element.
           Negative means it is already on screen. */
        below: Math.round(r.top - fold),
      };
    });
    return { dpr, imgs, posters };
  });

  const ent = await shot(page);
  const over = ent.imgs.filter((i) => i.ratio > 1.15);
  console.log(`\n  IMAGES on ${app.entry}   (dpr ${ent.dpr})`);
  console.log(`    ${ent.imgs.length} painted · ${ent.imgs.filter((i) => i.srcset).length} carry srcset · ${ent.imgs.filter((i) => i.lazy).length} lazy`);
  if (over.length) {
    const worst = over.sort((a, b) => b.ratio - a.ratio);
    const avg = (over.reduce((s, i) => s + i.ratio, 0) / over.length).toFixed(2);
    console.log(`    ✗ ${over.length} oversized (>1.15x), mean ${avg}x linear · ${(avg * avg).toFixed(1)}x the pixels`);
    worst.slice(0, 6).forEach((i) => console.log(`        ${String(i.ratio).padStart(5)}x  ${String(i.nat).padStart(4)}px into ${String(i.box).padStart(4)}px   ${i.src}`));
  } else {
    console.log(`    ✓ nothing oversized beyond 1.15x`);
  }

  /* ── 3. navigation deltas ──────────────────────────────────────────────── */

  if (app.signin) {
    await page.click(app.signin);
    await page.waitForURL(`**${app.landsOn}`, { timeout: 8000 }).catch(() => {});
    await settle(page);

    console.log(`\n  NAVIGATION DELTAS  (signed in, cold entry already paid)`);
    let seen = (await record(page)).length;
    const deltas = [];
    for (const r of app.routes) {
      await go(page, r);
      const all = await record(page);
      const fresh = all.slice(seen);
      seen = all.length;
      const b = fresh.reduce((s, x) => s + x.size, 0);
      const k = {};
      for (const x of fresh) { const t = kindOf(x.url, x.type); (k[t] ||= 0); k[t] += x.size; }
      deltas.push({ r, n: fresh.length, b, k });
    }
    deltas.sort((a, b) => b.b - a.b);
    for (const d of deltas) {
      const mix = Object.entries(d.k).sort((a, b) => b[1] - a[1])
        .filter(([, v]) => v > 1024).map(([t, v]) => `${t} ${KB(v)}`).join(" · ");
      const flag = d.b > 500_000 ? "✗" : d.b > 200_000 ? "!" : " ";
      console.log(`    ${flag} ${d.r.padEnd(20)} ${KB(d.b).padStart(10)}  ${String(d.n).padStart(3)} req   ${mix}`);
    }
    const worstRoute = deltas[0];

    /* Posters are counted on the route that has the most of them, which is the
       feed — that is where the finding lives and where a fix has to show up. */
    await go(page, "/feed");
    const feed = await shot(page);
    const near = feed.posters.filter((p) => p.below < 0);
    console.log(`\n  EAGER MEDIA on /feed`);
    console.log(`    ${feed.posters.length} <video poster> in the DOM · ${near.length} within the fold`);
    if (feed.posters.length) {
      const far = feed.posters.filter((p) => p.below >= 0).sort((a, b) => a.below - b.below);
      console.log(`    ${far.length} sit below the fold, nearest ${far[0]?.below ?? "—"}px down, furthest ${far.at(-1)?.below ?? "—"}px`);
      const set = new Set(feed.posters.map((p) => p.src));
      const all = await record(page);
      const posterBytes = all.filter((r) => set.has(new URL(r.url).pathname)).reduce((s, r) => s + r.size, 0);
      console.log(`    ${far.length && posterBytes ? "✗" : "✓"} ${KB(posterBytes)} of poster stills fetched, ${far.length} of ${feed.posters.length} for clips nobody has scrolled to`);
    }

    summary.push({ name, coldTotal, cls, worst: worstRoute });
  } else {
    summary.push({ name, coldTotal, cls, worst: null });
  }

  await ctx.close();
}

/* ── 4. what shipped ───────────────────────────────────────────────────────── */

console.log(`\n${"═".repeat(74)}\n  BUILD OUTPUT\n${"═".repeat(74)}`);
for (const name of Object.keys(picked)) {
  const dir = join(ROOT, name, "dist", "assets");
  if (!existsSync(dir)) { console.log(`  ${name}: no dist/assets — not built`); continue; }
  const files = readdirSync(dir).map((f) => ({ f, s: statSync(join(dir, f)).size }));
  const js = files.filter((x) => x.f.endsWith(".js")).sort((a, b) => b.s - a.s);
  const css = files.filter((x) => x.f.endsWith(".css")).sort((a, b) => b.s - a.s);
  const sum = (a) => a.reduce((s, x) => s + x.s, 0);
  console.log(`\n  ${name}`);
  console.log(`    ${js.length} js chunk(s)  ${KB(sum(js))}   ${js.length === 1 ? "✗ one chunk — no code splitting" : "✓ split"}`);
  js.slice(0, 6).forEach((x) => console.log(`        ${KB(x.s).padStart(10)}  ${x.f}`));
  console.log(`    ${css.length} css file(s) ${KB(sum(css))}`);
}

await browser.close();

console.log(`\n${"═".repeat(74)}`);
for (const s of summary) {
  const w = s.worst ? `worst route ${s.worst.r} at ${KB(s.worst.b)}` : "single page";
  console.log(`  ${s.name.padEnd(8)} cold ${KB(s.coldTotal).padStart(10)}   CLS ${String(s.cls).padEnd(7)} ${w}`);
}
console.log("");
