/**
 * Picture resolvers.
 *
 * `lib/brand` owns *which* photographs exist and who they belong to. This file
 * owns the question the pages actually ask: given a post, a handle or a bare
 * name, which file do I paint? It sits in `lib/ui` because that is what pages
 * import — they reach `lib/brand` only through the re-export at the bottom of
 * `lib/ui/index.tsx`.
 *
 * Everything here is deterministic — `fhash` is the only source of variation and
 * it is a pure function of the input string. The same post resolves to the same
 * photograph on every render and on every reload.
 */

import { fhash, SEED_FEED } from "@/lib/core";
import type { Post } from "@/lib/core";
import {
  AVATARS,
  FALLBACK_FACES,
  CATEGORY_MEDIA,
  CREATOR_POOLS,
  CREATOR_NAMES,
  REEL_STILLS,
  REEL_LOOPS,
  REEL_IN_POOL,
  COVERS,
  MEDIA_VIDEOS,
  EVIDENCE,
} from "@/lib/brand";

export {
  AVATARS,
  FALLBACK_FACES,
  CATEGORY_MEDIA,
  CREATOR_POOLS,
  CREATOR_NAMES,
  REEL_STILLS,
  REEL_LOOPS,
  COVERS,
  MEDIA_VIDEOS,
  EVIDENCE,
};

/**
 * The widths each asset directory has been cut to, and how wide the original is.
 *
 * `tools/variants.mjs` writes those files; this is the same list a second time
 * and nothing enforces that the two agree. They have to, because a `srcset`
 * fails hard: a `w`-descriptor candidate that 404s does not fall back to
 * another rung, the <img> fires onerror and paints nothing at all. Run
 * `node tools/variants.mjs --check` after touching either side.
 *
 * The originals carry no width in their filename, so they are named separately
 * rather than sitting at the end of the rung list.
 */
const RUNGS: Record<string, number[]> = {
  a: [112, 208],
  c: [480, 960],
  m: [320, 560, 800],
  r: [400],
};

const INTRINSIC: Record<string, number> = { a: 320, c: 1500, m: 1100, r: 720 };

/**
 * `sizes` per layout, not per call site.
 *
 * Several pages put a photograph in the same box — collections and explore both
 * paint a `.g3` tile at the full content width — and naming the layout rather
 * than the page is what lets one string serve both and stay true when the grid
 * moves. Measured with `tools/boxes.mjs` at 1440 and 390 rather than read off
 * the stylesheet, because the boxes are nested percentages of a max-width
 * container and reading those is guessing.
 *
 * The breakpoints are the real ones — 900 where the sidebar leaves and the
 * split stacks, 560 where the grids collapse to one or two columns. The vw
 * figures deliberately round up: over-declaring costs a rung, under-declaring
 * costs sharpness, and only one of those is visible.
 */
export const SIZES = {
  /** A tile in the drifting mosaic behind sign-in and sign-up. */
  authTile: "(max-width: 900px) 210px, 260px",
  /** A post card in the feed, and the studio's attachment well beside it. */
  feedCard: "(max-width: 900px) 96vw, 620px",
  /** A `.g3` tile at the full content width — collections, explore. */
  g3: "(max-width: 560px) 96vw, (max-width: 900px) 48vw, 370px",
  /** A `.g4` tile — the studio's published grid. */
  g4: "(max-width: 560px) 96vw, (max-width: 900px) 48vw, 270px",
  /** A `.g5` tile — the vault. */
  g5: "(max-width: 560px) 46vw, (max-width: 900px) 31vw, 220px",
  /** A `.g3` tile inside the profile's 620px column, which is narrower. */
  profileGrid: "(max-width: 560px) 96vw, (max-width: 900px) 48vw, 200px",
  /** The 3:1 strip over a profile — the one picture that runs edge to edge. */
  cover: "(max-width: 900px) 100vw, calc(100vw - 248px)",
  /** The live stage, and the blurred fill behind its 9:16 source. */
  stage: "(max-width: 900px) 96vw, 820px",
  /** The studio's camera preview. */
  studioStage: "(max-width: 900px) 96vw, 670px",
  /** A reel: the window height, turned into a 9:16 frame. */
  reel: "(max-width: 900px) 100vw, 540px",
  /** The story viewer, which is 380x640 at every width. */
  story: "380px",
  /** A card in the horizontal live rail on explore. */
  rail: "200px",
  /** An attachment in a DM thread, which is a fixed 280px card. */
  dm: "280px",
  /** The composer's attachment well, inside a 440px sheet. */
  modal: "(max-width: 900px) 96vw, 390px",
} as const;

