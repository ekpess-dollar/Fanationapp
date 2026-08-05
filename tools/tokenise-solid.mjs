/* Switch the four rules that paint white ink on a brand accent over to the
   `-solid` tokens.
 *
 *  These are the inverse of the `-ink` case. `-ink` darkens an accent so it can
 *  be *read* on a light surface; here the accent IS the surface and #fff is the
 *  glyph on top of it. In light, white on --red is 3.76 and on the two --grad
 *  endpoints 3.02 and 3.01 — every one of these labels is 11–14px, nowhere near
 *  the 24px that would let the 3:1 large-text bar apply, so all four fail
 *  WCAG 1.4.3. Darkening --red or --grad at source would have dragged along
 *  every tint, border and shadow derived from them, which is the same reason
 *  --blue-ink exists rather than a darker --blue.
 *
 *  --red-solid and --grad-solid alias their base exactly in dark, so this pass
 *  cannot move a dark-mode pixel. darkdiff is what proves that, not this file —
 *  Chrome serialises linear-gradient differently depending on whether the stop
 *  arrived literally or through var(), so a diff of the computed style is the
 *  only thing that settles it.
 *
 *  .btn-blue is deliberately absent. Its ink is #04122a, not #fff, and that
 *  measures 6.19 on --blue. Nothing to fix.
 *
 *  Counted edits, not sed. Every entry states how many matches it expects and
 *  the run aborts on the first mismatch, so a rule that has already moved, or
 *  one that was reworded since this was written, fails loudly instead of
 *  silently matching nothing.
 *
 *  Re-runnable in the same two modes as tokenise-landing.mjs:
 *    TOKENISE_ROOT=/path/to/baseline node tools/tokenise-solid.mjs
 *    node tools/tokenise-solid.mjs --residual
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.env.TOKENISE_ROOT
  ? process.env.TOKENISE_ROOT.replace(/\/?$/, "/")
  : new URL("../", import.meta.url).pathname;
const RESIDUAL_ONLY = process.argv.includes("--residual");

const C = "client/src/lib/ui/styles.css";
const A = "admin/src/lib/ui/styles.css";

/** @type {[file: string, search: string, replace: string, expected: number][]} */
const EDITS = [];

/* The same four rules exist in both stylesheets at the same line numbers. The
   two files are not byte-identical overall — they have diverged elsewhere — so
   each gets its own asserted pass rather than a copy. */
for (const F of [C, A]) {
  EDITS.push(
    // 13px/14px white on the coral→blue bar. Six call sites in client, none in
    // admin, but the rule lives in both stylesheets so both move together.
    [F, ".btn-grad{background:var(--grad);", ".btn-grad{background:var(--grad-solid);", 1],

    // 14px white on --red. `End stream` in the creator studio, and the confirm
    // in the report modal.
    [F, ".btn-red{background:var(--red);", ".btn-red{background:var(--red-solid);", 1],

    // 11px white, bold, on --red. The LIVE chip — reels, explore, creator
    // profile, the live room and the studio's own broadcast tile.
    [F, ".badge-live{display:inline-flex;align-items:center;gap:6px;background:var(--red);",
        ".badge-live{display:inline-flex;align-items:center;gap:6px;background:var(--red-solid);", 1],

    // 12px white on the bar again. Easy to grep past and conclude is dead: the
    // class never appears as a literal anywhere, because every call site builds
    // it by concatenation — className={"tag" + (vis === v ? " on" : "")}. It is
    // the selected chip on every filter and segment row, eight of them in client
    // and four in admin, and the audit sees it painted on nine routes.
    [F, ".tag.on{background:var(--grad);", ".tag.on{background:var(--grad-solid);", 1],
  );
}

/** Literals that must be gone, and survivors that are deliberate. */
const RESIDUAL = [];
for (const F of [C, A]) {
  RESIDUAL.push(
    [F, "background:var(--grad-solid)", 2], // .btn-grad and .tag.on
    [F, "background:var(--red-solid)", 2],  // .btn-red and .badge-live
    /* --grad survives as a fill on things that carry no text of their own, and
       as `-webkit-background-clip:text` gradient type, where the gradient is
       the glyph rather than the ground under one. Those are unaffected by ink
       contrast and must not move. */
    [F, "background:var(--red);", 0],
    /* --blue keeps its solid button: #04122a on #2599f6 is 6.19. */
    [F, ".btn-blue{background:var(--blue);color:#04122a;", 1],
  );
}

const cache = new Map();
const read = (file) => {
  if (!cache.has(file)) cache.set(file, readFileSync(join(ROOT, file), "utf8"));
  return cache.get(file);
};

let failed = 0;

for (const [file, search, replace, expected] of RESIDUAL_ONLY ? [] : EDITS) {
  const before = read(file);
  const found = before.split(search).length - 1;
  if (found !== expected) {
    console.error(`✗ ${file}: "${search.slice(0, 56)}…" expected ${expected}, found ${found}`);
    failed++;
    continue;
  }
  cache.set(file, before.split(search).join(replace));
}

if (failed) {
  console.error(`\n${failed} edit(s) did not match. Nothing written.`);
  process.exit(1);
}

if (!RESIDUAL_ONLY) for (const [file, text] of cache) writeFileSync(join(ROOT, file), text);

/* Re-read from disk so the residual pass checks what was actually written,
   not the in-memory copy that produced it. */
cache.clear();
for (const [file, literal, expected] of RESIDUAL) {
  const found = read(file).split(literal).length - 1;
  if (found !== expected) {
    console.error(`✗ residual "${literal.slice(0, 56)}…" in ${file}: expected ${expected}, found ${found}`);
    failed++;
  }
}

if (failed) process.exit(1);

console.log(
  RESIDUAL_ONLY
    ? `${RESIDUAL.length} residual checks clean in ${ROOT}`
    : `${EDITS.length} edits applied across ${cache.size} files; ${RESIDUAL.length} residual checks clean.`,
);
