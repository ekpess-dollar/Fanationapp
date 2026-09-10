#!/usr/bin/env node
/* Fanation media build.
 *
 * Reads manifest.json, pulls every photograph once into a local .cache, derives
 * every crop the projects need, synthesises the video loops, and emits
 * `src/lib/brand/media.ts` — the generated table the resolvers read.
 *
 * The client and admin projects are independent and each vendors its own copy of
 * the shared layer, so the generated table is written to BOTH. That is the point
 * of this script: the duplication is generated, never hand-maintained.
 *
 * Why the media is bundled in-repo rather than hot-linked: a demo has to survive
 * a boardroom wifi and a CDN having a bad day. Every byte the prototype paints
 * ships with the prototype.
 *
 *   node tools/brand-assets/build.mjs          # incremental, uses .cache
 *   node tools/brand-assets/build.mjs --clean  # re-derive every output
 *
 * Requires NODE_EXTRA_CA_CERTS to be set in this container for fetch() to work.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const CACHE = path.join(HERE, ".cache");
const WEB = path.join(ROOT, "client/public/img");
const ADMIN = path.join(ROOT, "admin/public/img");
/* Written to both projects — see the note at the top of the file. */
const OUT_TS = [
  path.join(ROOT, "client/src/lib/brand/media.ts"),
  path.join(ROOT, "admin/src/lib/brand/media.ts"),
];

const MAN = JSON.parse(fs.readFileSync(path.join(HERE, "manifest.json"), "utf8"));
const CLEAN = process.argv.includes("--clean");

const mk = (d) => fs.mkdirSync(d, { recursive: true });
const sh = (cmd, args) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
let fetched = 0;
let derived = 0;
let skipped = 0;

/* ---------------- 1. Fetch ----------------
   One network round trip per (photo, crop) pair, ever. The cache key carries the
   crop because a 9:16 entropy crop and a 3:1 entropy crop of the same photograph
   are different pictures, and we want the still and its video loop to agree on
   the framing — same aspect ratio in, same region out. */