/* Built once per path. The feed asks for the same handful of photographs on
   every render and the answer cannot change between those calls. */
const SRCSET_CACHE: Record<string, string> = {};

/**
 * The `srcset` for a photograph, or nothing if it has no rungs.
 *
 * A pure function of the path, deliberately — there is no manifest to keep in
 * step and no build step to couple to. Anything outside the four generated
 * directories returns undefined and behaves exactly as it does today, which is
 * also what a path that is already a rung does: the name group rejects a dot,
 * so `art-0.320.webp` cannot be laddered a second time.
 */
export function srcsetFor(src?: string): string | undefined {
  if (!src) return undefined;
  const cached = SRCSET_CACHE[src];
  if (cached !== undefined) return cached || undefined;

  const m = /^\/img\/([a-z]+)\/[^/.]+\.webp$/.exec(src);
  const dir = m && RUNGS[m[1]] ? m[1] : "";
  if (!dir) {
    SRCSET_CACHE[src] = "";
    return undefined;
  }
  const base = src.slice(0, -".webp".length);
  const out = RUNGS[dir]
    .map((w) => `${base}.${w}.webp ${w}w`)
    .concat(`${src} ${INTRINSIC[dir]}w`)
    .join(", ");
  SRCSET_CACHE[src] = out;
  return out;
}

/**
 * One rung, chosen for a box of a known width. For the places a `srcset` cannot
 * reach.
 *
 * `<video poster>` is the whole reason this exists. It takes a single URL and
 * has no srcset, no sizes and no `loading`, so the browser is given no way to
 * choose and simply fetches whatever it is handed — a 1100px photograph into a
 * 620px card, every time, on every screen. `<img>` solved this years ago;
 * `<video>` never did.
 *
 * So the choosing happens here instead, and it needs a measured width rather
 * than a declared one. That is the trade: a `sizes` string is a promise the
 * layout has to keep, and this is the layout reporting what it actually did.
 * The cost is that the caller cannot ask until the element exists, which is why
 * `Loop` holds the poster back for one layout tick — before paint, so nothing
 * flashes and nothing is fetched twice.
 *
 * Rounds up, never down: the rung has to cover the box or the poster is
 * visibly softer than the video that replaces it. A box wider than every rung
 * gets the original, which is exactly today's behaviour, and so does a path
 * outside the generated directories.
 *
 * The ratio is capped at 2, and that cap is the difference between this helping
 * on a phone and doing nothing there. A 328px feed card on a 3x screen asks for
 * 984 and the ladder's top rung is 800, so an uncapped rule hands back the
 * 1100px original and the phone pays 40 KB a card — measured, on exactly the
 * devices this market runs on. Capped, the same card takes the 800 at 2.44x its
 * box. Nobody has ever resolved the difference between 2.44x and 3x on a
 * five-inch screen, and this is a poster: a frame that is either covered by
 * video a moment later or sitting behind a play button. Sharpness that cannot
 * be seen is not worth 40 KB on a metered connection.
 */
export function rungFor(src: string | undefined, cssWidth: number): string | undefined {
  if (!src || !(cssWidth > 0)) return src;
  const m = /^\/img\/([a-z]+)\/[^/.]+\.webp$/.exec(src);
  const rungs = m && RUNGS[m[1]];
  if (!rungs) return src;

  const dpr = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  const need = cssWidth * dpr;
  const pick = rungs.find((w) => w >= need);
  return pick ? `${src.slice(0, -".webp".length)}.${pick}.webp` : src;
}

/** The category a creator we have never heard of gets dealt from. */
const DEFAULT_CAT = "life";

/**
 * A face for a name.
 *
 * Named people — the sixteen creators, the four commenters the seed data
 * models, and the signed-in user — have a portrait chosen for them. Everyone
 * else gets one of twenty-one stock faces, picked by hash, so the same fan in
 * the CRM keeps the same face on every render and across a reload. An empty
 * name resolves to nothing and the caller paints its initials disc instead.
 */
export function avatarFor(name?: string): string {
  if (!name) return "";
  const exact = AVATARS[name];
  if (exact) return exact;
  return FALLBACK_FACES[fhash(name) % FALLBACK_FACES.length];
}

/** A face for a handle, for the surfaces that only carry `@handle`. */
export function avatarForHandle(handle?: string): string {
  if (!handle) return "";
  const h = handle.replace(/^@/, "");
  const name = CREATOR_NAMES[h];
  return name ? avatarFor(name) : FALLBACK_FACES[fhash(h) % FALLBACK_FACES.length];
}

