/**
 * One-shot tokenisation of the landing page's inline palette.
 *
 * Every entry is [file, search, replace, expectedCount] and every count is
 * asserted before anything is written. A literal that appears more or fewer
 * times than expected aborts the whole run with nothing on disk — which is the
 * point: a blind global replace across this file would silently convert the
 * eight `text-white` call sites that sit on a photograph or a solid accent and
 * must stay white in both themes.
 *
 * Ordering is load-bearing in two places, both marked below.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/* Two escape hatches, both there so this file stays checkable after it has run.
   `TOKENISE_ROOT` points the pass at a pristine copy of the baseline tree — the
   only way to re-assert the 66 edit counts once the working tree no longer
   contains the literals they search for. `--residual` skips the edits and runs
   only the RESIDUAL list, which is the half that guards the shipped code: it
   says these literals are gone and these survivors are deliberate, and it stays
   true no matter how many hand edits land on top of the pass. */
const ROOT = process.env.TOKENISE_ROOT
  ? process.env.TOKENISE_ROOT.replace(/\/?$/, "/")
  : new URL("../landing/src/", import.meta.url).pathname;
const RESIDUAL_ONLY = process.argv.includes("--residual");

const L = "Landing.tsx";
const N = "components/Nav.tsx";
const H = "components/Hero.tsx";
const S = "components/SocialIcons.tsx";

