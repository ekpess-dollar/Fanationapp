/* Measure the ground the hero copy actually sits on, per slide.
 *
 * The hero carousel cross-fades four photographs under the nav and the left
 * copy column. Every element in that column therefore has four grounds, not
 * one, and a contrast pass that samples whichever frame happened to be showing
 * measures one of them at random. That is how a veil gets tuned by arithmetic
 * to "about #e5e5e5" and ships at #cdcccd.
 *
 * This forces each slide active in turn, hides the text so only the composite
 * ground remains, and reads the real pixels under each target's box. The ink
 * colours are read from the live elements, so a token change is picked up
 * without editing this file.
 *
 * Usage:
 *   node tools/hero-probe.mjs <origin> [dark|light]
 */

import { chromium } from './playwright-env.mjs'

const ORIGIN = process.argv[2] || 'http://localhost:4202'
const THEME = process.argv[3] || 'light'

/* Selector, a label, and the WCAG floor that applies to it. The floor is not
   uniform: 18.66px bold and 24px plain clear at 3:1, everything else at 4.5. */
const TARGETS = [
  ['.fanav .nav-link:not(.hidden)', 'nav links', 4.5],
  ['.fanav a.hidden.md\\:inline-flex.nav-link', 'nav "Log in"', 4.5],
  ['.hero-eyebrow', 'hero eyebrow', 4.5],
  ['h1.font-black.leading-\\[1\\.04\\]', 'hero H1', 3],
  ['p.leading-\\[1\\.78\\].mb-10', 'hero subhead', 4.5],
  ['.hero-ghost', 'hero ghost CTA', 4.5],
  ['span.text-xs.mr-1', '"Available on"', 4.5],
]

const lum = ([r, g, b]) => {
  const f = v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a, b) => {
  const [hi, lo] = lum(a) >= lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)]
  return (hi + 0.05) / (lo + 0.05)
}
const hex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')

/* An `rgb()`/`rgba()` string composited onto its own backdrop is not what we
   want here — we want the ink as painted, so alpha is folded against the
   measured ground later. Parse both forms. */
function parseColor(s) {
  const m = s.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const p = m[1].split(',').map(v => parseFloat(v.trim()))
  return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 }
}
const over = (ink, a, ground) => ink.map((v, i) => v * a + ground[i] * (1 - a))

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
/* The theme is read by a pre-paint inline script from localStorage, so it has
   to be seeded before the first frame or the page renders dark and repaints. */
await ctx.addInitScript(t => {
  try { localStorage.setItem('fanation.landing.theme', t) } catch { }
}, THEME)

const page = await ctx.newPage()
await page.goto(ORIGIN, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)

/* Freeze the carousel. React owns `.active` via state, so the interval would
   fight any class we set; killing the timers first makes the slide index ours. */
await page.evaluate(() => {
  let id = window.setInterval(() => { }, 9999)
  while (id--) window.clearInterval(id)
})

const slides = await page.$$eval('.hero-slide', els =>
  els.map(e => (e.style.backgroundImage.match(/([^/]+)\.jpg/) || [, 'slide'])[1]))

const boxes = []
for (const [sel, label, floor] of TARGETS) {
  const found = await page.$$(sel)
  for (let i = 0; i < found.length; i++) {
    const box = await found[i].boundingBox()
    if (!box || box.width < 4 || box.height < 4) continue
    const style = await found[i].evaluate(el => {
      const cs = getComputedStyle(el)
      return { color: cs.color, size: parseFloat(cs.fontSize), weight: cs.fontWeight }
    })
    const c = parseColor(style.color)
    boxes.push({ sel, label: found.length > 1 ? `${label} #${i + 1}` : label, floor, box, ink: c, style })
  }
}

/* Every animation is parked before anything is photographed, and stays parked
   for both shots of every slide. Two frames of the same slide have to differ
   *only* where the glyphs are, and a drifting particle or a blinking dot would
   otherwise be read as a glyph and drag whatever it flew over into the
   measurement. */
await page.addStyleTag({
  content: `*, *::before, *::after { animation-play-state: paused !important; transition: none !important; }`,
})

/* Hide the glyphs but keep the boxes laid out, so what the camera sees inside
   each box is exactly the ground that box's text sits on.
 *
 * Three things inside these boxes are ink wearing a different hat and have to
 * go with the glyphs, or they get measured as ground and the element reads as
 * failing against itself. The eyebrow's dot is a filled disc of `--coral-ink`
 * on a blink animation, so it lands at a different alpha in every frame — that
 * alone produced four different "grounds" for one static chip. The H1's `<em>`
 * paints a gradient through `background-clip:text`, which survives a `color`
 * override; `onart.mjs` skips gradient ink for the same reason. And a border is
 * a mark, not a surface. */
const hideTag = await page.addStyleTag({
  content: `.fanav .nav-link, .hero-eyebrow, h1.font-black, p.leading-\\[1\\.78\\], .hero-ghost, span.text-xs.mr-1 { color: transparent !important; -webkit-text-fill-color: transparent !important; }
            .hero-eyebrow-dot { background: none !important; animation: none !important; }
            h1.font-black em { background: none !important; }
            .hero-eyebrow, .hero-ghost { border-color: transparent !important; }`,
})

const results = new Map()