/** The pool a handle's work is drawn from. */
export function poolFor(handle?: string): string {
  const h = (handle || "").replace(/^@/, "");
  return CREATOR_POOLS[h] || DEFAULT_CAT;
}

/**
 * One photograph out of a category, by index. Wraps, so a caller may count
 * past the end of the pool without checking.
 */
export function mediaFor(cat: string, i = 0): string {
  const pool = CATEGORY_MEDIA[cat] || CATEGORY_MEDIA[DEFAULT_CAT];
  return pool[((i % pool.length) + pool.length) % pool.length];
}

/** A creator's 3:1 profile cover. */
export function coverFor(handle?: string): string {
  const h = (handle || "").replace(/^@/, "");
  return COVERS[h] || COVERS[Object.keys(COVERS)[fhash(h) % Object.keys(COVERS).length]];
}

/** A creator's 9:16 reel still and the loop that plays over it. */
export function reelFor(handle?: string): { still: string; loop: string } {
  const h = (handle || "").replace(/^@/, "");
  return { still: REEL_STILLS[h] || "", loop: REEL_LOOPS[h] || "" };
}

/** The motion loop behind a photograph, or "" if that frame is a still. */
export function loopFor(src: string): string {
  return MEDIA_VIDEOS[src] || "";
}

/** Every photograph that has footage behind it, in manifest order. */
export const MOTION_STILLS: string[] = Object.keys(MEDIA_VIDEOS);

/**
 * The signed-in creator's own library — the studio, the vault, the composer.
 *
 * "You" is not one of the sixteen, so there is no curated pool to draw from.
 * The studio surfaces deal from a rotation across categories instead, which is
 * both truer to a working creator's library and necessary for the geometry:
 * the vault renders five tiles to a row, and a single five-photograph pool
 * would put the same picture down every column. Six categories against five
 * photographs gives thirty distinct frames before anything repeats, and
 * consecutive tiles never share a category.
 */
const MY_CATS = ["life", "glow", "model", "trav", "art", "food"];

export function myMediaFor(i: number): string {
  const n = Math.abs(Math.floor(i));
  return mediaFor(MY_CATS[n % MY_CATS.length], Math.floor(n / MY_CATS.length));
}

/** Moderation exhibit by name. Admin only — the fan app never calls this. */
export function evidenceFor(key: string): string {
  return EVIDENCE[key] || "";
}

/**
 * The feed deal.
 *
 * Every post in `SEED_FEED` needs a photograph, and the same author owns
 * several posts. Hashing each post independently would repeat a picture inside
 * one author's run roughly as often as chance allows, which looks like a bug.
 * So the deal is done once, per author, round-robin over their category:
 * consecutive posts by the same creator always advance to the next photograph
 * in their pool and only wrap after all five are spent.
 *
 * Two constraints ride along:
 *
 *   1. A video post must land on a still that actually has a motion loop. The
 *      loops are declared in the manifest, so the video posts are dealt first,
 *      out of the author's motion-capable subset, before the image posts take
 *      what is left.
 *   2. A creator's own reel photograph is skipped, so one picture never appears
 *      twice under one name — once full-screen in reels, once again in the
 *      feed. `REEL_IN_POOL` is empty under the current manifest; the guard is
 *      here so it stays true if the curation changes.
 *
 * This runs once at module load and is pure, so the server and the client
 * arrive at the same answer.
 */
function deal(posts: Post[]): Record<string, string> {
  const out: Record<string, string> = {};
  const byAuthor: Record<string, Post[]> = {};
  for (const p of posts) (byAuthor[p.h] ||= []).push(p);

  for (const [handle, own] of Object.entries(byAuthor)) {
    const cat = poolFor(handle);
    const pool = (CATEGORY_MEDIA[cat] || CATEGORY_MEDIA[DEFAULT_CAT]).filter(
      (src) => src !== REEL_IN_POOL[handle],
    );
    const motion = pool.filter((src) => MEDIA_VIDEOS[src]);
    const stills = pool.filter((src) => !MEDIA_VIDEOS[src]);

    let mi = 0;
    let si = 0;
    for (const p of own) {
      if (p.type === "video" && motion.length) {
        out[p.id] = motion[mi++ % motion.length];
      } else if (stills.length) {
        out[p.id] = stills[si++ % stills.length];
      } else {
        out[p.id] = pool[si++ % pool.length];
      }
    }
  }
  return out;
}

/** Post id → photograph, dealt once at module load. */
export const FEED_MEDIA: Record<string, string> = deal(SEED_FEED);

