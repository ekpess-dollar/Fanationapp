/**
 * Attach a measured `sizes` to every `<Photo>` in the client, once.
 *
 *   node tools/wire-sizes.mjs
 *
 * Twenty call sites across thirteen files, each needing a different string, and
 * each string chosen from a box that `tools/boxes.mjs` measured rather than one
 * read off the stylesheet. Doing that by hand is twenty chances to paste the
 * wrong key into the wrong file and no way to notice — a wrong `sizes` does not
 * throw, it just quietly fetches the wrong rung forever.
 *
 * So the mapping is data, the edit asserts it matched exactly once, and the
 * script refuses to write anything if a single entry is off. It is disposable —
 * it runs once and the result is the commit — but it is committed anyway,
 * because it is also the record of which box each call site was measured at.
 *
 * Not a global replace. Every entry names its file and its exact source text,
 * and a count that is not 1 aborts the whole run before a byte is written.
 */

import { readFileSync, writeFileSync } from "node:fs";

const R = "client/src/";

/* The `sizes` per call site. The key is a layout in `SIZES`, not a page —
   collections and explore paint the same `.g3` tile and share one string. The
   comment on each row is the box measured at 1440, then at 390. */
const PHOTOS = [
  ["components/auth.tsx", "<Photo src={mediaFor(cat, n)} seed={`${cat}${n}`} />", "authTile"],            // 260 / 204
  ["components/modals.tsx", '<Photo src={myMediaFor(1)} seed="composeMedia" />', "modal"],                // 388 / full
  ["components/post-card.tsx", '<Photo src={src} seed={p.seed} alt="" radius={14} />', "feedCard"],       // 602 / 328
  ["components/post-card.tsx", "<Photo src={postMediaFor(p)} seed={p.seed} blur={10} scale={1.12} />", "feedCard"],
  ["components/post-card.tsx", "<Photo src={postMediaFor(p)} seed={p.seed} radius={14} />", "feedCard"],
  ["routes/reels.tsx", "<Photo src={still} seed={c.id} />", "reel"],                                      // 432 / 390
  ["routes/live.tsx", '<Photo src={still} seed="liveelena" blur={30} scale={1.2} />', "stage"],           // 818 / 364
  ["routes/live.tsx", '<Photo src={still} seed="liveelena" />', "stage"],
  ["routes/collections.tsx", "<Photo src={postMediaFor(p)} seed={`sv${p.id}`} blur={lk ? 10 : undefined} scale={lk ? 1.12 : undefined} />", "g3"], // 363 / 364
  ["routes/messages.tsx", "<Photo src={dmShot} seed={`dm${creator.id}`} />", "dm"],                       // 278 fixed
  ["routes/messages.tsx", "<Photo src={dmShot} seed={`dm${creator.id}`} blur={9} scale={1.12} />", "dm"],
  ["routes/feed.tsx", "<Photo src={still} seed={c.id} radius={22} />", "story"],                          // 380 fixed
  ["routes/creator.tsx", "<Photo src={coverFor(c.handle)} seed={c.id} />", "cover"],                      // 1192 / 390
  ["routes/creator.tsx", "<Photo src={gridFor(c.handle, i)} seed={`prof${i}`} />", "profileGrid"],        // 200 / 366
  ["routes/studio/live.tsx", '<Photo src={camStill} seed="mystream" />', "studioStage"],                  // 667 / full
  ["routes/studio/content.tsx", '<Photo src={myMediaFor(0)} seed="studioMedia" />', "feedCard"],          // 613 / full
  ["routes/studio/content.tsx", "<Photo src={myMediaFor(fhash(c[0]))} seed={`pub${i}${c[0]}`} />", "g4"], // 268 / 364
  ["routes/studio/vault.tsx", "<Photo radius={12} seed={`v${x.id}`} src={coverFor(x)} />", "g5"],         // 216 / 177
  ["routes/explore.tsx", "<Photo src={mediaFor(poolFor(c.handle), 0)} seed={c.id} />", "rail"],           // 198 fixed
  ["routes/explore.tsx", "<Photo src={mediaFor(poolFor(c.handle), 1)} seed={c.id} />", "g3"],             // 361 / 364
];

/* `SIZES` sorts into the capitalised group of each import, which is alphabetical
   case-insensitively — after Photo, and after Scrim where there is one. */