for (let s = 0; s < slides.length; s++) {
  await page.evaluate(i => {
    document.querySelectorAll('.hero-slide').forEach((el, k) => {
      el.classList.toggle('active', k === i)
      el.style.transition = 'none'
    })
  }, s)
  await page.waitForTimeout(250)

  /* Two frames of the same slide: one with the type on, one with it off. The
     box is the wrong unit — a 17px paragraph at line-height 1.78 is mostly the
     air between its lines, and the darkest pixel in that air is not something
     anybody has to read. Where the two frames differ is where the glyphs are;
     the ground is then read from the second frame at exactly those coordinates
     and nowhere else. */
  await hideTag.evaluate(el => { el.disabled = true })
  await page.waitForTimeout(60)
  const inkShot = (await page.screenshot({ type: 'png' })).toString('base64')
  await hideTag.evaluate(el => { el.disabled = false })
  await page.waitForTimeout(60)
  const bareShot = (await page.screenshot({ type: 'png' })).toString('base64')

  /* Decode inside the page rather than pulling in an image library: the
     browser already has a PNG decoder and a canvas, and `onart.mjs` reads its
     pixels the same way, so the two tools agree on what a pixel is. */
  const grounds = await page.evaluate(async ([a64, b64, rects]) => {
    const decode = async s => {
      const bin = atob(s); const u = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i)
      const bmp = await createImageBitmap(new Blob([u], { type: 'image/png' }))
      const cv = new OffscreenCanvas(bmp.width, bmp.height)
      const cx = cv.getContext('2d', { willReadFrequently: true })
      cx.drawImage(bmp, 0, 0)
      return { w: bmp.width, h: bmp.height, d: cx.getImageData(0, 0, bmp.width, bmp.height).data }
    }
    const A = await decode(a64), B = await decode(b64)
    /* 24 is the antialiasing floor. An edge pixel that is a tenth of a glyph
       moves a little between the frames and is not what the eye resolves;
       requiring a real move keeps this to the pixels a reader actually sees as
       letterform, which is the same bar `onart.mjs` sets. */
    const FLOOR = 24
    return rects.map(r => {
      const x0 = Math.max(0, Math.round(r.x)), x1 = Math.min(A.w - 1, Math.round(r.x + r.width))
      const y0 = Math.max(0, Math.round(r.y)), y1 = Math.min(A.h - 1, Math.round(r.y + r.height))
      const px = []
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const o = (A.w * y + x) << 2
          const dr = Math.abs(A.d[o] - B.d[o])
          const dg = Math.abs(A.d[o + 1] - B.d[o + 1])
          const db = Math.abs(A.d[o + 2] - B.d[o + 2])
          if (Math.max(dr, dg, db) < FLOOR) continue
          px.push([B.d[o], B.d[o + 1], B.d[o + 2]])
        }
      }
      return px
    })
  }, [inkShot, bareShot, boxes.map(b => b.box)])

  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i]
    const key = b.label
    if (!results.has(key)) results.set(key, { ...b, per: [], blind: 0 })
    /* The worst glyph pixel decides the element, not the mean — one word of a
       paragraph can sit over the one bright patch in the photograph and that
       word still has to be read. */
    let worst = null, worstR = Infinity
    for (const g of grounds[i]) {
      const inkOn = b.ink.a < 1 ? over(b.ink.rgb, b.ink.a, g) : b.ink.rgb
      const r = ratio(inkOn, g)
      if (r < worstR) { worstR = r; worst = g }
    }
    /* No glyph pixel cleared the antialiasing floor. That is not a pass — it
       is the tool failing to see, and it says so rather than staying quiet. */
    if (!worst) { results.get(key).blind++; continue }
    results.get(key).per.push({ slide: slides[s], ratio: worstR, ground: worst, n: grounds[i].length })
  }
}

await browser.close()

console.log(`\n  hero ground — ${THEME} · ${ORIGIN} · ${slides.length} slides · glyph pixels only\n`)
let fails = 0
const scored = [...results.values()].filter(r => r.per.length)
const blind = [...results.values()].filter(r => !r.per.length)
const rows = scored.sort((a, b) =>
  Math.min(...a.per.map(p => p.ratio)) - Math.min(...b.per.map(p => p.ratio)))

for (const r of rows) {
  const w = r.per.reduce((m, p) => (p.ratio < m.ratio ? p : m))
  const ok = w.ratio >= r.floor
  if (!ok) fails++
  console.log(`  ${ok ? 'OK' : 'XX'} ${r.label}  ${w.ratio.toFixed(2)}:1 / ${r.floor}   ` +
    `ink ${hex(r.ink.rgb)}${r.ink.a < 1 ? `@${r.ink.a}` : ''} ${r.style.size}px/${r.style.weight}` +
    (r.blind ? `   (${r.blind} slide(s) yielded no glyph pixel)` : ''))
  console.log('     ' + r.per.map(p => `${p.slide} ${p.ratio.toFixed(2)} on ${hex(p.ground)} (${p.n}px)`).join(' · '))
}
for (const r of blind) console.log(`  ??  ${r.label}  no glyph pixel cleared the antialiasing floor on any slide`)
console.log(`\n${fails ? `FAIL — ${fails} of ${rows.length}` : `PASS — 0 of ${rows.length}`} below bar` +
  (blind.length ? ` · ${blind.length} unscored` : '') + '\n')
process.exit(fails ? 1 : 0)