/** @type {Array<[string,string,string,number]>} */
const EDITS = [
  // ── text-white → .ink ────────────────────────────────────────────────
  // `hover:text-white` runs FIRST: every plain-`text-white` search below is
  // anchored to a className prefix, but running the hover pass first removes
  // any chance of a future edit clipping the middle of it.
  [L, "transition-colors hover:text-white", "transition-colors ink-hover", 4],

  [L, '<strong className="text-white">', '<strong className="ink">', 1],
  [L, 'font-black text-white mb-2.5" style={{ fontSize: 19,', 'font-black ink mb-2.5" style={{ fontSize: 19,', 3],
  [L, 'font-black text-white mb-2.5" style={{ fontSize: 20,', 'font-black ink mb-2.5" style={{ fontSize: 20,', 1],
  [L, `font-black text-white mb-5" style={{ fontSize: 'clamp(28px,3.5vw,48px)'`, `font-black ink mb-5" style={{ fontSize: 'clamp(28px,3.5vw,48px)'`, 1],
  [L, 'font-black text-white mb-3" style={{ fontSize: 20,', 'font-black ink mb-3" style={{ fontSize: 20,', 1],
  [L, 'inline-flex items-center text-white font-semibold flex-shrink-0"', 'inline-flex items-center ink font-semibold flex-shrink-0"', 1],
  [L, 'flex items-start gap-3 text-white" style={{ fontSize: 14 }}', 'flex items-start gap-3 ink" style={{ fontSize: 14 }}', 1],
  [L, 'font-bold text-white" style={{ fontSize: 14 }}', 'font-bold ink" style={{ fontSize: 14 }}', 1],
  [L, 'font-black text-white mb-4 leading-[1.1]"', 'font-black ink mb-4 leading-[1.1]"', 1],
  [L, 'inline-flex items-center text-white font-semibold"', 'inline-flex items-center ink font-semibold"', 2],
  [L, 'font-black text-white mb-5 leading-[1.06]"', 'font-black ink mb-5 leading-[1.06]"', 1],
  [L, 'font-black text-[18px] text-white"', 'font-black text-[18px] ink"', 1],

  // ── Surfaces ─────────────────────────────────────────────────────────
  // The two `#0C1121` searches are deliberately narrow: the sixth occurrence
  // is the footer logo tile, which keeps its dark chip in both themes.
  [L, "background: '#0C1121', padding: '16px 0'", "background: 'var(--band)', padding: '16px 0'", 1],
  [L, `className="section-pad" style={{ background: '#0C1121' }}`, `className="section-pad" style={{ background: 'var(--band)' }}`, 4],
  // `#111830` also appears inside a gradient that is always covered by a
  // photo; that one is spelled `linear-gradient(145deg,#111830,#18223C)` and
  // does not match `background: '…'`.
  [L, "background: '#111830'", "background: 'var(--card)'", 7],
  [L, "background: '#18223C'", "background: 'var(--card2)'", 1],
  [L, "background: '#07091A'", "background: 'var(--bg)'", 1],

  // ── Muted body copy ──────────────────────────────────────────────────
  // ORDER MATTERS: sweep all 35, then hand one back. The exception is the
  // earnings widget inside the phone mock, which floats on its own dark
  // scrim over a photograph and never follows the theme.
  [L, "'#7A8FB8'", "'var(--muted)'", 35],
  [
    L,
    "color: 'var(--muted)' }}>Earned this stream",
    "color: '#7A8FB8' /* fixed: this widget sits on its own dark scrim over the photo */ }}>Earned this stream",
    1,
  ],

  // ── Lines, fills, translucent ink ────────────────────────────────────
  [L, "const BORDER = 'rgba(255,255,255,0.07)'", "const BORDER = 'var(--line)'", 1],
  // Same exception, same reason: a hairline on a badge that sits on a photo.
  [
    L,
    "backdropFilter: 'blur(8px)', border: `1px solid ${BORDER}`",
    "backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.07)' /* fixed: hairline on a badge over the photo */",
    1,
  ],
  [L, "borderTop: `1px solid rgba(255,255,255,0.07)`", "borderTop: `1px solid var(--line)`", 3],
  [L, "border: '1px solid rgba(255,255,255,0.15)'", "border: '1px solid var(--line2)'", 3],
  [L, "background: 'rgba(255,255,255,0.05)'", "background: 'var(--fill)'", 1],
  [L, "background: 'rgba(255,255,255,0.03)'", "background: 'rgba(var(--ink-rgb),0.03)'", 1],
  [L, "background: 'rgba(255,255,255,0.07)', color:", "background: 'rgba(var(--ink-rgb),0.07)', color:", 1],
  [L, "color: 'rgba(255,255,255,0.3)'", "color: 'var(--ink-30)'", 1],
  [L, "color: 'rgba(255,255,255,0.78)'", "color: 'var(--ink-78)'", 1],
  // 0.6 also appears twice on the black app-store badges; the `borderBottom`
  // suffix picks out the one on a themed card.
  [L, "color: 'rgba(255,255,255,0.6)', borderBottom:", "color: 'var(--ink-60)', borderBottom:", 1],
  [L, "color: 'rgba(255,255,255,0.82)'", "color: 'var(--ink-82)'", 1],
  [L, "color: 'rgba(255,255,255,0.9)'", "color: 'var(--ink-90)'", 1],
  [L, "color: 'rgba(255,255,255,0.35)'", "color: 'var(--ink-35)'", 1],
  [L, "color: 'rgba(255,255,255,0.5)', fontWeight: 500", "color: 'var(--ink-50)', fontWeight: 500", 1],

  // ── Icon strokes ─────────────────────────────────────────────────────
  // Moved off the presentation attribute and onto inline style. `stroke` in
  // a presentation attribute has patchy `var()` support; as a style property
  // it resolves everywhere and still inherits to the child paths, so the
  // computed stroke is unchanged in dark.
  [L, 'stroke="#60B8FA"', "style={{ stroke: 'var(--blueL-ink)' }}", 4],
  [L, 'stroke="#FCA44B"', "style={{ stroke: 'var(--amber-ink)' }}", 1],
  [L, 'stroke="#F87171"', "style={{ stroke: 'var(--red-ink)' }}", 1],
  [L, 'stroke="#C084FC"', "style={{ stroke: 'var(--violet-ink)' }}", 1],
  [L, 'stroke="#5DDD90"', "style={{ stroke: 'var(--mint-ink)' }}", 1],
  [L, 'stroke="#FCD34D"', "style={{ stroke: 'var(--gold-ink)' }}", 1],

  // ── Ticker dots ──────────────────────────────────────────────────────
  [L, "dot: '#5DDD90'", "dot: 'var(--mint-ink)'", 3],
  [L, "dot: '#2599F6'", "dot: 'var(--blue-ink)'", 3],
  [L, "dot: '#FCA44B'", "dot: 'var(--amber-ink)'", 2],

  // ── Accent ink on themed surfaces ────────────────────────────────────
  // Untouched by design: `background: '#2599F6'` on the two solid buttons,
  // the `#2599F6` role glyph over a creator photo, the footer logo mark, and
  // the coral→blue gradient fill handled separately below.
  [L, "color: color || '#2599F6'", "color: color || 'var(--blue-ink)'", 1],
  [L, "border: '1px solid rgba(37,153,246,0.28)', color: '#2599F6'", "border: '1px solid rgba(37,153,246,0.28)', color: 'var(--blue-ink)'", 1],
  [L, `mb-5" style={{ color: '#2599F6', textTransform: 'uppercase' }}`, `mb-5" style={{ color: 'var(--blue-ink)', textTransform: 'uppercase' }}`, 3],
  [L, "fontSize: 17, color: '#2599F6', borderBottom:", "fontSize: 17, color: 'var(--blue-ink)', borderBottom:", 1],
  [L, "background: 'rgba(37,153,246,0.2)', color: '#2599F6'", "background: 'rgba(37,153,246,0.2)', color: 'var(--blue-ink)'", 1],
  [L, "fontSize: 18, color: '#2599F6'", "fontSize: 18, color: 'var(--blue-ink)'", 1],

  [L, "fontSize: 26, color: '#FCA44B'", "fontSize: 26, color: 'var(--amber-ink)'", 1],
  [L, "color: '#FCA44B', fontSize: 15, letterSpacing: 2", "color: 'var(--amber-ink)', fontSize: 15, letterSpacing: 2", 1],
  [L, '<SectionTag color="#FCA44B">', '<SectionTag color="var(--amber-ink)">', 1],
  [L, '<SectionTag color="#F36A46">', '<SectionTag color="var(--coral-ink)">', 2],
  [L, "fontSize: 15, color: '#5DDD90'", "fontSize: 15, color: 'var(--mint-ink)'", 1],

  // ── CTA gradient heading ─────────────────────────────────────────────
  // Dark keeps the exact two stops it has today so the computed
  // `background-image` is unchanged; only light gets solved endpoints.
  [
    L,
    "background: 'linear-gradient(90deg, #F36A46 0%, #2599F6 100%)'",
    "background: 'linear-gradient(90deg, var(--cta-from) 0%, var(--cta-to) 100%)'",
    1,
  ],

  // ── Solid fills that carry white ink ─────────────────────────────────
  // The two `Start Creating` buttons and the `LIVE` chip. White on #2599F6 is
  // 3.01 and on #EF4444 is 3.76; both labels are well under 24px, so both fail
  // 1.4.3 in light. `--blue-solid` / `--red-solid` alias the base in dark.
  // The searches are anchored on the neighbouring `fontSize` so they cannot
  // reach the `#2599F6` role glyph over the creator photo or the footer mark.
  [L, "background: '#2599F6', fontSize: 15", "background: 'var(--blue-solid)', fontSize: 15", 1],
  [L, "background: '#2599F6', fontSize: 17", "background: 'var(--blue-solid)', fontSize: 17", 1],
  [L, "fontSize: 12, background: '#EF4444'", "fontSize: 12, background: 'var(--red-solid)'", 1],

  // ── Decorative glyphs ────────────────────────────────────────────────
  // The `01`–`04` watermarks behind the earnings cards and the `→` between the
  // step cards. Both paint a glyph, so the contrast walk scores them — 1.18 and
  // 1.33 against a 3:1 bar. Neither carries information: the card's own heading
  // is the content, and the arrow is `hidden md:flex`, so a phone never sees it
  // at all. Anything a phone can lose is by definition not carrying meaning.
  // `aria-hidden` states that, removes them from the accessibility tree, and
  // takes them out of 1.4.3 as incidental text — which is what they are.
  [
    L,
    `<div className="font-black leading-none flex-shrink-0" style={{ fontSize: 48,`,
    `<div aria-hidden="true" className="font-black leading-none flex-shrink-0" style={{ fontSize: 48,`,
    1,
  ],
  [
    L,
    `<div className="hidden md:flex flex-none items-center justify-center" style={{ width: 40,`,
    `<div aria-hidden="true" className="hidden md:flex flex-none items-center justify-center" style={{ width: 40,`,
    2,
  ],

  /* ── Hero ─────────────────────────────────────────────────────────────
     The `LIVE` chip takes `--red-solid` for the same reason as the one on
     Landing. The badge coral looked like the one stale token on the site —
     hand-picked, never caught up with `--coralL` — and it was briefly rewritten
     to #F79A7E here. Then it got measured. The badge sits on a blurred
     brightness(0.32) photo, and `.hero-section` keeps that photo in both themes,
     so the backdrop is dark either way: across the four carousel slides the
     brightest tenth of it puts #F8A98A between 7.34 and 10.21, and #F79A7E, being
     the darker coral, between 6.57 and 9.14. Both clear 4.5. The rewrite bought
     nothing in light and cost contrast in dark, so it is gone. */
  [H, "fontSize: 11, background: '#EF4444'", "fontSize: 11, background: 'var(--red-solid)'", 1],

  /* The primary CTA. A gradient fill, so `--blue-solid` does not reach it and
     the flat-fill sweep above walked straight past it — the lighter stop is the
     same #2599F6 under the same white ink, 3.01 at 16px w700. Caught only once
     the audit learned to resolve a gradient into its stops instead of filing
     the whole element under "over art". */
  [H, "background: 'linear-gradient(135deg, #2599F6 0%, #1e7fd4 100%)', fontSize: 16",
      "background: 'var(--blue-solid-grad)', fontSize: 16", 1],

  // ── Social icons (footer, themed) ────────────────────────────────────
  [S, "hover: 'rgba(255,255,255,0.9)'", "hover: 'var(--ink-90)'", 1],
  [S, "hover: '#E1306C'", "hover: 'var(--ig-ink)'", 1],
  [S, "hover: '#69C9D0'", "hover: 'var(--tt-ink)'", 1],
  [S, "hover: '#FF0000'", "hover: 'var(--yt-ink)'", 1],
  [S, "background: 'rgba(255,255,255,0.06)'", "background: 'rgba(var(--ink-rgb),0.06)'", 1],
  [S, "border: '1px solid rgba(255,255,255,0.07)'", "border: '1px solid var(--line)'", 1],
  [S, "color: '#7A8FB8'", "color: 'var(--muted)'", 1],
  [S, "el.style.color = '#7A8FB8'", "el.style.color = 'var(--muted)'", 1],
  [S, "el.style.background = 'rgba(255,255,255,0.1)'", "el.style.background = 'rgba(var(--ink-rgb),0.1)'", 1],
  [S, "el.style.background = 'rgba(255,255,255,0.06)'", "el.style.background = 'rgba(var(--ink-rgb),0.06)'", 1],
];

