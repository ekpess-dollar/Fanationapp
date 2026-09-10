/**
 * Contrast for boundaries — the thing nothing in this toolchain measured.
 *
 *   node tools/borderaudit.mjs <client|admin|landing> <origin> [--theme=dark,light]
 *
 * `lightaudit` scores TEXT and STANDALONE ICONS. `onart` scores ink over
 * photographs. Between them they cover every glyph in the three apps and not one
 * border, outline or rule — so a focus ring at 2.7:1, a card whose only "this is
 * suspended" signal is a 30%-alpha accent edge, and an input whose resting
 * boundary is 1.23:1 all measured clean, because nobody asked.
 *
 * WCAG 1.4.11 is the bar: 3:1 for the visual information required to identify a
 * user-interface component and its boundaries. Not 4.5 — a border is not text.
 *
 * ── What counts as a failure
 *
 * A boundary is discernible if ANY of three things is true:
 *
 *   1. the painted border contrasts >=3:1 with the surface OUTSIDE it, or
 *   2. it contrasts >=3:1 with the surface INSIDE it, or
 *   3. the inside surface itself contrasts >=3:1 with the outside — in which
 *      case the fill already draws the boundary and the border is decoration.
 *
 * (3) is why this tool does not report every faint hairline on a tinted chip as
 * a defect. A mint chip on white has a 1.15:1 border and a fill that reads 1.09
 * — that pair fails. The same chip on a card whose fill lands 3.4:1 against the
 * page passes, because the eye finds the edge from the fill. Reporting the first
 * and not the second is the whole point; a tool that flags both is noise, and a
 * tool that flags neither is `lightaudit` before today.
 *
 * ── How the surfaces are read
 *
 * The surface OUTSIDE comes from pixels. A boundary can sit against a
 * photograph, a translucent gradient stack, or a flat card — resolving that
 * analytically is the problem `lightaudit` gives up on and hands to `onart`, and
 * it would be the same problem here. So: one screenshot per frame, and a ring of
 * twelve points 2px beyond the outer edge of the border box — each of the four
 * edges at 25%, 50% and 75% of its length. The worst point wins, because a
 * boundary that vanishes against one bright corner of a photograph has failed
 * however well it reads against the rest.
 *
 * Sampling 2px clear of every edge is what makes this immune to antialiasing,
 * which is also why the border strip itself is never sampled: a 1px border on a
 * fractional device pixel is half its own colour and half its neighbour's, and
 * reading it would understate every thin rule in the build.
 *
 * The surface INSIDE is arithmetic, not pixels — the element's own declared
 * background composited over the outer sample. Reading it from the screenshot
 * was the first attempt and it was wrong: a card with zero padding has a
 * photograph 3px inside its own edge, so the sample returned the picture and the
 * tool scored the card's border against its own contents. Every card on
 * `/explore` came back at 1.12:1 for that reason and none of them deserved it.
 * An opaque background short-circuits the composite and is exact; a translucent
 * one approximates what is beneath the element by what is beside it, which is
 * the same picture in every case that matters. An element whose background is
 * itself an image has no declared colour to composite, and only there does the
 * inner ring get read from pixels — flagged `px-in` when it happens.
 *
 * The painted border colour follows from the same two surfaces: the declared
 * rgba composited over whatever is beneath the strip. `background-clip` defaults
 * to `border-box`, so a card's fill paints under its own edge and the INSIDE
 * surface is the base. Under `padding-box` the strip sits on the ancestor stack
 * and the OUTER sample is the base.
 *
 * ── Which boundaries are gated
 *
 * 1.4.11 governs components and states, not decoration, so a bar applied to
 * every painted edge in the build would flag a thousand hairlines and bury the
 * dozen defects. The criterion asks for the visual information *required* to
 * identify a component and its state — required being the word that does the
 * work. Five roles, assigned in the page:
 *
 *   control   an input, textarea, select, button or switch — the boundary is
 *             what says the thing is operable. A ghost button's edge is the only
 *             thing separating it from a line of prose, and an input's box is
 *             the affordance itself. Gated, label or no label.
 *   focus     an outline: a focus ring or a selection ring is state by
 *             definition, and no text says "selected". Gated.
 *   accent    a non-neutral border on an element that says nothing in text.
 *             Declaring a brand colour on a silent edge is the whole signal —
 *             it is there to mean suspended, or featured, or active, and if it
 *             does not carry, the meaning does not arrive. Gated, and the honest
 *             repair is either a colour that carries or no border at all.
 *   label     a non-neutral border on an element that states itself in its own
 *             text. A chip reading «★ Featured» is identified by the word, which
 *             `lightaudit` has already scored at 4.5:1; the edge around it is
 *             decoration and 1.4.11 does not reach it. Measured, printed, not
 *             gated — and worth reading anyway, because an edge at 1.2:1 with a
 *             fill at 1.07 is a chip nobody can see as a chip.
 *   divider   a neutral rule between sections. Measured, printed, not gated.
 *
 * Neutral means unsaturated relative to its own brightness, or dark enough that
 * hue cannot be read — `rgba(12,18,32,.1)` is the light theme's hairline, not a
 * navy accent, and a flat saturation threshold would call it one.
 *
 * Own text means direct text nodes plus leaf inline wrappers, never the whole
 * subtree. A card containing forty labelled rows has not labelled itself, and
 * counting `textContent` would excuse every container in the build.
 *
 * ── Outlines
 *
 * An outline is measured where it actually paints, not where the box is. With
 * `outline-offset: -2px` and a 2px width the strip lies wholly inside the border
 * box — over the element's own content, which on `/studio/vault` is a
 * photograph. So the rings move with the offset, and the base for compositing is
 * whichever neighbour the strip is nearer. That approximation only matters for a
 * translucent outline; every outline in this build is opaque, where the base
 * cancels out of the arithmetic entirely.
 *
 * ── Reading the output
 *
 * `tight` marks an element with under 3px of padding on the sampled side, where
 * the inner ring may have landed on content rather than on the element's own
 * surface. Those readings are reported, not dropped — a suspicious number is
 * still a number, and silently discarding the awkward ones is how a tool comes
 * to agree with itself.
 */
