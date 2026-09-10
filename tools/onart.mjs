/**
 * Contrast for the text `lightaudit.mjs` cannot score.
 *
 *   node tools/onart.mjs <client|admin|landing> <origin> [--theme=dark,light]
 *
 * `lightaudit` resolves a backdrop by walking up the DOM adding up `background`
 * declarations. That works everywhere the backdrop is a colour and nowhere the
 * backdrop is a photograph, so it defers those elements and prints them as
 * "OVER ART — not scored". This scores them, by reading pixels instead of
 * declarations.
 *
 * ── How
 *
 * Per route, per scroll offset, three screenshots of the same frame:
 *
 *   1. every measured glyph painted `transparent`  — the backdrop, alone
 *   2. every measured glyph painted `#ff00ff`      — a magenta mask
 *   3. every measured glyph painted `#00ff00`      — a green mask
 *
 * A pixel that is pure magenta in (2) AND pure green in (3) is a pixel the
 * glyph covers completely: no antialiasing, no partial coverage, nothing else
 * on top. Shot (1) then says exactly what is behind it.
 *
 * The obvious instrument — diff the visible frame against the hidden one and
 * call the difference the glyph — is circular. Text the same colour as what is
 * behind it diffs to zero precisely in the case worth catching, and the tool
 * reports a pass. Two tints cannot be fooled that way: no backdrop is both pure
 * magenta and pure green.
 *
 * ── What gets measured
 *
 * `lightaudit`'s deferred set, reproduced by the same rules (an element that
 * paints its own opaque background is measurable wherever it sits; only a
 * translucent one inherits the picture), UNION the chip classes, which are
 * measured wherever they are because a chip's whole job is to sit on media.
 *
 * Geography comes from a Range over the element's own text nodes, never from
 * its bounding box. A box contains its children — measuring one on a photograph
 * finds the darkest pixel in the frame and calls it the backdrop, and a chip
 * with a coloured dot in it reports itself as its own backdrop at 1.00:1.
 *
 * ── Thresholds
 *
 * WCAG 1.4.3: 3:1 at >=24px, or >=18.66px when the weight is >=700; 4.5:1
 * otherwise. Tailwind's `text-lg` is 18px and does not reach the bold exception.
 *
 * `spread` is the range of luminance under one glyph, 0..1. Above ~0.15 the ink
 * is on unflattened photograph and the repair is a scrim, not a darker ink —
 * the worst pixel moves with the picture and no colour survives all of them.
 */
import { chromium, launchOpts } from "./playwright-env.mjs";

const [KIND, ORIGIN, ...rest] = process.argv.slice(2);
if (!ORIGIN) {
  console.error("usage: onart.mjs <client|admin|landing> <origin> [--theme=dark,light]");
  process.exit(1);
}
const THEMES = (rest.find((a) => a.startsWith("--theme="))?.slice(8) || "dark,light").split(",");

/* Routes behind the sign-in wall. `authed` is an in-memory zustand field with no
   persistence, so these are reached by pushState after one click on the primary
   button — a `page.goto` re-mounts the app signed out and lands on /login. */
const ROUTES = {
  client: ["/feed", "/explore", "/reels", "/live", "/messages", "/notifications", "/collections",
    "/subscriptions", "/wallet", "/creator/sofiaa", "/studio", "/studio/content", "/studio/fans",
    "/studio/live", "/studio/promos", "/studio/vault"],
  admin: ["/overview", "/users", "/creators", "/moderation", "/payouts", "/kyc", "/finance", "/reports"],
  landing: ["/"],
};
/* Routes that render outside the shell, measured before the click. Admin's `/`
   joined once its sign-in screen got a painted backdrop: the logo lockup above
   the card now sits on a gradient rather than a flat field, which makes it ink
   over art and puts it here rather than in lightaudit. */
const PRE = { client: ["/login", "/signup"], admin: ["/"], landing: [] };
const SIGNIN = { client: "button.btn-blue", admin: "button:has-text('Sign in')", landing: null };
const THEME_KEY = { client: "fanation.theme", admin: "fanation.admin.theme", landing: "fanation.landing.theme" };

const CHIP = '.tag, .pill, [class*="chip-"]';
const MAXSCROLL = 8;
const VIEW = { width: 1440, height: 900 };