/** Literals that must be gone from a file once the pass has run. */
const RESIDUAL = [
  [L, "#7A8FB8", 1], // the one pinned exception, and nothing else
  [L, "#0C1121", 1], // footer logo tile
  [L, "#111830", 1], // inside the always-covered gradient
  [L, "#18223C", 1], // same gradient
  [L, "#07091A", 0],
  [L, "text-white", 8], // the eight on photos and solid accents
  [L, "hover:text-white", 0],
  [S, "#7A8FB8", 0],
  [S, "rgba(255,255,255", 0],
  [H, "#F8A98A", 1], // the hero badge coral, measured and left alone
  [H, "#EF4444", 0], // the LIVE chip is on --red-solid now
  [L, "#EF4444", 0], // and so is the other one
  /* Two #2599F6 survive on Landing and neither is a solid fill under white:
     the ✳ role glyph over a creator photo, and the footer logo mark. */
  [L, "#2599F6", 2],
  /* One survives on Hero, and it is the same shape of exception: the headline's
     highlighted word, where the gradient is clipped to the glyph. The gradient
     is the ink there, not the ground under it, so `--blue-solid-grad` — which
     exists to carry white ink — is the wrong token for it. */
  [H, "#2599F6", 1],
  [H, "var(--blue-solid-grad)", 1],
];