import { chromium, launchOpts } from "./playwright-env.mjs";
import EXEMPT from "./border-exempt.mjs";

const [KIND, ORIGIN, ...rest] = process.argv.slice(2);
if (!ORIGIN || !["client", "admin", "landing"].includes(KIND)) {
  console.error("usage: borderaudit.mjs <client|admin|landing> <origin> [--theme=dark,light]");
  process.exit(1);
}
const THEMES = (rest.find((a) => a.startsWith("--theme="))?.slice(8) || "dark,light").split(",");

/* Same walk as onart: `authed` is an in-memory zustand field with no
   persistence, so the signed-in routes are reached by pushState after one click
   on the primary button. A `page.goto` re-mounts the app signed out. */
const ROUTES = {
  client: ["/feed", "/explore", "/reels", "/live", "/messages", "/notifications", "/collections",
    "/subscriptions", "/wallet", "/creator/sofiaa", "/studio", "/studio/content", "/studio/fans",
    "/studio/live", "/studio/promos", "/studio/vault"],
  admin: ["/overview", "/users", "/creators", "/moderation", "/payouts", "/kyc", "/finance", "/reports"],
  landing: ["/"],
};
const PRE = { client: ["/login", "/signup"], admin: ["/"], landing: [] };
const SIGNIN = { client: "button.btn-blue", admin: "button:has-text('Sign in')", landing: null };
const THEME_KEY = { client: "fanation.theme", admin: "fanation.admin.theme", landing: "fanation.landing.theme" };

const BAR = 3;
/* `label` and `divider` are measured and printed but never counted against the
   criterion — see the role table at the top of this file for why. */
const GATED = new Set(["control", "focus", "accent"]);
const MAXSCROLL = 8;
const VIEW = { width: +(process.env.BORDER_W || 1440), height: +(process.env.BORDER_H || 900) };

/* ── in-page: find every boundary, and where to sample around it ───────────── */

