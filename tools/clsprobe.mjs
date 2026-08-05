/* Measure cumulative layout shift on a cold load, honestly.
 *
 * CLS on a fast local preview server is almost always zero, because the font
 * arrives in the same millisecond as the stylesheet and there is never a frame
 * painted in the fallback face. That reading is worthless — it measures the
 * network, not the page. So this throttles the connection hard enough that the
 * swap actually has to happen, which is the condition the fix exists for.
 *
 * Every shift is attributed back to the nodes that moved, because "CLS 0.18" is
 * not actionable and "the auth card and three tiles moved 214ms in" is.
 *
 * Usage: node tools/clsprobe.mjs <origin> <route> [route...]
 */

import { chromium } from './playwright-env.mjs'

const ORIGIN = process.argv[2] || 'http://localhost:4200'
const ROUTES = process.argv.slice(3)
if (!ROUTES.length) ROUTES.push('/login')

/* Roughly a good 3G line. Slow enough that a render-blocking stylesheet and a
   48 KB font cannot both land before first paint unless the font was preloaded. */
const NET = { offline: false, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8, latency: 150 }

const COLLECT = `
  window.__shifts = []
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue
      window.__shifts.push({
        value: e.value,
        t: Math.round(e.startTime),
        sources: (e.sources || []).map(s => {
          const n = s.node
          if (!n || !n.tagName) return '(detached)'
          const c = (n.className || '').toString().trim().split(/\\s+/).filter(Boolean).slice(0, 2).join('.')
          return n.tagName + (c ? '.' + c : '')
        }),
      })
    }
  }).observe({ type: 'layout-shift', buffered: true })
`

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const rows = []
for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(COLLECT)
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', { ...NET, connectionType: 'cellular3g' })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

  await page.goto(ORIGIN + route, { waitUntil: 'load' })
  await page.waitForTimeout(3500)

  const shifts = await page.evaluate(() => window.__shifts || [])
  const total = shifts.reduce((a, s) => a + s.value, 0)
  const preloaded = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel="preload"][as="font"]')].map(l => l.href.split('/').pop()))

  rows.push({ route, total, shifts, preloaded })
  await ctx.close()
}
await browser.close()

console.log(`\n  layout shift — ${ORIGIN}   (3G, 4x CPU)\n`)
let worst = 0
for (const r of rows) {
  worst = Math.max(worst, r.total)
  const bar = r.total <= 0.1 ? 'OK ' : r.total <= 0.25 ? 'MEH' : 'XX '
  console.log(`  ${bar} ${r.route.padEnd(16)} CLS ${r.total.toFixed(4).padStart(7)}   ${r.shifts.length} shift(s)   preload: ${r.preloaded.length ? r.preloaded.join(', ') : 'none'}`)
  for (const s of r.shifts.sort((a, b) => b.value - a.value).slice(0, 4)) {
    console.log(`        ${s.value.toFixed(4)} at ${s.t}ms — ${[...new Set(s.sources)].slice(0, 5).join(', ') || '(no sources)'}`)
  }
}
console.log(`\n${worst <= 0.1 ? `PASS — worst ${worst.toFixed(4)} / 0.1` : `FAIL — worst ${worst.toFixed(4)} / 0.1`}\n`)
process.exit(worst <= 0.1 ? 0 : 1)
