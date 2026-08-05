/* Light-mode contrast audit — measured, not argued.

   The token file says `--blue-ink` is 4.52 against `--card`. That is a hand
   calculation against an assumed surface. This walks every route in light,
   finds every element that actually renders text, resolves the real foreground
   and the real composited background behind it, and computes the ratio the
   browser would produce.

   Rules applied:
     1.4.3 Contrast (Minimum) — 4.5:1 for text, 3:1 for large text
                                (>=24px, or >=18.66px at weight >=700)
     1.4.11 Non-text Contrast — 3:1 for standalone icons, reported separately

   Text over a photograph is not measurable against a flat surface, so those
   elements are counted and listed under `art` rather than scored. That is the
   Bucket B set: it is supposed to be there. A gradient of opaque colour stops
   is not in it — see `stops` below.

   Usage: node tools/lightaudit.mjs <origin> <client|admin|landing> */
import { chromium, launchOpts } from "./playwright-env.mjs";

const [ORIGIN, KIND] = process.argv.slice(2);

const ROUTES = {
  client: ['/feed', '/explore', '/reels', '/live', '/messages', '/notifications', '/collections',
    '/subscriptions', '/wallet', '/settings', '/creator/sofiaa', '/studio', '/studio/analytics',
    '/studio/content', '/studio/earnings', '/studio/fans', '/studio/live', '/studio/messages',
    '/studio/payouts', '/studio/promos', '/studio/tiers', '/studio/vault', '/studio/verify'],
  admin: ['/overview', '/users', '/creators', '/moderation', '/payouts', '/kyc', '/finance',
    '/reports', '/audit'],
  /* The marketing site is one document with no router. `/` is all of it, and the
     pushState below is a no-op against a route it is already on. */
  landing: ['/'],
};
/* `null` where there is no signed-out boundary to cross. */
const SIGNIN = { client: 'button.btn-blue', admin: "button:has-text('Sign in')", landing: null };
/* Routes that render outside the shell, walked with `goto` before the sign-in
   click. The same blind spot darkdiff carried: the signed-out screens are the
   first thing anyone sees and nothing measured their contrast. Reaching them
   costs a real navigation because `authed` is an in-memory field — a `goto`
   after signing in re-mounts the app signed out, which is fine here only
   because these run first. */
const PRE = { client: ['/login', '/signup'], admin: ['/'], landing: [] };
const THEME_KEY = { client: 'fanation.theme', admin: 'fanation.admin.theme', landing: 'fanation.landing.theme' };