/* ── in-page: mark what to measure, and record its geography ───────────────── */

const collect = (chipSel) => {
  const MEDIA = [...document.querySelectorAll("img,video")]
    .map((m) => m.getBoundingClientRect())
    .filter((r) => r.width >= 8 && r.height >= 8);
  const overMedia = (el) => {
    const r = el.getBoundingClientRect();
    return MEDIA.some((m) => r.left >= m.left - 1 && r.right <= m.right + 1
      && r.top >= m.top - 1 && r.bottom <= m.bottom + 1);
  };
  const opaque = (cs) => {
    const bg = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor);
    const a = bg ? (bg[1].split(",")[3] === undefined ? 1 : parseFloat(bg[1].split(",")[3])) : 0;
    return a >= 0.995 || (cs.backgroundImage !== "none" && !/gradient/.test(cs.backgroundImage));
  };
  /* A gradient lightaudit cannot resolve analytically. Its parser reads the
     stops out of a gradient and scores the worst one, and it gives up the moment
     any stop is translucent — because then the surface under a letter is the
     composite of that stop with whatever is beneath it, layer by layer, and
     there is no single colour to name. It reports those as OVER ART and does not
     score them.

     Nothing scored them. The rule was "photographs are pixels, gradients are
     arithmetic", and a stack of translucent radials is neither. This is the
     other half of that split: lightaudit measures what it can compute, and
     anything it hands over arrives here to be measured the honest way, by
     reading the pixels that actually got painted. */
  const softGradient = (cs) => {
    const bg = cs.backgroundImage;
    if (!bg || bg === "none" || !/gradient\(/i.test(bg)) return false;
    return (bg.match(/rgba\([^()]*\)/g) || [])
      .some((c) => parseFloat(c.split(",")[3]) < 0.999);
  };
  /* An ancestor chain that reaches a photograph — or one of those gradients —
     without an opaque surface in between. Same question as overMedia, asked for
     elements that sit beside the picture rather than inside its box. */
  const artBackdrop = (el) => {
    for (let p = el; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (softGradient(cs)) return true;
      if (p === el) continue;
      if (opaque(cs)) return false;
      if (overMedia(p)) return true;
      if (p.querySelector("img,video") && getComputedStyle(p).position !== "static") return true;
    }
    return false;
  };

  const out = [];
  let n = 0;
  for (const el of document.querySelectorAll("body *")) {
    const tag = el.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "SVG" || tag === "PATH") continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) < 0.05) continue;

    /* Own text only: a node whose text belongs to a child is that child's to
       measure, and scoring it here would sample the child's backdrop too. */
    const rects = [];
    for (const node of el.childNodes) {
      if (node.nodeType !== 3 || !node.textContent.trim()) continue;
      const rg = document.createRange();
      rg.selectNodeContents(node);
      for (const rr of rg.getClientRects()) {
        if (rr.width < 2 || rr.height < 2) continue;
        if (rr.bottom < 0 || rr.top > innerHeight || rr.right < 0 || rr.left > innerWidth) continue;
        rects.push({ x: rr.left, y: rr.top, w: rr.width, h: rr.height });
      }
    }
    if (!rects.length) continue;

    /* `background-clip:text` makes the gradient the ink, not the backdrop —
       there is no flat colour to score and lightaudit already reports these. */
    if (/text/.test(cs.webkitBackgroundClip || cs.backgroundClip || "")) {
      out.push({ skip: "gradient ink", sel: sig(el) });
      continue;
    }

    const isArt = !opaque(cs) && (overMedia(el) || artBackdrop(el));
    const isChip = el.matches(chipSel);
    if (!isArt && !isChip) continue;

    const col = /rgba?\(([^)]+)\)/.exec(cs.color);
    const cp = col ? col[1].split(",").map((x) => parseFloat(x)) : [0, 0, 0, 1];
    el.setAttribute("data-oa", String(n));
    out.push({
      i: n++, sel: sig(el), rects,
      ink: [cp[0], cp[1], cp[2]],
      alpha: cp[3] === undefined ? 1 : cp[3],
      size: parseFloat(cs.fontSize),
      weight: parseInt(cs.fontWeight, 10) || 400,
      shadow: cs.textShadow && cs.textShadow !== "none",
      art: isArt, chip: isChip,
      text: (el.textContent || "").trim().slice(0, 46),
    });
  }
  return out;

  function sig(el) {
    const c = (el.getAttribute("class") || "").trim().replace(/\s+/g, " ").slice(0, 52);
    return el.tagName + "." + c;
  }
};

