/* Check that the landing page stops moving when it is asked to, and when
 * nobody is watching.
 *
 * Three claims, each of which is only worth making if it can be falsified:
 *
 *   1. Under `prefers-reduced-motion: reduce` nothing is animating — no
 *      particles are created, no interval is swapping the carousel, and every
 *      declared animation has collapsed to a single instant pass.
 *   2. The content those animations carry survives. `giftPop` and `floatUp`
 *      both end at opacity 0, so a naive reduced-motion rule deletes four lines
 *      of readable text along with the movement. The gift chips have to still
 *      be there and still be opaque.
 *   3. Scrolling the hero out of view parks it. The particles keep their
 *      animation but stop advancing, and the carousel stops changing slides.
 *
 * Usage: node tools/motioncheck.mjs <origin>
 */

import { chromium } from './playwright-env.mjs'

const ORIGIN = process.argv[2] || 'http://localhost:4202'

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const fails = []
const ok = []
const check = (cond, label, detail) => (cond ? ok : fails).push(`${label}${detail ? ` — ${detail}` : ''}`)

/* ── 1 + 2. Reduced motion ────────────────────────────────────────────── */
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  })
  const page = await ctx.newPage()
  await page.goto(ORIGIN + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)

  const r = await page.evaluate(() => {
    const chips = [...document.querySelectorAll('.giftpop')]
    const running = [...document.querySelectorAll('*')].filter(el => {
      const cs = getComputedStyle(el)
      if (cs.animationName === 'none') return false
      /* A single 0.01ms pass has finished long before this runs. Anything still
         declaring an infinite count is still going. */
      return cs.animationIterationCount !== '1' || parseFloat(cs.animationDuration) > 0.05
    }).map(el => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`)

    return {
      particles: document.querySelectorAll('.particle').length,
      chips: chips.length,
      chipOpacity: chips.map(c => getComputedStyle(c).opacity),
      chipText: chips.map(c => (c.textContent || '').trim()).filter(Boolean).length,
      running: [...new Set(running)].slice(0, 8),
      runningCount: running.length,
    }
  })

  /* The carousel must not advance. Sample the active slide twice, 5.5s apart —
     the interval is 5s, so one full period has passed. */
  const s0 = await page.evaluate(() => [...document.querySelectorAll('.hero-slide')].findIndex(e => e.classList.contains('active')))
  await page.waitForTimeout(5500)
  const s1 = await page.evaluate(() => [...document.querySelectorAll('.hero-slide')].findIndex(e => e.classList.contains('active')))

  check(r.particles === 0, 'reduce: no particles created', r.particles ? `${r.particles} found` : '')
  check(r.runningCount === 0, 'reduce: nothing still animating', r.runningCount ? `${r.runningCount}: ${r.running.join(', ')}` : '')
  check(r.chips > 0, 'reduce: gift chips still in the DOM', `${r.chips} found`)
  check(r.chipText === r.chips, 'reduce: gift chips still carry their text', `${r.chipText}/${r.chips}`)
  check(r.chipOpacity.every(o => Number(o) === 1), 'reduce: gift chips still opaque', r.chipOpacity.join(' '))
  check(s0 === s1, 'reduce: carousel does not advance', `slide ${s0} → ${s1}`)

  await ctx.close()
}

/* ── 3. Off-screen park ───────────────────────────────────────────────── */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(ORIGIN + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)

  const live = await page.evaluate(() => ({
    particles: document.querySelectorAll('.particle').length,
    still: !!document.querySelector('.hero-section.hero-still'),
    state: getComputedStyle(document.querySelector('.particle') || document.body).animationPlayState,
  }))
  check(live.particles === 18, 'normal: 18 particles created', `${live.particles}`)
  check(!live.still, 'normal: hero is live at the top of the page')
  check(live.state === 'running', 'normal: particles are running', live.state)

  /* Past the rootMargin of 200px plus a full viewport. */
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2.5))
  await page.waitForTimeout(700)

  const parked = await page.evaluate(() => ({
    still: !!document.querySelector('.hero-section.hero-still'),
    state: getComputedStyle(document.querySelector('.particle') || document.body).animationPlayState,
  }))
  check(parked.still, 'scrolled away: hero carries .hero-still')
  check(parked.state === 'paused', 'scrolled away: particles are paused', parked.state)

  /* And comes back. A visitor scrolling up must not find a dead hero. */
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(700)
  const back = await page.evaluate(() => ({
    still: !!document.querySelector('.hero-section.hero-still'),
    state: getComputedStyle(document.querySelector('.particle') || document.body).animationPlayState,
  }))
  check(!back.still, 'scrolled back: .hero-still is dropped')
  check(back.state === 'running', 'scrolled back: particles resume', back.state)

  await ctx.close()
}

await browser.close()

console.log(`\n  motion — ${ORIGIN}\n`)
for (const l of ok) console.log(`  OK  ${l}`)
for (const l of fails) console.log(`  XX  ${l}`)
console.log(`\n${fails.length ? `FAIL — ${fails.length} of ${ok.length + fails.length}` : `PASS — ${ok.length} checks`}\n`)
process.exit(fails.length ? 1 : 0)