const collect = () => {
  const SIDES = ["Top", "Right", "Bottom", "Left"];
  const rgba = (s) => {
    const m = /rgba?\(([^)]+)\)/.exec(s || "");
    if (!m) return null;
    const p = m[1].split(",").map((x) => parseFloat(x));
    return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]];
  };
  const sig = (el) => {
    const c = (el.getAttribute("class") || "").trim().replace(/\s+/g, " ").slice(0, 52);
    return el.tagName + "." + c;
  };
  /* Unsaturated for its own brightness, or too dark to read a hue off. The
     second clause is the whole reason this is not a one-line test: the light
     theme's hairline is `rgba(12,18,32,.1)`, a channel spread of 20 that a flat
     threshold calls navy. Nothing at that brightness carries a hue to the eye. */
  const neutral = (c) => {
    const mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]);
    return mx <= 45 || (mx - mn) <= 0.18 * mx;
  };
  /* `.hero-ghost` is an <a>, not a button, and it was slipping through as a
     divider — a control whose only affordance is its outline, scored as if it
     were a rule between two paragraphs. Anything else styled as a control
     without being one belongs in this list too. */
  const CONTROL = "input, textarea, select, button, [role='button'], .btn, .sw, .switch, .hero-ghost";
  /* The element's OWN words — direct text nodes, plus inline wrappers with no
     element children of their own, which is how «★ Featured» arrives when the
     star is in a span. Deliberately not `textContent`: a card wrapping forty
     labelled rows has not labelled itself, and reading the subtree would hand
     every container in the build an excuse. */
  const INLINE_LABEL = ["B", "STRONG", "EM", "I", "SMALL", "SPAN", "LABEL", "CODE"];
  const ownText = (el) => {
    let t = "";
    for (const n of el.childNodes) {
      if (n.nodeType === 3) t += n.nodeValue;
      else if (n.nodeType === 1 && INLINE_LABEL.includes(n.tagName) && !n.firstElementChild) t += n.textContent;
    }
    return t.replace(/\s+/g, "");
  };
  /* One character is enough: a count badge reading «5» names itself as surely
     as a word does, and whitespace has already been stripped out. */
  const roleOf = (el, kind, decl) => (kind === "outline" ? "focus"
    : el.matches(CONTROL) ? "control"
      : neutral(decl) ? "divider"
        : ownText(el).length >= 1 ? "label" : "accent");
  /* Points on a ring `d` away from a rect: three along each edge, so a boundary
     that only fails where it crosses one bright corner of a photograph is still
     caught. A rect too small to hold the ring contributes nothing rather than
     folding back on itself. */
  const ring = (r, d) => {
    const pts = [];
    const x0 = r.left - d, x1 = r.right + d, y0 = r.top - d, y1 = r.bottom + d;
    if (x1 - x0 < 4 || y1 - y0 < 4) return pts;
    for (const f of [0.25, 0.5, 0.75]) {
      pts.push({ x: r.left + r.width * f, y: y0 }, { x: r.left + r.width * f, y: y1 },
        { x: x0, y: r.top + r.height * f }, { x: x1, y: r.top + r.height * f });
    }
    return pts.filter((p) => p.x >= 0 && p.y >= 0 && p.x < innerWidth && p.y < innerHeight)
      .map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
  };

  const out = [];
  let n = 0;
  for (const el of document.querySelectorAll("body *")) {
    const tag = el.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "SVG" || tag === "PATH" || tag === "BR") continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) < 0.05) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 6 || r.height < 6) continue;
    if (r.bottom < 2 || r.top > innerHeight - 2 || r.right < 2 || r.left > innerWidth - 2) continue;

    const bw = {}; const pad = {};
    for (const S of SIDES) {
      bw[S] = parseFloat(cs[`border${S}Width`]) || 0;
      pad[S] = parseFloat(cs[`padding${S}`]) || 0;
    }
    /* A background-image means there is no declared colour to composite, so the
       inside surface has to come off the screenshot after all. Everything else
       resolves from `backgroundColor` and never touches a pixel. */
    const ownBg = rgba(cs.backgroundColor) || [0, 0, 0, 0];
    const bgImage = cs.backgroundImage && cs.backgroundImage !== "none";

    /* Sides that actually paint, grouped by what they paint — four identical
       edges are one boundary, not four findings, but a card with a single
       coloured left rule is its own entry. */
    const groups = new Map();
    for (const S of SIDES) {
      const style = cs[`border${S}Style`];
      if (!bw[S] || style === "none" || style === "hidden") continue;
      const c = rgba(cs[`border${S}Color`]);
      if (!c || c[3] < 0.02) continue;
      const key = `${c.join(",")}|${bw[S]}|${style}`;
      if (!groups.has(key)) groups.set(key, { c, w: bw[S], style, sides: [] });
      groups.get(key).sides.push(S);
    }

    for (const g of groups.values()) {
      /* The inner ring clears the thickest painted edge, so a 2px border and a
         1px border on the same element both sample past their own strip. */
      const inset = Math.max(...g.sides.map((S) => bw[S])) + 2;
      const outer = ring(r, 2);
      if (!outer.length) continue;
      const inner = bgImage ? ring(r, -inset) : [];
      if (bgImage && !inner.length) continue;
      el.setAttribute("data-ba", String(n));
      out.push({
        i: n++, sel: sig(el), kind: "border", role: roleOf(el, "border", g.c),
        sides: g.sides.map((s) => s.toLowerCase()),
        decl: g.c, width: g.w, style: g.style, ownBg, bgImage,
        clip: (cs.backgroundClip || cs.webkitBackgroundClip || "border-box"),
        tight: bgImage && g.sides.some((S) => pad[S] < 3),
        outer, inner,
        text: (el.textContent || "").trim().slice(0, 40),
      });
    }

    const ow = parseFloat(cs.outlineWidth) || 0;
    const ostyle = cs.outlineStyle;
    if (ow && ostyle !== "none" && ostyle !== "hidden") {
      const oc = rgba(cs.outlineColor);
      if (oc && oc[3] >= 0.02) {
        /* The strip runs from `off` to `off + ow` outward from the border box.
           A negative offset puts it inside — that is the selected-tile ring on
           /studio/vault, painted over the photograph rather than over the page. */
        const off = parseFloat(cs.outlineOffset) || 0;
        const outer = ring(r, off + ow + 2);
        /* An outline never paints under the element's own background — it sits
           on top of whatever is already there — so its inner surface is always
           read from the screenshot, `bgImage` or not. A negative offset puts
           that strip over the element's own content: on /studio/vault the
           selection ring is drawn on the photograph, not on the page. */
        const inner = ring(r, off - 2);
        if (inner.length && outer.length) {
          el.setAttribute("data-ba", String(n));
          out.push({
            i: n++, sel: sig(el), kind: "outline", role: "focus", sides: ["all"],
            decl: oc, width: ow, style: ostyle, ownBg, bgImage: true,
            clip: off + ow <= 0 ? "border-box" : "padding-box",
            tight: false, outer, inner,
            text: (el.textContent || "").trim().slice(0, 40),
          });
        }
      }
    }
  }
  return out;
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
const over = (fg, bg) => (fg[3] >= 0.999 ? fg.slice(0, 3)
  : [0, 1, 2].map((k) => fg[3] * fg[k] + (1 - fg[3]) * bg[k]));

