/**
 * The landing page's photographs, and the rungs each one has been cut to.
 *
 * The nine pictures here were jpegs, shipped once at full size and painted into
 * boxes between 36 and 1440 CSS pixels. 845 KB to draw, at the widest, about
 * 400 KB of actual pixels. `tools/variants.mjs` now cuts them to webp and to
 * three smaller widths beside it; this file is what the markup asks.
 *
 * `RUNGS` and `INTRINSIC` are the same list a second time — the ladder config in
 * `tools/variants.mjs` is the first — and nothing enforces that the two agree.
 * They have to, because a `srcset` fails hard: a `w`-descriptor candidate that
 * 404s does not fall back to another rung, the <img> fires onerror and paints
 * nothing at all. Run `node tools/variants.mjs --check` after touching either
 * side. That command needs no encoder installed and runs anywhere.
 *
 * The rungs are the measured boxes doubled for retina, and stop at the intrinsic
 * width — nothing is ever upscaled. `tools/boxes.mjs` measured the boxes at 1440
 * and 390:
 *
 *    36 and 44   the social-proof faces and the testimonial faces   → 96
 *   164          a creator card on a phone                          → 320 at 1x, 560 at 2x
 *   263          a hero mosaic card                                 → 560 at 2x
 *   318          the live phone mockup                              → 560 at 2x
 *   368          a creator card on a desktop                        → 800 at 2x
 */

import type { ImgHTMLAttributes } from 'react'

const RUNGS = [96, 320, 560]

/**
 * How wide each original is. Two of them are smaller than the top rung, so
 * their ladder is shorter — elena and marcus stop at 320 and then jump to the
 * full-size file, which is 480 wide.
 */
const INTRINSIC: Record<string, number> = {
  'creator-aisha': 800,
  'creator-amara': 600,
  'creator-dembe': 800,
  'creator-elena': 480,
  'creator-live': 600,
  'creator-marcus': 480,
  'creator-nadia': 800,
  'creator-sofia': 800,
  'creator-tobi': 800,
}

/**
 * `sizes` per layout, not per call site.
 *
 * Over-declaring costs a rung, under-declaring costs sharpness, and only one of
 * those is visible — so where a box has a range these round up to the top of it.
 * The mosaic cards run 224 to 263 between the `lg` breakpoint and the container
 * cap; 263 is declared for the whole range.
 */
export const SIZES = {
  /** A face in the hero's social-proof row. 36px at every width. */
  heroFace: '36px',
  /** A face on a testimonial card. 44px at every width. */
  cardFace: '44px',
  /** One of the three cards in the hero mosaic. Not rendered below `lg`. */
  heroCard: '263px',
  /** A creator card in the 2-up/3-up mosaic. */
  creatorCard: '(max-width: 767px) 46vw, 368px',
  /** The live phone mockup, which is capped at 320 and centred. */
  phone: '320px',
} as const

/* Built once per path — the page asks for the same nine photographs on every
   render and the answer cannot change between those calls. */
const CACHE: Record<string, string> = {}

/**
 * The `srcset` for a photograph, or nothing if it has no rungs.
 *
 * A pure function of the path. Anything outside `/images/` returns undefined and
 * behaves exactly as it does today, which is also what a path that is already a
 * rung does — the name group rejects a dot, so `creator-tobi.320.webp` cannot be
 * laddered a second time.
 */
export function srcsetFor(src?: string): string | undefined {
  if (!src) return undefined
  const cached = CACHE[src]
  if (cached !== undefined) return cached || undefined

  const m = /^\/images\/([^/.]+)\.webp$/.exec(src)
  const nat = m ? INTRINSIC[m[1]] : undefined
  if (!m || !nat) {
    CACHE[src] = ''
    return undefined
  }
  const base = `/images/${m[1]}`
  const out = RUNGS.filter(w => w < nat)
    .map(w => `${base}.${w}.webp ${w}w`)
    .concat(`${src} ${nat}w`)
    .join(', ')
  CACHE[src] = out
  return out
}

type PicProps = ImgHTMLAttributes<HTMLImageElement> & { src: string }

/**
 * A photograph with its ladder attached.
 *
 * `srcSet` only ships when a `sizes` comes with it, and that guard is the whole
 * design. A srcset without sizes is worse than no srcset at all: the browser
 * assumes the image fills the viewport, picks the widest rung on every screen,
 * and the page gets slower for the trouble. Every other prop passes straight
 * through, so a call site keeps its own classes, styles and dimensions.
 */
export function Pic({ src, sizes, ...rest }: PicProps) {
  return <img src={src} srcSet={sizes ? srcsetFor(src) : undefined} sizes={sizes} {...rest} />
}