/** Invariants for the one file this pass does not own.
 *
 *  Nav was rewritten by hand. Asserting it anyway is the point — "rewritten by
 *  hand" is exactly the state a later edit drifts out of. Two `text-white`
 *  survive, on the solid #2599F6 pills where white is the correct ink in either
 *  palette; no `hover:text-white`, which is now `.nav-link:hover`.
 *
 *  These are separate from RESIDUAL because they are true of the shipped tree
 *  and false of a replay against the baseline, which by definition has not had
 *  the hand rewrite applied. Mixing the two made the replay unrunnable. */
const HAND = [
  [N, "text-white", 2],
  [N, "hover:text-white", 0],
  [N, "data-solid={", 1],
  /* Three solid `Start Creating` fills — desktop rest, desktop mouse-leave, and
     the one in the mobile sheet — plus the darker hover. Same 3.01 failure as
     the two on Landing, same token. No bare #2599F6 left; the logo `<g fill>`
     is the only brand blue in this file and it is a mark, not a fill under
     white ink. */
  [N, "var(--blue-solid)'", 3],
  [N, "var(--blue-solid-hover)'", 1],
  [N, "'#2599F6'", 0],
];

const cache = new Map();
const read = (f) => {
  if (!cache.has(f)) cache.set(f, readFileSync(join(ROOT, f), "utf8"));
  return cache.get(f);
};

