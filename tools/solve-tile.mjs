/**
 * Match a tinted surface across the two themes.
 *
 *   node tools/solve-tile.mjs
 *
 * The landing page decorates six feature cards and three how-it-works steps
 * with a small rounded tile holding an icon: an accent at low alpha for the
 * fill, the same accent slightly stronger for a 1px edge. Both alphas were
 * chosen against a dark card and never given a light branch, so on #ffffff the
 * whole tile resolves to a wash — the mint one scores 1.07:1 against the card
 * it sits on, which is to say it is not there.
 *
 * The brief is that light should do what dark does, so the target is not a
 * fixed ratio. It is dark's own ratio, hue by hue. A tint's contrast against
 * its ground is a function of how far the hue sits from that ground, and the
 * six hues are nowhere near each other in luminance — #5ddd90 is bright and
 * #ef4444 is dark, so one alpha across all six would give six different
 * visibilities in light while giving six different ones in dark too, just not
 * the same six. Solving per hue is the only way the set stays even.
 *
 * The edge is a separate question and this does not answer it. A 1px accent
 * outline around an accent fill of the same hue restates a boundary the fill
 * has already drawn; once the fill carries, the outline has no work left.
 */

const srgb = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = (c) => {
  const [r, g, b] = c.map((v) => srgb(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const parse = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const over = (fg, a, bg) => bg.map((v, i) => fg[i] * a + v * (1 - a));

const DARK_CARD = parse("#111830");
const LIGHT_CARD = parse("#ffffff");

/* rgb triplet, dark fill alpha, where it appears. The dark alphas are what
   ships today and they are not being changed — dark is the reference. */
const TILES = [
  ["blue   how-step", [37, 153, 246], 0.1],
  ["blue   feature 1", [37, 153, 246], 0.12],
  ["amber  feature 2", [252, 164, 75], 0.12],
  ["red    feature 3", [239, 68, 68], 0.12],
  ["violet feature 4", [168, 85, 247], 0.12],
  ["mint   feature 5", [93, 221, 144], 0.12],
  ["gold   feature 6", [245, 158, 11], 0.12],
];

console.log("\n  tinted icon tiles — matching light to dark, hue by hue\n");
console.log("    hue                dark            light now       light solved");
console.log("    ─────────────────  ──────────────  ──────────────  ──────────────\n");

const out = [];
for (const [name, rgb, aDark] of TILES) {
  const target = ratio(over(rgb, aDark, DARK_CARD), DARK_CARD);
  const now = ratio(over(rgb, aDark, LIGHT_CARD), LIGHT_CARD);

  /* Walk up from the dark alpha. A tint on white can only ever darken, so the
     ratio rises monotonically and the first alpha to reach the target is the
     one to keep — no reason to go past it. */
  let pick = null;
  for (let a = aDark; a <= 1.0001; a += 0.005) {
    const r = ratio(over(rgb, a, LIGHT_CARD), LIGHT_CARD);
    if (r >= target) { pick = { a: Math.round(a * 200) / 200, r }; break; }
  }

  const dhex = hex(over(rgb, aDark, DARK_CARD));
  const nhex = hex(over(rgb, aDark, LIGHT_CARD));
  const phex = pick ? hex(over(rgb, pick.a, LIGHT_CARD)) : "—";
  console.log(
    `    ${name.padEnd(17)}  ${dhex} ${target.toFixed(2)}  ${nhex} ${now.toFixed(2)}` +
    `  ${phex} ${pick ? pick.r.toFixed(2) : "—"}   α ${aDark} → ${pick ? pick.a : "—"}`,
  );
  if (pick) out.push([name, pick.a]);
}

console.log("\n    light alphas: " + out.map(([n, a]) => `${n.split(" ")[0]} ${a}`).join(" · ") + "\n");