const IMPORTS = [
  ["components/auth.tsx", "{ Icon, Photo, mediaFor }", "{ Icon, Photo, SIZES, mediaFor }"],
  ["components/modals.tsx", "{ Avatar, Icon, Photo, Verified, myMediaFor }", "{ Avatar, Icon, Photo, SIZES, Verified, myMediaFor }"],
  ["components/post-card.tsx", "{ Avatar, Icon, Loop, Menu, Photo, Verified, postMediaFor, postVideoFor, useInView }", "{ Avatar, Icon, Loop, Menu, Photo, SIZES, Verified, postMediaFor, postVideoFor, useInView }"],
  ["routes/reels.tsx", "{ Avatar, Icon, Loop, Photo, Scrim, Verified, reelFor }", "{ Avatar, Icon, Loop, Photo, Scrim, SIZES, Verified, reelFor }"],
  ["routes/live.tsx", "{ Avatar, Icon, Loop, Photo, Verified, reelFor }", "{ Avatar, Icon, Loop, Photo, SIZES, Verified, reelFor }"],
  ["routes/collections.tsx", "{ Avatar, Icon, Photo, Verified, postMediaFor }", "{ Avatar, Icon, Photo, SIZES, Verified, postMediaFor }"],
  ["routes/messages.tsx", "{ Avatar, Icon, Menu, Photo, Verified, mediaFor, poolFor }", "{ Avatar, Icon, Menu, Photo, SIZES, Verified, mediaFor, poolFor }"],
  ["routes/feed.tsx", "{ Avatar, CoinBadge, Icon, Loop, Photo, Verified, reelFor }", "{ Avatar, CoinBadge, Icon, Loop, Photo, SIZES, Verified, reelFor }"],
  ["routes/creator.tsx", "{ Avatar, Icon, Photo, Verified, coverFor, gridFor }", "{ Avatar, Icon, Photo, SIZES, Verified, coverFor, gridFor }"],
  ["routes/studio/live.tsx", "{ Icon, Loop, Photo, loopFor, mediaFor }", "{ Icon, Loop, Photo, SIZES, loopFor, mediaFor }"],
  ["routes/studio/content.tsx", "{ Icon, Menu, Photo, myMediaFor }", "{ Icon, Menu, Photo, SIZES, myMediaFor }"],
  ["routes/studio/vault.tsx", "{ Icon, MOTION_STILLS, Photo, mediaFor, myMediaFor }", "{ Icon, MOTION_STILLS, Photo, SIZES, mediaFor, myMediaFor }"],
  ["routes/explore.tsx", "{ Avatar, Icon, Photo, Scrim, Verified, mediaFor, poolFor }", "{ Avatar, Icon, Photo, Scrim, SIZES, Verified, mediaFor, poolFor }"],
];

const count = (hay, needle) => hay.split(needle).length - 1;

/* Read every file once, apply every edit in memory, and only write at the end.
   A half-applied pass across thirteen files is worse than none. */
const files = new Map();
const read = (rel) => {
  if (!files.has(rel)) files.set(rel, readFileSync(R + rel, "utf8"));
  return files.get(rel);
};

const fail = [];
const applied = [];

for (const [rel, from, to] of IMPORTS) {
  const src = read(rel);
  const n = count(src, from);
  if (n !== 1) { fail.push(`import ×${n} (want 1)  ${rel}  ${from}`); continue; }
  files.set(rel, src.replace(from, to));
  applied.push(`  import  ${rel}`);
}

for (const [rel, from, key] of PHOTOS) {
  const src = read(rel);
  const n = count(src, from);
  if (n !== 1) { fail.push(`photo ×${n} (want 1)  ${rel}  ${from}`); continue; }
  /* `sizes` goes next to `src`, because together they are the pair the browser
     resolves the candidate from. Everything after them is paint. */
  const to = from.replace(/^<Photo /, `<Photo sizes={SIZES.${key}} `);
  files.set(rel, src.replace(from, to));
  applied.push(`  sizes   ${rel.padEnd(28)} SIZES.${key}`);
}

if (fail.length) {
  console.error(`\n  ABORTED — ${fail.length} edit(s) did not match exactly once:\n`);
  for (const f of fail) console.error(`    ${f}`);
  console.error("");
  process.exit(1);
}

for (const [rel, src] of files) writeFileSync(R + rel, src);
console.log(applied.join("\n"));
console.log(`\n  ${IMPORTS.length} import(s) · ${PHOTOS.length} call site(s) · ${files.size} file(s) written\n`);