const browser = await chromium.launch(launchOpts);
const worst = new Map();
let measured = 0, noPixel = 0;

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

      const marks = await page.evaluate(collect);
      if (!marks.length) continue;
      const shot = (await page.screenshot({ type: "png" })).toString("base64");
      await page.evaluate(() => {
        for (const e of document.querySelectorAll("[data-ba]")) e.removeAttribute("data-ba");
      });

      const readings = await page.evaluate(async ([b64, marksIn]) => {
        const bin = atob(b64); const u = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        const bmp = await createImageBitmap(new Blob([u], { type: "image/png" }));
        const cv = new OffscreenCanvas(bmp.width, bmp.height);
        const cx = cv.getContext("2d", { willReadFrequently: true });
        cx.drawImage(bmp, 0, 0);
        const d = cx.getImageData(0, 0, bmp.width, bmp.height).data;
        const px = (p) => {
          const i = (p.y * bmp.width + p.x) * 4;
          return i + 3 < d.length ? [d[i], d[i + 1], d[i + 2]] : null;
        };
        return marksIn.map((m) => ({
          i: m.i,
          outer: m.outer.map(px).filter(Boolean),
          inner: m.inner.map(px).filter(Boolean),
        }));
      }, [shot, marks]);

      const byId = new Map(marks.map((m) => [m.i, m]));
      for (const rd of readings) {
        const m = byId.get(rd.i);
        if (!m || !rd.outer.length) { noPixel++; continue; }
        if (m.bgImage && !rd.inner.length) { noPixel++; continue; }
        measured++;

        /* Worst case, not average. `inside` is derived per outer sample rather
           than sampled beside it, so a zero-padding card is scored against its
           own fill instead of against the photograph it contains. */
        const insides = m.bgImage ? rd.inner : null;
        let best = null;
        const consider = (o, n2) => {
          const base = m.clip === "border-box" ? n2 : o;
          const paint = over(m.decl, base);
          const rBO = ratio(paint, o), rBI = ratio(paint, n2), rIO = ratio(n2, o);
          const score = Math.max(rBO, rBI, rIO);
          if (!best || score < best.score) best = { score, rBO, rBI, rIO, paint, o, in: n2 };
        };
        for (const o of rd.outer) {
          if (insides) for (const n2 of insides) consider(o, n2);
          else consider(o, over(m.ownBg, o));
        }

        const rec = {
          sel: m.sel, kind: m.kind, role: m.role, sides: m.sides.join("+"), theme, route,
          width: m.width, style: m.style, decl: m.decl, tight: m.tight,
          pxIn: !!insides, text: m.text, ...best,
        };
        const key = `${m.sel} ‹${m.kind}:${rec.sides}›`;
        const gated = GATED.has(m.role);
        const prev = worst.get(key);
        /* Sub-bar occurrences are counted for every role. Only the gated ones
           reach the total — an ungated row still prints its own tally, because
           "0 failing" on a chip nobody can see would be its own kind of lie. */
        if (!prev) worst.set(key, { n: 1, fail: best.score < BAR ? 1 : 0, gated, rec, all: [rec] });
        else {
          prev.n++;
          if (best.score < BAR) prev.fail++;
          prev.all.push(rec);
          if (best.score < prev.rec.score) prev.rec = rec;
        }
      }
    }
  }
  await ctx.close();
}
await browser.close();

