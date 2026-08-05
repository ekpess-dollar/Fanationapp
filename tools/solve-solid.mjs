/* Solve an accent for white ink.
 *
 * A "solid" token is an accent used as a surface with white sitting on it. That
 * job has a hard floor — 4.5:1 under WCAG 1.4.3 for anything below 18.66px bold
 * — and an accent chosen for how it looks as a fill almost never clears it. The
 * usual instinct is to nudge the hex by eye until it "looks dark enough", which
 * is how a token ends up at 3.2:1 with a comment claiming it passes.
 *
 * This walks the accent down its own HSL lightness ramp, holding hue and
 * saturation, and stops at the first value that clears the bar with the
 * requested margin. Holding H and S is the point: the result is the same colour
 * the brand already uses, only dark enough to carry white, rather than a
 * different colour that happens to pass.
 *
 * Gradients are checked at every sample, not at the endpoints. A CSS gradient
 * interpolates per channel in sRGB, and luminance is not linear in sRGB, so a
 * ramp between two passing colours can sag below the bar in the middle. Both
 * failures measured on this codebase were mid-gradient samples, not endpoints.
 *
 * Usage:
 *   node tools/solve-solid.mjs ratio  <hex>                  ratio with white
 *   node tools/solve-solid.mjs solve  <hex> [target]         darken to clear target
 *   node tools/solve-solid.mjs grad   <hexA> <hexB>          worst sample on a ramp
 *   node tools/solve-solid.mjs solvegrad <hexA> <hexB> [t]   darken both ends
 */

const hex2rgb = h => {
  const s = h.replace('#', '')
  return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16))
}
const rgb2hex = ([r, g, b]) =>
  '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')

/* WCAG relative luminance. The 0.03928 branch is the linear toe of the sRGB
   transfer function; skipping it overstates the contrast of very dark colours,
   which is exactly the range a solved solid token lands in. */
const lum = ([r, g, b]) => {
  const f = v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratioWhite = rgb => 1.05 / (lum(rgb) + 0.05)

function rgb2hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  const l = (mx + mn) / 2
  if (!d) return [0, 0, l]
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
  let h
  if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0))
  else if (mx === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h / 6, s, l]
}

function hsl2rgb([h, s, l]) {
  if (!s) { const v = l * 255; return [v, v, v] }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = t => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]
}

/* Darken by lowering HSL lightness one step at a time and re-measuring, rather
   than solving for a luminance target directly. Rounding to 8-bit at the end
   can push a value back under the bar, so the check has to happen on the hex
   that actually ships. */
function solve(hex, target) {
  const [h, s, l0] = rgb2hsl(hex2rgb(hex))
  for (let l = l0; l > 0; l -= 0.002) {
    const rgb = hsl2rgb([h, s, l]).map(Math.round)
    if (ratioWhite(rgb) >= target) return { hex: rgb2hex(rgb), ratio: ratioWhite(rgb) }
  }
  return null
}

/* CSS interpolates a gradient per channel in sRGB. Sampling the ramp is the
   only honest way to find its darkest-contrast point. */
function gradWorst(a, b, n = 101) {
  const A = hex2rgb(a), B = hex2rgb(b)
  let worst = { ratio: Infinity, at: 0, hex: a }
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const rgb = A.map((v, k) => v + (B[k] - v) * t)
    const r = ratioWhite(rgb)
    if (r < worst.ratio) worst = { ratio: r, at: +(t * 100).toFixed(0), hex: rgb2hex(rgb) }
  }
  return worst
}

const [mode, ...rest] = process.argv.slice(2)

if (mode === 'ratio') {
  for (const h of rest) console.log(`${h}  ${ratioWhite(hex2rgb(h)).toFixed(2)}:1 with #fff`)
} else if (mode === 'solve') {
  const target = Number(rest[1]) || 4.5
  const r = solve(rest[0], target)
  console.log(`${rest[0]} (${ratioWhite(hex2rgb(rest[0])).toFixed(2)}:1)  ->  ${r.hex} (${r.ratio.toFixed(2)}:1)`)
} else if (mode === 'grad') {
  const w = gradWorst(rest[0], rest[1])
  console.log(`${rest[0]} -> ${rest[1]}   worst ${w.ratio.toFixed(2)}:1 at ${w.at}% (${w.hex})`)
  console.log(`  ends: ${ratioWhite(hex2rgb(rest[0])).toFixed(2)} / ${ratioWhite(hex2rgb(rest[1])).toFixed(2)}`)
} else if (mode === 'solvegrad') {
  const target = Number(rest[2]) || 4.5
  /* Solve each end past the target, then re-check the whole ramp and keep
     darkening whichever end the sag is nearer to until every sample clears. */
  let a = solve(rest[0], target).hex, b = solve(rest[1], target).hex
  for (let guard = 0; guard < 200; guard++) {
    const w = gradWorst(a, b)
    if (w.ratio >= target) break
    if (w.at <= 50) a = solve(a, ratioWhite(hex2rgb(a)) + 0.05).hex
    else b = solve(b, ratioWhite(hex2rgb(b)) + 0.05).hex
  }
  const w = gradWorst(a, b)
  console.log(`${rest[0]} -> ${rest[1]}`)
  console.log(`  was:  worst ${gradWorst(rest[0], rest[1]).ratio.toFixed(2)}:1`)
  console.log(`  now:  ${a} -> ${b}   worst ${w.ratio.toFixed(2)}:1 at ${w.at}%`)
  console.log(`  ends: ${ratioWhite(hex2rgb(a)).toFixed(2)} / ${ratioWhite(hex2rgb(b)).toFixed(2)}`)
} else {
  console.log('modes: ratio | solve | grad | solvegrad')
}