/* Runs in the page. Returns one record per element that paints a glyph. */
const probe = () => {
  const parse = (s) => {
    const m = /rgba?\(([^)]+)\)/.exec(s || '');
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  const WHITE = { r: 255, g: 255, b: 255, a: 1 };

  /* A gradient built out of opaque colour stops is not art.

     `backdrop` used to bail on any `background-image`, which is the right call
     for a photograph and the wrong one for
     `linear-gradient(90deg, rgb(…) 0%, rgb(…) 100%)`. That is a known set of
     flat surfaces with a computable worst case, and it is exactly what
     `.btn-grad`, `.tag.on` and the landing stat bars paint. Bailing on it put
     every one of them in the unscored bucket — which is how white ink at 3.01
     survived an audit that reported zero failures.

     Only fully-opaque stops resolve. A translucent stop lets whatever is under
     it through, and reconstructing that per-stop against a surface that may
     itself be a photograph is more machinery than the answer is worth; `art`
     stays the honest reading there.

     The stop *positions* are ignored on purpose. Contrast has no geometry — a
     glyph either clears the bar against every surface it can land on or it
     does not, and a stop occupying 4% of the bar is still a surface some letter
     sits on. Scoring the worst stop is the same rule the `-ink` values were
     solved under. */
  const stops = (bgImage) => {
    if (!/gradient\(/i.test(bgImage)) return null;
    if (/url\(|image-set|cross-fade|element\(|paint\(/i.test(bgImage)) return null;
    const found = bgImage.match(/rgba?\([^()]*\)/g);
    if (!found || !found.length) return null;
    const cols = found.map(parse);
    if (cols.some((c) => !c || c.a < 0.999)) return null;
    return cols;
  };

  /* Score the worst pair. Both sides are lists because a gradient can be either
     one — the ground under a glyph, or, with `background-clip: text`, the glyph
     itself. Everywhere else both are single-element and this is identical to
     measuring one colour against one colour. */
  const worst = (fgs, bgs) => {
    let out = null;
    for (const bg of bgs) for (const f0 of fgs) {
      const f = f0.a < 0.999 ? over(f0, bg) : f0;
      const got = ratio(f, bg);
      if (!out || got < out.got) out = { fg: f, bg, got };
    }
    return out;
  };

  /* Over-media detection has to be geometric, not ancestral.

     `Photo` renders as `position:absolute; inset:0` *inside* a card, and every
     chip laid over it is a sibling of that Photo, not a descendant. Walking up
     the tree from the chip therefore never meets the photograph — it meets the
     card, reports the card's flat surface, and scores a Bucket B chip against a
     background it is not actually sitting on. Containment against the painted
     rect is the only test that sees what the eye sees.

     Containment, not intersection: an avatar `<img>` merely adjacent to a label
     must not swallow it. */
  const MEDIA = [...document.querySelectorAll('img,video')]
    .map((m) => m.getBoundingClientRect())
    .filter((r) => r.width >= 8 && r.height >= 8);
  const overMedia = (el) => {
    const r = el.getBoundingClientRect();
    return MEDIA.some((m) => r.left >= m.left - 1 && r.right <= m.right + 1
      && r.top >= m.top - 1 && r.bottom <= m.bottom + 1);
  };

  /* Composite every background from the element up to the root. Stops at the
     first fully-opaque layer — anything under that is invisible. `art` marks a
     layer painted by an image or a gradient, where no flat surface exists. */
  const backdrop = (el) => {
    /* Translucent layers only. The terminal opaque layer goes in `base`, which
       is a list because a resolved gradient contributes more than one. */
    const stack = [];
    let base = null, art = false, node = el;
    while (node && node !== document.documentElement.parentNode) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') {
        const s = stops(cs.backgroundImage);
        if (!s) { art = true; }
        else base = s;
        break;
      }
      const bg = parse(cs.backgroundColor);
      if (bg && bg.a > 0) {
        if (bg.a >= 0.999) { base = [bg]; break; }
        stack.push(bg);
      }
      node = node.parentElement;
    }
    if (art) return { art: true };
    if (!base) base = [WHITE];
    /* Every translucent layer, in painting order, over each candidate. */
    const colors = base.map((b) => {
      let acc = b;
      for (let i = stack.length - 1; i >= 0; i--) acc = over(stack[i], acc);
      return acc;
    });
    return { art: false, colors };
  };

  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  /* 1.4.3 exempts incidental text — decoration that conveys nothing, where
     removing it costs the reader no information. In practice that is the same
     set an author marks `aria-hidden`, because both questions have one answer:
     does anything depend on reading this? A watermark numeral behind a card
     that already carries its own heading does not, and neither does a `→`
     between two steps that a phone never renders. Scoring those forces a
     designer to either darken decoration until it stops being decoration, or
     carry a permanent exception list. Honouring `aria-hidden` is neither: the
     author states the intent once, in the markup, where a screen reader reads
     the same claim and holds them to it. */
  const hidden = (el) => el.closest('[aria-hidden="true"]') !== null;

  const text = [], icons = [], art = [];
  for (const el of document.querySelectorAll('*')) {
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
    if (!visible(el)) continue;
    if (hidden(el)) continue;
    const cs = getComputedStyle(el);

    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length);
    const isIcon = el.tagName === 'svg' || el.tagName === 'SVG';
    if (!own && !isIcon) continue;

    /* An element that paints its own opaque background is measurable wherever it
       sits — `.badge-live` is a solid red pill, and the photograph behind it is
       not part of the reading. Only a translucent element genuinely inherits the
       picture, so the geometric test applies to those alone. */
    /* `background-clip: text` swaps the two roles. The gradient paints the
       glyph, not the ground — `.stat-gradient-text` and the highlighted word in
       each headline are both this — so it is the foreground, and the background
       is whatever the ancestors paint. Scoring `color` against it is doubly
       wrong: `color` is `transparent` on these, and the gradient is the ink.
       Start the backdrop walk one level up so the element's own background is
       not mistaken for the surface it sits on. */
    const clipText = (cs.webkitBackgroundClip || cs.backgroundClip) === 'text';
    const selfGrad = cs.backgroundImage && cs.backgroundImage !== 'none' ? stops(cs.backgroundImage) : null;
    const inkGrad = clipText ? selfGrad : null;
    const ownGrad = clipText ? null : selfGrad;

    const ownBg = parse(cs.backgroundColor);
    const opaqueSelf = ownGrad !== null
      || (!!ownBg && ownBg.a >= 0.999 && (!cs.backgroundImage || cs.backgroundImage === 'none'));
    const bd = (!opaqueSelf && overMedia(el))
      ? { art: true }
      : backdrop(inkGrad ? (el.parentElement || el) : el);
    const label = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 34);

    if (bd.art) {
      art.push({ tag: el.tagName, cls: el.className.baseVal ?? String(el.className || ''), label });
      continue;
    }

    if (own) {
      let fgs;
      if (inkGrad) fgs = inkGrad;
      else {
        /* `-webkit-text-fill-color` is what actually paints the glyph. Chrome
           reports it as `color` unless it was set, so reading it costs nothing
           and catches the case where it was — including `transparent`, which
           paints no glyph at all and must not be scored as if it did. */
        const ink = parse(cs.webkitTextFillColor) || parse(cs.color);
        if (!ink || ink.a === 0) continue;
        fgs = [ink];
      }
      const w = worst(fgs, bd.colors);
      const size = parseFloat(cs.fontSize);
      const weight = parseInt(cs.fontWeight, 10) || 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      text.push({
        fg: hex(w.fg), bg: hex(w.bg), size, weight, large,
        need: large ? 3 : 4.5, got: +w.got.toFixed(2),
        cls: String(el.className || ''), label,
      });
    }

    if (isIcon) {
      /* Read the paint off a geometry child, not off the `<svg>` root.

         `Icon` puts `stroke` on the root and the children inherit it, but a
         hand-written mark paints on its paths and leaves the root at the
         initial `fill: rgb(0,0,0)` — which paints nothing, because the root has
         no geometry. Measuring the root scores a black glyph that does not
         exist. */
      let paint = null;
      for (const g of [el, ...el.querySelectorAll('path,circle,rect,line,polyline,polygon,ellipse')]) {
        const gs = getComputedStyle(g);
        const cand = gs.stroke && gs.stroke !== 'none' ? gs.stroke : (gs.fill && gs.fill !== 'none' ? gs.fill : null);
        if (g !== el || (cand && cand !== 'rgb(0, 0, 0)')) { if (cand) { paint = cand; break; } }
      }
      const p = parse(paint);
      if (!p || p.a === 0) continue;
      /* Standalone means no text label anywhere near it. An icon in its own
         wrapper div still sits beside a heading — `.feature-ic` is exactly that
         shape — so the check has to reach past the immediate parent. */
      const parentText = (el.parentElement?.textContent || '').trim().length
        + (el.parentElement?.parentElement?.textContent || '').trim().length;
      const w = worst([p], bd.colors);
      icons.push({
        fg: hex(w.fg), bg: hex(w.bg), need: 3, got: +w.got.toFixed(2),
        standalone: parentText === 0,
        cls: String(el.parentElement?.className || ''),
      });
    }
  }
  return { text, icons, art };
};