async function grab(id, cropKey) {
  const key = `${id}__${cropKey}.jpg`;
  const dst = path.join(CACHE, key);
  if (fs.existsSync(dst) && fs.statSync(dst).size > 2000) {
    skipped++;
    return dst;
  }
  const url = `https://images.unsplash.com/photo-${id}?${MAN.crops[cropKey]}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch ${id} (${cropKey}) → HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 2000) throw new Error(`fetch ${id} (${cropKey}) → ${buf.length} bytes, too small to be a photograph`);
  fs.writeFileSync(dst, buf);
  fetched++;
  return dst;
}

/* ---------------- Derive ---------------- */

function webp(src, out, quality) {
  if (!CLEAN && fs.existsSync(out)) return out;
  mk(path.dirname(out));
  sh("convert", [src, "-strip", "-quality", String(quality), out]);
  derived++;
  return out;
}

/* A local landing photograph is a portrait of unknown aspect. Fill a square from
   the top of the frame — in a standing portrait the face lives in the upper
   third, and cropping from the centre decapitates people. */
function squareFromFile(src, out, quality, gravity = "north") {
  if (!CLEAN && fs.existsSync(out)) return out;
  mk(path.dirname(out));
  sh("convert", [
    src, "-auto-orient", "-gravity", gravity,
    "-resize", "320x320^", "-extent", "320x320",
    "-strip", "-quality", String(quality), out,
  ]);
  derived++;
  return out;
}

/* ---------------- Motion ----------------
   There is no video CDN behind this prototype, so a "video post" is a slow
   ken-burns move synthesised from its own still. It reads as motion in a feed,
   it loops seamlessly enough at four seconds, and it costs ~200 KB. Direction
   alternates so a screen full of them does not pulse in unison.

   These carry no audio track (-an). The reel sound toggle is wired and works;
   there is simply nothing to hear. Flagged in the handover. */
function loop(src, out, w, h, zoomOut) {
  if (!CLEAN && fs.existsSync(out)) return out;
  mk(path.dirname(out));
  const { frames, fps, crf } = MAN.video;
  const z = zoomOut
    ? `if(lte(on,1),1.18,max(zoom-${(0.18 / (frames - 1)).toFixed(6)},1.001))`
    : `min(zoom+${(0.18 / (frames - 1)).toFixed(6)},1.18)`;
  const vf = [
    `scale=${w * 2}:${h * 2}:force_original_aspect_ratio=increase`,
    `crop=${w * 2}:${h * 2}`,
    `zoompan=z='${z}':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${w}x${h}:fps=${fps}`,
    "format=yuv420p",
  ].join(",");
  sh("ffmpeg", [
    "-y", "-v", "error", "-i", src, "-vf", vf,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", String(crf),
    "-movflags", "+faststart", "-an", out,
  ]);
  derived++;
  return out;
}

/* ---------------- main ---------------- */

const Q = MAN.quality;
const AVATARS = {};        // display name  -> /img/a/<slug>.webp
const CATEGORY_MEDIA = {}; // cat           -> [/img/m/<cat>-<i>.webp]
const CREATOR_POOLS = {};  // handle        -> cat
const CREATOR_SLUGS = {};  // handle        -> slug
const CREATOR_NAMES = {};  // handle        -> display name
const REEL_STILLS = {};    // handle        -> /img/r/<slug>.webp
const REEL_LOOPS = {};     // handle        -> /img/r/<slug>.mp4
const COVERS = {};         // handle        -> /img/c/<slug>.webp
const MEDIA_VIDEOS = {};   // still path    -> /img/v/<cat>-<i>.mp4
const REEL_IN_POOL = {};   // handle        -> /img/m/<cat>-<i>.webp, when it exists
const FALLBACK_FACES = [];
const EVIDENCE = {};

async function main() {
  mk(CACHE);
  for (const d of ["a", "m", "r", "c", "v"]) mk(path.join(WEB, d));
  for (const d of ["a", "e"]) mk(path.join(ADMIN, d));

  /* ---- 2. Avatars ----
     Every avatar lands in both apps. Admin moderates the same people the app
     shows, and a reviewer looking at a report should see the same face the fan
     saw. Duplicating 21 small files beats making admin reach into web's public
     directory, which no bundler would honour anyway. */
  const named = [
    ...Object.entries(MAN.creators).map(([slug, c]) => [c.name, { slug, ...c.avatar }]),
    ...Object.entries(MAN.extraAvatars).map(([name, a]) => [name, a]),
  ];
  for (const [name, a] of named) {
    const rel = `a/${a.slug}.webp`;
    const w = path.join(WEB, rel);
    if (a.file) squareFromFile(path.join(ROOT, a.file), w, Q.avatar, a.gravity);
    else webp(await grab(a.id, "avatar"), w, Q.avatar);
    const adm = path.join(ADMIN, rel);
    if (CLEAN || !fs.existsSync(adm)) {
      mk(path.dirname(adm));
      fs.copyFileSync(w, adm);
    }
    AVATARS[name] = `/img/${rel}`;
  }

  /* Unnamed people — comment authors, fans in the CRM, faces in a stack. They
     resolve by hash of their name, so a given fan keeps the same face for the
     life of the session rather than reshuffling on every render. */
  for (let i = 0; i < MAN.fallbackFaces.length; i++) {
    const rel = `a/f${String(i).padStart(2, "0")}.webp`;
    const w = path.join(WEB, rel);
    webp(await grab(MAN.fallbackFaces[i], "avatar"), w, Q.avatar);
    const adm = path.join(ADMIN, rel);
    if (CLEAN || !fs.existsSync(adm)) fs.copyFileSync(w, adm);
    FALLBACK_FACES.push(`/img/${rel}`);
  }

  /* ---- 3. Post media + covers ---- */
  const motion = new Set(MAN.motionMedia);
  for (const [cat, ids] of Object.entries(MAN.categories)) {
    CATEGORY_MEDIA[cat] = [];
    for (let i = 0; i < ids.length; i++) {
      const rel = `m/${cat}-${i}.webp`;
      webp(await grab(ids[i], "media"), path.join(WEB, rel), Q.media);
      CATEGORY_MEDIA[cat].push(`/img/${rel}`);
    }
  }
  for (const [slug, c] of Object.entries(MAN.creators)) {
    CREATOR_POOLS[c.handle] = c.cat;
    CREATOR_SLUGS[c.handle] = slug;
    CREATOR_NAMES[c.handle] = c.name;
    const id = MAN.categories[c.cat][MAN.coverFrom];
    const rel = `c/${slug}.webp`;
    webp(await grab(id, "cover"), path.join(WEB, rel), Q.cover);
    COVERS[c.handle] = `/img/${rel}`;

    /* If a creator's reel photograph also sits in their own post pool, the feed
       would show the same picture twice under the same name — once as a reel
       and once as a post — which reads as an asset shortage rather than as a
       creator reposting their own clip. Record the collision here, at the only
       point where the reel id and the pool are both in hand, so the resolver
       can deal around it instead of the two files having to agree by luck. */
    const clash = MAN.categories[c.cat].indexOf(c.reel);
    if (clash !== -1) REEL_IN_POOL[c.handle] = CATEGORY_MEDIA[c.cat][clash];
  }

  /* ---- 4. Reels ----
     A dedicated 9:16 source per creator, hand-picked rather than hashed out of
     the post pool. A reel is the one surface where the photograph is the whole
     screen, so it cannot be a landscape frame with its sides thrown away. */
  let n = 0;
  for (const [slug, c] of Object.entries(MAN.creators)) {
    const still = `r/${slug}.webp`;
    webp(await grab(c.reel, "reel"), path.join(WEB, still), Q.reel);
    const mp4 = `r/${slug}.mp4`;
    loop(await grab(c.reel, "reelMotion"), path.join(WEB, mp4),
      MAN.video.reel.w, MAN.video.reel.h, n % 2 === 1);
    REEL_STILLS[c.handle] = `/img/${still}`;
    REEL_LOOPS[c.handle] = `/img/${mp4}`;
    n++;
  }

  /* ---- 4b. Motion for feed video posts ----
     SEED_FEED contains exactly nine video posts. Each one is declared here, by
     the still it belongs to, so every video post is guaranteed a loop instead of
     hoping the resolver lands on one. */
  let m = 0;
  for (const key of MAN.motionMedia) {
    const [cat, i] = key.split("-");
    const id = MAN.categories[cat][Number(i)];
    if (!id) throw new Error(`motionMedia "${key}" does not exist in categories`);
    const rel = `v/${key}.mp4`;
    loop(await grab(id, "mediaMotion"), path.join(WEB, rel),
      MAN.video.media.w, MAN.video.media.h, m % 2 === 1);
    MEDIA_VIDEOS[`/img/m/${cat}-${i}.webp`] = `/img/${rel}`;
    m++;
  }

  /* ---- 4c. Admin evidence ----
     Admin needs two photographs and only two. Copying web's 5 MB media tree into
     the admin bundle to reach them would be absurd, so each exhibit is declared
     and derived on its own. */
  for (const e of MAN.adminEvidence) {
    const rel = `e/${e.out}.webp`;
    webp(await grab(e.id, e.crop), path.join(ADMIN, rel), Q.evidence);
    EVIDENCE[e.out] = `/img/${rel}`;
  }

  /* ---- 5. Emit ---- */
  const j = (v) => JSON.stringify(v, null, 2);
  const ts = `/* GENERATED FILE — do not edit.
 * Produced by tools/brand-assets/build.mjs from tools/brand-assets/manifest.json.
 * Re-run:  node tools/brand-assets/build.mjs
 *
 * Paths are root-absolute public paths, identical in client and admin, so a
 * component that renders a face does not need to know which project it is inside.
 */

/** Display name → portrait. The signed-in user's name is literally "You". */
export const AVATARS: Record<string, string> = ${j(AVATARS)};

/** Faces for people the seed data names but does not model — commenters, fans. */
export const FALLBACK_FACES: string[] = ${j(FALLBACK_FACES)};

/** Category → its five post photographs, in manifest order. */
export const CATEGORY_MEDIA: Record<string, string[]> = ${j(CATEGORY_MEDIA)};

/** Creator handle → the category their posts are drawn from. */
export const CREATOR_POOLS: Record<string, string> = ${j(CREATOR_POOLS)};

/** Creator handle → short slug, for file lookups. */
export const CREATOR_SLUGS: Record<string, string> = ${j(CREATOR_SLUGS)};

/** Creator handle → display name, so a handle alone can find an avatar. */
export const CREATOR_NAMES: Record<string, string> = ${j(CREATOR_NAMES)};

/** Creator handle → 9:16 reel still, and its motion loop. */
export const REEL_STILLS: Record<string, string> = ${j(REEL_STILLS)};
export const REEL_LOOPS: Record<string, string> = ${j(REEL_LOOPS)};

/** Creator handle → 3:1 profile cover. */
export const COVERS: Record<string, string> = ${j(COVERS)};

/** Post still → the loop that plays in its place. Only the nine video posts. */
export const MEDIA_VIDEOS: Record<string, string> = ${j(MEDIA_VIDEOS)};

/**
 * Creator handle → a post photograph that is the same picture as their reel.
 * Empty means no creator's reel is also in their own post pool, which is the
 * state the current manifest is curated into. The resolver deals around
 * anything listed here so one photograph never appears twice under one name.
 */
export const REEL_IN_POOL: Record<string, string> = ${j(REEL_IN_POOL)};

/** Moderation exhibits, admin only. */
export const EVIDENCE: Record<string, string> = ${j(EVIDENCE)};
`;
  for (const out of OUT_TS) fs.writeFileSync(out, ts);

  const count = (d) => (fs.existsSync(d) ? fs.readdirSync(d).length : 0);
  const bytes = (d) =>
    !fs.existsSync(d) ? 0 : fs.readdirSync(d).reduce((s, f) => s + fs.statSync(path.join(d, f)).size, 0);
  const dirs = [
    ["client a", path.join(WEB, "a")], ["client m", path.join(WEB, "m")],
    ["client r", path.join(WEB, "r")], ["client c", path.join(WEB, "c")],
    ["client v", path.join(WEB, "v")], ["admin  a", path.join(ADMIN, "a")],
    ["admin  e", path.join(ADMIN, "e")],
  ];
  let total = 0;
  console.log(`\nfetched ${fetched}  cached ${skipped}  derived ${derived}\n`);
  for (const [label, d] of dirs) {
    total += bytes(d);
    console.log(`  ${label}  ${String(count(d)).padStart(3)} files  ${(bytes(d) / 1048576).toFixed(2)} MB`);
  }
  console.log(`\n  total    ${(total / 1048576).toFixed(2)} MB`);
  for (const out of OUT_TS) console.log(`  emitted  ${path.relative(ROOT, out)}`);
  console.log("");
}

main().catch((e) => {
  console.error("\nBUILD FAILED:", e.message);
  process.exit(1);
});
