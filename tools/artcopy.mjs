/* Measure the ground that copy sitting over drifting artwork actually has.
 *
 * The auth hero is three columns of photographs on a 46–62s loop under a veil,
 * with the headline, the subhead and four statistics laid over the bottom of
 * it. Every one of those roles therefore has a different ground at every moment
 * of the loop, and a contrast check that samples one frame measures one of them
 * at random — the same failure `hero-probe.mjs` exists to stop on the landing
 * carousel, in a different shape. There the variable is which of four slides is
 * active; here it is how far the columns have drifted.
 *
 * So the drift is sampled rather than frozen. The columns render `[...col,
 * ...col]` and the keyframe runs translateY(0) to translateY(-50%), which means
 * the strip is periodic over that range and eight stops across it see every
 * photograph that ever passes under the type.
 *
 * The rest is `hero-probe.mjs`'s method verbatim, and deliberately so: two
 * frames of the same state, one with the glyphs painted and one with them
 * hidden, differenced to find where the letterforms actually are, and the
 * ground read from the second frame at exactly those coordinates. A box is the
 * wrong unit — a 15.5px paragraph at line-height 1.55 is mostly the air between
 * its lines, and nobody has to read the air.
 *
 * Usage:
 *   node tools/artcopy.mjs <origin> <themeKey> [dark|light] [route]
 *
 * e.g. node tools/artcopy.mjs http://localhost:4200 fanation.theme light /login
 */

import { chromium } from './playwright-env.mjs'

const ORIGIN = process.argv[2] || 'http://localhost:4200'
const THEMEKEY = process.argv[3] || 'fanation.theme'
const THEME = process.argv[4] || 'light'
const ROUTE = process.argv[5] || '/login'

/* Selector, label, WCAG floor. 26px at 900 and 38px at 900 are both large text
   by 1.4.3 — 3:1. The subhead and the stat captions are not, and carry 4.5. */
const TARGETS = [
  ['.authtitle', 'auth title', 3],
  ['.authsub', 'auth subhead', 4.5],
  ['.authstat b', 'stat figure', 3],
  ['.authstat span', 'stat caption', 4.5],
]

/* Eight stops across one period of the drift. */
const STOPS = 8

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
await ctx.addInitScript(([k, t]) => {
  try { localStorage.setItem(k, t) } catch { }
}, [THEMEKEY, THEME])

const page = await ctx.newPage()
await page.goto(ORIGIN + ROUTE, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)

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
    boxes.push({
      sel, label: found.length > 1 ? `${label} #${i + 1}` : label,
      floor, box, ink: parseColor(style.color), style,
    })
  }
}
if (!boxes.length) { console.log('\n  no copy found over art on ' + ROUTE + '\n'); await browser.close(); process.exit(2) }

/* Park everything. Two frames of one drift stop have to differ only where the
   glyphs are; a tile still easing under the type would be read as a glyph and
   drag whatever it moved over into the measurement. */
await page.addStyleTag({
  content: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
})

const hideTag = await page.addStyleTag({
  content: `.authtitle, .authsub, .authstat b, .authstat span { color: transparent !important; -webkit-text-fill-color: transparent !important; }`,
})

const results = new Map()

for (let s = 0; s < STOPS; s++) {
  const pct = (50 * s) / STOPS
  await page.evaluate(p => {
    document.querySelectorAll('.authcol').forEach((el, k) => {
      /* The three columns drift at different speeds and one runs in reverse, so
         offsetting them all identically would only ever reproduce one of the
         alignments the loop actually passes through. Staggering by column keeps
         the relationships between them varied across the sample. */
      el.style.transform = `translateY(-${(p + k * 7.3) % 50}%)`
    })
  }, pct)
  await page.waitForTimeout(90)

  await hideTag.evaluate(el => { el.disabled = true })
  await page.waitForTimeout(50)
  const inkShot = (await page.screenshot({ type: 'png' })).toString('base64')
  await hideTag.evaluate(el => { el.disabled = false })
  await page.waitForTimeout(50)
  const bareShot = (await page.screenshot({ type: 'png' })).toString('base64')

  const grounds = await page.evaluate(async ([a64, b64, rects]) => {
    const decode = async str => {
      const bin = atob(str); const u = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i)
      const bmp = await createImageBitmap(new Blob([u], { type: 'image/png' }))
      const cv = new OffscreenCanvas(bmp.width, bmp.height)
      const cx = cv.getContext('2d', { willReadFrequently: true })
      cx.drawImage(bmp, 0, 0)
      return { w: bmp.width, h: bmp.height, d: cx.getImageData(0, 0, bmp.width, bmp.height).data }
    }
    const A = await decode(a64), B = await decode(b64)
    const FLOOR = 24
    return rects.map(r => {
      const x0 = Math.max(0, Math.round(r.x)), x1 = Math.min(A.w - 1, Math.round(r.x + r.width))
      const y0 = Math.max(0, Math.round(r.y)), y1 = Math.min(A.h - 1, Math.round(r.y + r.height))
      const px = []
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const o = (A.w * y + x) << 2
          if (Math.max(Math.abs(A.d[o] - B.d[o]), Math.abs(A.d[o + 1] - B.d[o + 1]), Math.abs(A.d[o + 2] - B.d[o + 2])) < FLOOR) continue
          px.push([B.d[o], B.d[o + 1], B.d[o + 2]])
        }
      }
      return px
    })
  }, [inkShot, bareShot, boxes.map(b => b.box)])

  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i]
    if (!results.has(b.label)) results.set(b.label, { ...b, per: [], blind: 0 })
    let worst = null, worstR = Infinity
    for (const g of grounds[i]) {
      const inkOn = b.ink.a < 1 ? over(b.ink.rgb, b.ink.a, g) : b.ink.rgb
      const r = ratio(inkOn, g)
      if (r < worstR) { worstR = r; worst = g }
    }
    if (!worst) { results.get(b.label).blind++; continue }
    results.get(b.label).per.push({ stop: `d${s}`, ratio: worstR, ground: worst, n: grounds[i].length })
  }
}

await browser.close()

console.log(`\n  copy over art — ${THEME} · ${ORIGIN}${ROUTE} · ${STOPS} drift stops · glyph pixels only\n`)
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
    (r.blind ? `   (${r.blind} stop(s) yielded no glyph pixel)` : ''))
  console.log(`     worst ${w.stop} on ${hex(w.ground)} · median ${
    hex(r.per.map(p => p.ground).sort((a, b) => lum(a) - lum(b))[Math.floor(r.per.length / 2)])
  } · best ${r.per.reduce((m, p) => (p.ratio > m.ratio ? p : m)).ratio.toFixed(2)}`)
}
for (const r of blind) console.log(`  ??  ${r.label}  no glyph pixel cleared the antialiasing floor at any drift stop`)
console.log(`\n${fails ? `FAIL — ${fails} of ${rows.length}` : `PASS — 0 of ${rows.length}`} below bar` +
  (blind.length ? ` · ${blind.length} unscored` : '') + '\n')
process.exit(fails ? 1 : 0)