/**
 * The photograph for a post.
 *
 * A post the deal knows about gets its dealt picture. A post the user just
 * created in the composer does not exist in `SEED_FEED`, so it falls back to a
 * hash of its own seed against its author's pool — which is stable for the life
 * of that post and still lands inside the right category.
 *
 * The locked and unlocked branches of a PPV post resolve here identically. That
 * is the point: unlocking must reveal the photograph the blur was hiding, not
 * swap in a different one.
 */
export function postMediaFor(p: Post): string {
  const dealt = FEED_MEDIA[p.id];
  if (dealt) return dealt;
  return mediaFor(poolFor(p.h), fhash(p.seed || p.id));
}

/** The loop for a video post, or "" if its photograph does not have one. */
export function postVideoFor(p: Post): string {
  return MEDIA_VIDEOS[postMediaFor(p)] || "";
}

/**
 * Categories that can lend a photograph to their neighbour without the grid
 * changing subject. A lifestyle creator's wall can carry a beauty frame, a
 * travel frame and a food frame and still read as one person's work; it cannot
 * carry a server rack. The relation is deliberately not symmetric-by-accident —
 * each row was chosen for what the borrowing category can absorb, not for what
 * the lender wants to give away.
 */
const NEIGHBOURS: Record<string, [string, string, string]> = {
  life: ["glow", "trav", "food"],
  stream: ["game", "tech", "music"],
  pod: ["music", "edu", "tech"],
  fit: ["life", "food", "dance"],
  edu: ["tech", "art", "pod"],
  vlog: ["trav", "life", "tech"],
  trav: ["vlog", "life", "food"],
  model: ["glow", "art", "life"],
  music: ["pod", "dance", "com"],
  com: ["music", "vlog", "dance"],
  art: ["model", "glow", "edu"],
  game: ["stream", "tech", "com"],
  glow: ["model", "life", "art"],
  tech: ["game", "edu", "stream"],
  dance: ["music", "fit", "com"],
  food: ["life", "trav", "fit"],
};

/**
 * The 21 photographs a creator's profile grid draws from, in order.
 *
 * The grid renders 18 tiles and a category holds 5, so the naive deal repeats
 * every sixth tile — three visible duplicates per wall, which is the kind of
 * thing nobody consciously notices and everybody registers as cheap. Their own
 * five lead, then their reel frame, and the remaining twelve come from three
 * neighbouring categories.
 *
 * The neighbour frames are dealt a row at a time — three columns, three
 * different categories per row — and the column each category lands in rotates
 * every row, so the wall does not stripe vertically into three themed columns.
 * 21 frames against 18 tiles means nothing repeats at all.
 *
 * Built once per handle and cached: the profile calls this eighteen times in a
 * single render and the answer cannot change between those calls.
 */
const GRID_CACHE: Record<string, string[]> = {};

function gridDeck(h: string): string[] {
  const cached = GRID_CACHE[h];
  if (cached) return cached;

  const cat = poolFor(h);
  const own = CATEGORY_MEDIA[cat] || CATEGORY_MEDIA[DEFAULT_CAT];
  /* The reel frame joins the wall, but only when it is not already on it.
     `REEL_IN_POOL` names the creators whose reel photograph is also one of
     their five category frames; for those, appending the reel would paint the
     same photograph twice at two different crops, which `deck.includes` cannot
     catch because the two crops are two different files. */
  const reel = REEL_IN_POOL[h] ? "" : REEL_STILLS[h];
  const deck: string[] = reel ? [...own, reel] : [...own];

  const nb = (NEIGHBOURS[cat] || NEIGHBOURS[DEFAULT_CAT]).map(
    (n) => CATEGORY_MEDIA[n] || CATEGORY_MEDIA[DEFAULT_CAT],
  );
  const depth = Math.max(...nb.map((p) => p.length));
  for (let d = 0; d < depth; d++) {
    for (let col = 0; col < nb.length; col++) {
      const pool = nb[(col + d) % nb.length];
      const src = pool[d % pool.length];
      if (!deck.includes(src)) deck.push(src);
    }
  }

  GRID_CACHE[h] = deck;
  return deck;
}

/**
 * A photograph for a creator's profile grid.
 *
 * The grid is a wall of their own work, so it leads with their whole pool
 * including the reel frame — a creator's reel appearing among their posts on
 * their own profile is what the real products do.
 */
export function gridFor(handle: string, i: number): string {
  const deck = gridDeck(handle.replace(/^@/, ""));
  return deck[((i % deck.length) + deck.length) % deck.length];
}