/* ── report ────────────────────────────────────────────────────────────────── */

const rows = [...worst.values()].sort((a, b) => a.rec.score - b.rec.score);
/* An exemption suppresses the gate, not the measurement. The row is still
   scored, still printed, still carries its count — it just carries a written
   reason with it and stops deciding whether the build passes. */
const mine = EXEMPT.filter((e) => e.kind === KIND);
for (const r of rows) r.exempt = r.gated ? mine.find((e) => r.rec.sel.startsWith(e.sel)) : undefined;
const gatedRows = rows.filter((r) => r.gated && !r.exempt);
const exemptRows = rows.filter((r) => r.exempt);
const gatedSeen = gatedRows.reduce((s, r) => s + r.n, 0);
/* An exemption that matches nothing is worse than no exemption: it reads as
   coverage and is a stale note about markup that has since moved. */
const stale = mine.filter((e) => !exemptRows.some((r) => r.exempt === e));
console.log(`\n  ${KIND} — ${THEMES.join("+")} · ${VIEW.width}x${VIEW.height} · ${measured} boundaries` +
  ` · ${gatedSeen} gated at ${BAR}:1 (1.4.11)\n`);
if (noPixel) console.log(`  ${noPixel} boundaries yielded no in-viewport sample ring\n`);

const line = (r) => {
  const k = r.rec;
  const ok = k.score >= BAR;
  const why = k.rIO >= BAR ? "fill carries it" : k.rBO >= BAR ? "reads out" : k.rBI >= BAR ? "reads in" : "invisible";
  const a = k.decl[3] < 0.999 ? `@${k.decl[3]}` : "";
  const flags = [k.tight && "tight", k.pxIn && "px-in"].filter(Boolean).join(" ");
  console.log(`  ${r.exempt ? "--" : r.gated ? (ok ? "OK" : "XX") : "··"} ${k.role.padEnd(7)} ${k.sel}` +
    `  ‹${k.kind} ${k.sides} ${k.width}px ${k.style}›   ${r.n} seen · ${r.fail} failing${flags ? "  " + flags : ""}`);
  console.log(`     worst ${k.score.toFixed(2)}:1  ${why}  ${k.theme} ${k.route}` +
    `  edge ${hex(k.paint)} (decl ${hex(k.decl)}${a})  out ${hex(k.o)} in ${hex(k.in)}` +
    `  ·  b/out ${k.rBO.toFixed(2)} b/in ${k.rBI.toFixed(2)} fill/out ${k.rIO.toFixed(2)}`);
  if ((r.gated || k.role === "label") && !ok) {
    const bad = r.all.filter((x) => x.score < BAR).sort((x, y) => x.score - y.score).slice(0, 4);
    console.log("       " + bad.map((x) => `${x.score.toFixed(2)} ${x.theme}${x.route}«${x.text}»`).join(" · "));
  }
};