const count = (hay, needle) => hay.split(needle).length - 1;

let failed = 0;
for (const [file, search, replace, expected] of RESIDUAL_ONLY ? [] : EDITS) {
  const src = read(file);
  const n = count(src, search);
  if (n !== expected) {
    console.error(`✗ ${file}  expected ${expected}, found ${n}\n    ${JSON.stringify(search)}`);
    failed++;
    continue;
  }
  cache.set(file, src.split(search).join(replace));
  console.log(`✓ ${String(n).padStart(2)} × ${file}  ${JSON.stringify(search.slice(0, 62))}`);
}

if (failed) {
  console.error(`\n${failed} entr${failed === 1 ? "y" : "ies"} did not match. Nothing written.`);
  process.exit(1);
}

/* The hand invariants only mean anything against the real tree. */
const CHECKS = process.env.TOKENISE_ROOT ? RESIDUAL : [...RESIDUAL, ...HAND];
for (const [file, literal, expected] of CHECKS) {
  const n = count(read(file), literal);
  if (n !== expected) {
    console.error(`✗ residual ${JSON.stringify(literal)} in ${file}: expected ${expected}, found ${n}`);
    failed++;
  }
}

if (failed) {
  console.error(`\nResidual check failed. Nothing written.`);
  process.exit(1);
}

if (RESIDUAL_ONLY) {
  console.log(`${CHECKS.length} residual checks clean in ${ROOT}`);
} else {
  for (const [file, text] of cache) writeFileSync(join(ROOT, file), text);
  console.log(`\n${EDITS.length} edits applied across ${cache.size} files; ${CHECKS.length} residual checks clean.`);
}