const browser = await chromium.launch(launchOpts);
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => {
  addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style');
    s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(s);
  });
});
/* Light used to be reached by clicking the toggle after signing in, which is why
   nothing signed-out was ever measured: there was no light on screen until the
   app was already inside. Seeding storage instead paints light before the first
   frame, on every route, which is also the production path — the pre-paint
   script in index.html reads exactly this key. The toggle is still asserted to
   exist so removing it cannot pass unnoticed; it is no longer clicked, because
   clicking it now would turn the lights back off. */
await page.addInitScript(([k, t]) => localStorage.setItem(k, t), [THEME_KEY[KIND], 'light']);
await page.goto(ORIGIN + (PRE[KIND][0] || '/'), { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const theme = await page.evaluate(() => document.body.dataset.theme);
if (theme !== 'light') { console.error(`✗ theme is "${theme}", not light — aborting`); process.exit(1); }

const fails = new Map(), iconFails = new Map();
let nText = 0, nIcon = 0, nArt = 0, artSet = new Map();

const WALK = [...PRE[KIND].map((r) => [r, 'pre']), ...ROUTES[KIND].map((r) => [r, 'in'])];
let signedIn = false, sawToggle = false;

for (const [r, phase] of WALK) {
  if (phase === 'pre') {
    await page.goto(ORIGIN + r, { waitUntil: 'networkidle' });
  } else {
    if (!signedIn && SIGNIN[KIND]) {
      await page.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
      await page.click(SIGNIN[KIND]);
      signedIn = true;
      await page.waitForTimeout(700);
    }
    await page.evaluate((to) => { history.pushState({}, '', to); dispatchEvent(new PopStateEvent('popstate')); }, r);
  }
  await page.waitForTimeout(450);
  sawToggle ||= await page.locator('button[title="Toggle light / dark"]').count() > 0;
  const { text, icons, art } = await page.evaluate(probe);
  nText += text.length; nIcon += icons.length; nArt += art.length;
  for (const a of art) {
    const k = `${a.tag}.${a.cls}`;
    if (!artSet.has(k)) artSet.set(k, { n: 0, eg: a.label, routes: new Set() });
    artSet.get(k).n++; artSet.get(k).routes.add(r);
  }
  for (const t of text) {
    if (t.got >= t.need) continue;
    const k = `${t.fg}|${t.bg}|${t.size}|${t.weight}`;
    if (!fails.has(k)) fails.set(k, { ...t, n: 0, routes: new Set(), egs: new Set() });
    const e = fails.get(k); e.n++; e.routes.add(r);
    if (e.egs.size < 3 && t.label) e.egs.add(`${t.cls || t.label}`.slice(0, 40));
  }
  for (const i of icons) {
    if (i.got >= i.need || !i.standalone) continue;
    const k = `${i.fg}|${i.bg}`;
    if (!iconFails.has(k)) iconFails.set(k, { ...i, n: 0, routes: new Set(), egs: new Set() });
    const e = iconFails.get(k); e.n++; e.routes.add(r);
    if (e.egs.size < 3) e.egs.add(i.cls.slice(0, 34));
  }
}
await browser.close();
if (!sawToggle) { console.error('✗ no light/dark toggle on any route — aborting'); process.exit(1); }

const sorted = [...fails.values()].sort((a, b) => a.got - b.got);
console.log(`\n  ${KIND} — light · ${WALK.length} routes · ${nText} text nodes · ${nIcon} icons · ${nArt} over art\n`);
console.log(`  TEXT — 1.4.3 (${sorted.length} distinct failing combinations, ${sorted.reduce((s, x) => s + x.n, 0)} occurrences)`);
for (const f of sorted) {
  console.log(`    ${String(f.got).padStart(5)} / ${f.need}   ${f.fg} on ${f.bg}   ${String(f.size).padStart(4)}px w${f.weight}  ×${String(f.n).padStart(3)}  ${f.routes.size} routes`);
  console.log(`            ${[...f.egs].join(' · ')}`);
  console.log(`            ${[...f.routes].slice(0, 4).join(' ')}${f.routes.size > 4 ? ' …' : ''}`);
}
const isorted = [...iconFails.values()].sort((a, b) => a.got - b.got);
console.log(`\n  STANDALONE ICONS — 1.4.11 (${isorted.length} distinct, ${isorted.reduce((s, x) => s + x.n, 0)} occurrences)`);
for (const f of isorted) {
  console.log(`    ${String(f.got).padStart(5)} / 3      ${f.fg} on ${f.bg}   ×${String(f.n).padStart(3)}  ${f.routes.size} routes`);
  console.log(`            ${[...f.egs].join(' · ')}`);
}
console.log(`\n  OVER ART — not scored (${artSet.size} distinct selectors)`);
for (const [k, v] of [...artSet].sort((a, b) => b[1].n - a[1].n).slice(0, 14))
  console.log(`    ×${String(v.n).padStart(4)}  ${k.slice(0, 66)}`);