console.log("  ── GATED — controls, focus rings, silent accent borders ──────────\n");
for (const r of gatedRows) line(r);
if (exemptRows.length) {
  console.log("\n  ── EXEMPT — measured and printed, not gated. Reason attached ─────\n");
  for (const r of exemptRows) {
    line(r);
    console.log(`       ↳ ${r.exempt.reason}\n`);
  }
}
const labelled = rows.filter((x) => x.rec.role === "label");
if (labelled.length) {
  console.log("\n  ── LABELLED — accent edges on things that say what they are ──────\n");
  for (const r of labelled) line(r);
}
console.log("\n  ── DIVIDERS — neutral rules, measured not gated ──────────────────\n");
for (const r of rows.filter((x) => !x.gated && x.rec.role !== "label")) line(r);

const total = gatedRows.reduce((s, r) => s + r.fail, 0);
const byRole = {};
for (const r of gatedRows) if (r.fail) byRole[r.rec.role] = (byRole[r.rec.role] || 0) + r.fail;
const softSeen = labelled.reduce((s, r) => s + r.n, 0);
const softFail = labelled.reduce((s, r) => s + r.fail, 0);
console.log(`\n${total ? "FAIL" : "PASS"} — ${total} of ${gatedSeen} gated boundaries below ${BAR}:1` +
  `  (${gatedRows.filter((r) => r.fail).length} distinct selectors` +
  `${Object.keys(byRole).length ? " · " + Object.entries(byRole).map(([k, v]) => `${k} ${v}`).join(", ") : ""})`);
if (softSeen) {
  console.log(`     plus ${softFail} of ${softSeen} labelled accent edges below ${BAR}:1 — not a 1.4.11 defect,` +
    ` the word carries the meaning. Read as design debt.`);
}
const exSeen = exemptRows.reduce((s, r) => s + r.n, 0);
const exFail = exemptRows.reduce((s, r) => s + r.fail, 0);
if (exSeen) {
  console.log(`     plus ${exFail} of ${exSeen} exempt boundaries below ${BAR}:1 across` +
    ` ${exemptRows.length} selector${exemptRows.length === 1 ? "" : "s"} — excluded by border-exempt.mjs,` +
    ` reasons printed above. A pass here means the gate passed, not that nothing scored low.`);
}
/* Loud, and it fails the run. A stale exemption is the one failure mode this
   mechanism introduces, so it is not allowed to be a footnote. */
if (stale.length) {
  console.log(`\nSTALE — ${stale.length} exemption${stale.length === 1 ? "" : "s"} for ${KIND} matched nothing:` +
    ` ${stale.map((e) => e.sel).join(", ")}. Either the markup moved or the exemption is no longer needed;` +
    ` in both cases the entry is claiming coverage it does not have.`);
}
console.log("");
process.exit(total || stale.length ? 1 : 0);