/* ── run ───────────────────────────────────────────────────────────────────── */

const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const hex = ([r, g, b]) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

const browser = await chromium.launch(launchOpts);
const worst = new Map();
const skipped = new Map();
let measured = 0, overArt = 0, noPixel = 0;

for (const theme of THEMES) {
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1 });
  await ctx.addInitScript(([k, t]) => localStorage.setItem(k, t), [THEME_KEY[KIND], theme]);
  const page = await ctx.newPage();
  await page.goto(ORIGIN + (PRE[KIND][0] || "/"), { waitUntil: "networkidle" });

  const routes = [...PRE[KIND].map((r) => [r, "pre"]), ...ROUTES[KIND].map((r) => [r, "in"])];
  let signedIn = false;
  for (const [route, phase] of routes) {
    if (phase === "pre") {
      await page.goto(ORIGIN + route, { waitUntil: "networkidle" });
    } else {
      if (!signedIn && SIGNIN[KIND]) { await page.click(SIGNIN[KIND]); signedIn = true; await page.waitForTimeout(400); }
      await page.evaluate((r) => { history.pushState({}, "", r); dispatchEvent(new PopStateEvent("popstate")); }, route);
    }
    await page.waitForTimeout(650);

    const maxY = await page.evaluate(() => Math.max(0, document.body.scrollHeight - innerHeight));
    const steps = Math.min(MAXSCROLL, Math.floor(maxY / VIEW.height) + 1);
    for (let s = 0; s < steps; s++) {
      await page.evaluate((y) => scrollTo(0, y), s * VIEW.height);
      await page.waitForTimeout(320);

      const marks = await page.evaluate(collect, CHIP);
      for (const m of marks) if (m.skip) skipped.set(m.sel, (skipped.get(m.sel) || 0) + 1);
      const live = marks.filter((m) => !m.skip);
      if (!live.length) continue;

      const paint = async (css) => {
        await page.evaluate((c) => {
          let s = document.getElementById("oa-style");
          if (!s) { s = document.createElement("style"); s.id = "oa-style"; document.head.appendChild(s); }
          s.textContent = c;
        }, css);
        return page.screenshot({ type: "png" });
      };
      const F = "!important";
      const tint = (c) => `[data-oa]{color:${c}${F};-webkit-text-fill-color:${c}${F};text-shadow:none${F}}`;
      const hid = (await paint(tint("transparent"))).toString("base64");
      const mag = (await paint(tint("#ff00ff"))).toString("base64");
      const grn = (await paint(tint("#00ff00"))).toString("base64");
      await page.evaluate(() => {
        document.getElementById("oa-style")?.remove();
        for (const e of document.querySelectorAll("[data-oa]")) e.removeAttribute("data-oa");
      });

      const readings = await page.evaluate(async ([b64, marksIn]) => {
        const decode = async (s) => {
          const bin = atob(s); const u = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
          const bmp = await createImageBitmap(new Blob([u], { type: "image/png" }));
          const cv = new OffscreenCanvas(bmp.width, bmp.height);
          const cx = cv.getContext("2d", { willReadFrequently: true });
          cx.drawImage(bmp, 0, 0);
          return { d: cx.getImageData(0, 0, bmp.width, bmp.height).data, w: bmp.width };
        };
        const [H, M, G] = await Promise.all(b64.map(decode));
        const near = (d, i, r, g, b) => Math.abs(d[i] - r) <= 10 && Math.abs(d[i + 1] - g) <= 10
          && Math.abs(d[i + 2] - b) <= 10;
        const res = [];
        for (const m of marksIn) {
          const back = []; const seen = new Set();
          for (const r of m.rects) {
            const x0 = Math.max(0, Math.floor(r.x)), x1 = Math.min(M.w - 1, Math.ceil(r.x + r.w));
            const y0 = Math.max(0, Math.floor(r.y)), y1 = Math.ceil(r.y + r.h);
            for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
              const i = (y * M.w + x) * 4;
              if (i + 3 >= M.d.length) continue;
              if (!near(M.d, i, 255, 0, 255)) continue;
              if (!near(G.d, i, 0, 255, 0)) continue;
              back.push([H.d[i], H.d[i + 1], H.d[i + 2]]);
              seen.add((H.d[i] >> 3) + "," + (H.d[i + 1] >> 3) + "," + (H.d[i + 2] >> 3));
            }
          }
          res.push({ i: m.i, back, colours: seen.size });
        }
        return res;
      }, [[hid, mag, grn], live]);

      const byId = new Map(live.map((m) => [m.i, m]));
      for (const r of readings) {
        const m = byId.get(r.i);
        if (!m) continue;
        if (!r.back.length) { noPixel++; continue; }
        measured++;
        if (m.art) overArt++;

        let lo = Infinity, hi = -Infinity, worstPx = null, worstRatio = Infinity;
        for (const b of r.back) {
          const L = lum(b);
          if (L < lo) lo = L;
          if (L > hi) hi = L;
          const ink = m.alpha >= 1 ? m.ink
            : [0, 1, 2].map((k) => m.alpha * m.ink[k] + (1 - m.alpha) * b[k]);
          const cr = ratio(ink, b);
          if (cr < worstRatio) { worstRatio = cr; worstPx = { ink, back: b }; }
        }
        const bar = (m.size >= 24 || (m.size >= 18.66 && m.weight >= 700)) ? 3 : 4.5;
        const rec = {
          sel: m.sel, ratio: worstRatio, bar, theme, route, size: m.size, weight: m.weight,
          ink: worstPx.ink, back: worstPx.back, spread: hi - lo, colours: r.colours,
          shadow: m.shadow, alpha: m.alpha, art: m.art, chip: m.chip, text: m.text,
        };
        const prev = worst.get(m.sel);
        if (!prev) worst.set(m.sel, { n: 1, fail: worstRatio < bar ? 1 : 0, rec, all: [rec] });
        else {
          prev.n++;
          if (worstRatio < bar) prev.fail++;
          prev.all.push(rec);
          if (worstRatio < prev.rec.ratio) prev.rec = rec;
        }
      }
    }
  }
  await ctx.close();
}
await browser.close();

/* ── report ────────────────────────────────────────────────────────────────── */

const rows = [...worst.values()].sort((a, b) => a.rec.ratio - b.rec.ratio);
console.log(`\n  ${KIND} — ${THEMES.join("+")} · ${measured} measured · ${overArt} over art\n`);
if (noPixel) console.log(`  ${noPixel} elements yielded no full-coverage glyph pixel (too small / all antialias)`);
for (const [sel, n] of skipped) console.log(`  skipped x${n}  ${sel}  (gradient ink — lightaudit scores these)`);
if (noPixel || skipped.size) console.log("");

for (const r of rows) {
  const k = r.rec;
  const ok = k.ratio >= k.bar;
  const tags = [k.art && "art", k.chip && "chip", k.shadow && "text-shadow", k.alpha < 1 && "alpha ink"]
    .filter(Boolean).join(" ");
  /* The selector is on the record, not on the map key's scope — `rows` is
     `worst.values()`, so there is no loop variable holding it. */
  console.log(`  ${ok ? "OK" : "XX"} ${k.sel}   ${r.n} seen · ${r.fail} failing   ${tags}`);
  console.log(`     worst ${k.ratio.toFixed(2)}:1 / ${k.bar}  ${k.theme} ${k.route}  ${k.size}px/${k.weight}` +
    `  ink ${hex(k.ink)}${k.alpha < 1 ? "@" + k.alpha : ""} on ${hex(k.back)}` +
    `  ${k.colours} colours${k.spread > 0.15 ? `  spread ${k.spread.toFixed(3)} <- unscrimmed art` : ""}`);
  if (!ok) {
    const bad = r.all.filter((x) => x.ratio < x.bar).sort((a, b) => a.ratio - b.ratio).slice(0, 4);
    console.log("       " + bad.map((x) => `${x.ratio.toFixed(2)} ${x.theme}${x.route} «${x.text}»`).join(" · "));
  }
}
const total = rows.reduce((s, r) => s + r.fail, 0);
console.log(`\n${total ? "FAIL" : "PASS"} — ${total} of ${measured} below bar\n`);
process.exit(total ? 1 : 0);
