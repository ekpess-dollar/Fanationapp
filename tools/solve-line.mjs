/**
 * Solve a boundary colour against every ground it has to sit on.
 *
 *   node tools/solve-line.mjs
 *
 * `solve-solid.mjs` solves an accent used as a surface — accent behind, white
 * ink on top. This solves the other direction: a 1px edge that has to stay
 * discernible against whatever the page puts behind it, which is the shape of
 * WCAG 1.4.11 for a control boundary.
 *
 * The constraint is one-sided and it binds at the far end of the range, not the
 * near one. In light the border must be dark enough for the DARKEST page
 * surface it ever crosses — solve it against white alone and it passes on cards
 * and fails on the panel two pixels away. In dark it must be bright enough for
 * the BRIGHTEST. So every candidate is scored against the whole ground set and
 * keeps its worst result, and the answer printed is the one nearest the
 * hairline it replaces that still clears 3:1 everywhere.
 *
 * Alpha is not a free variable here. A translucent edge composites over the
 * ground beneath it, so its painted colour moves with the ground and the worst
 * case is not at either end of the alpha range — it is wherever the composite
 * and the ground converge. That is why the dark candidates are swept as
 * rgba-over-ground rather than as flat hexes: the dark theme declares its rules
 * in white-alpha and the fix has to stay in that idiom to be a one-line change.
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
const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const parse = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/* Straight source-over. The ground is opaque in every case here. */
const over = (fg, a, bg) => bg.map((v, i) => fg[i] * a + v * (1 - a));

const BAR = 3;

/* Grounds are not invented — every one is a token value or a pixel the border
   prober actually sampled under a failing control. The photographic ones matter
   most: they are the far end that a solve against flat surfaces would miss. */
const SETS = {
  "light — client + admin": {
    grounds: [
      ["--card #ffffff", "#ffffff"], ["--bg #f3f5fa", "#f3f5fa"],
      ["--bg2/--panel #e9eef6", "#e9eef6"], ["/feed card-on-bg #e9ebf1", "#e9ebf1"],
      ["/login hero seam #d9dcde", "#d9dcde"], ["admin / backdrop #bac3ce", "#bac3ce"],
    ],
    dir: "dark", from: "rgba(12,18,32,0.17)",
  },
  "dark — client + admin": {
    grounds: [
      ["--bg #07091a", "#07091a"], ["--card #111830", "#111830"],
      ["--panel #131425", "#131425"], ["/reels card #0e1021", "#0e1021"],
      ["search well #131425", "#131425"], ["messages field #131525", "#131525"],
    ],
    dir: "light", from: "rgba(255,255,255,0.07)",
  },
  "light — landing nav": {
    grounds: [["page #f3f5fa", "#f3f5fa"], ["hero seam #c7cccc", "#c7cccc"], ["white #ffffff", "#ffffff"]],
    dir: "dark", from: "rgba(12,18,32,0.17)",
  },

  /* The floating «Coins sent today» card on the live-gifting mockup. Its own
     fill is --card2, which the prober scored at 1.00:1 against the photo behind
     it — the card and that patch of image are the same colour, so the amber
     edge is the entire reason it reads as a card rather than as two lines of
     text lying on a photograph. That makes it the one accent border on landing
     doing identifying work, and the only one worth solving.

     Not a white-alpha or ink-alpha sweep like the sets above: the hue is the
     point here, so the sweep is the accent's own -ink value at rising alpha.
     In dark that token aliases #FCA44B and clears the bar over the image. In
     light it is #825427, and it has to, because bare amber on a bright photo
     tops out near 2:1 whatever the alpha — the reason the -ink split exists. */
  "dark — landing coins card": {
    grounds: [["photo behind card #292124", "#292124"], ["--card2 #18223c", "#18223c"]],
    src: "#fca44b", from: "rgba(252,164,75,0.3)",
  },
  "light — landing coins card": {
    grounds: [["white photo (worst) #ffffff", "#ffffff"], ["photo mid #c4c7c9", "#c4c7c9"], ["--card2 #ffffff", "#ffffff"]],
    src: "#825427", from: "rgba(252,164,75,0.3)",
  },

  /* The «Subscribed» button on /creator/:handle. It is a ghost button carrying
     an inline mint edge, and the edge is the whole state: subscribed and not
     subscribed are the same button, the same size, in the same place, and the
     only thing that separates them is that one is outlined in mint and the
     other is not. So it is a control boundary under 1.4.11 and the accent has
     to earn its 3:1 the way the coins card does.
     The inline declaration is also why the late --line-ctl block does not reach
     it — an element style beats any selector — which is correct: a grey edge
     here would delete the state, not fix it.
     Two grounds each, because a 1px edge on a ghost button has the page on one
     side and the button's own --fill wash on the other, and the wash is nearer
     the edge in luminance than the page is. */
  "dark — client subscribed btn": {
    grounds: [["--bg #07091a", "#07091a"], ["--fill over --bg #131525", "#131525"],
              ["--card #111830", "#111830"], ["--fill over --card #1d243a", "#1d243a"]],
    src: "#5ddd90", from: "rgba(93,221,144,0.4)",
  },
  "light — client subscribed btn": {
    grounds: [["--bg #f3f5fa", "#f3f5fa"], ["--fill over --bg #e9ebf1", "#e9ebf1"],
              ["--card #ffffff", "#ffffff"], ["--fill over --card #f5f5f6", "#f5f5f6"]],
    src: "#2d6a46", from: "rgba(93,221,144,0.4)",
  },
};

for (const [name, S] of Object.entries(SETS)) {
  const grounds = S.grounds.map(([label, h]) => ({ label, c: parse(h) }));
  console.log(`\n  ${name}   replacing ${S.from}\n`);

  /* Sweep alpha in the theme's own idiom — white-alpha in dark, ink-alpha in
     light — and keep the first that clears the bar on every ground, because
     the first is the faintest and a boundary should be no louder than the job
     needs. A set may name its own sweep colour instead, for the case where the
     hue is the point rather than the weight. */
  const src = S.src ? parse(S.src) : S.dir === "light" ? [255, 255, 255] : [12, 18, 32];
  let pick = null;
  for (let a = 0.05; a <= 1.0001; a += 0.01) {
    const worst = grounds.reduce((w, g) => {
      const r = ratio(over(src, a, g.c), g.c);
      return !w || r < w.r ? { r, g } : w;
    }, null);
    if (worst.r >= BAR) { pick = { a: Math.round(a * 100) / 100, worst }; break; }
  }

  if (!pick) {
    console.log("  no alpha in this idiom clears the bar on every ground\n");
  } else {
    const decl = `rgba(${src.join(",")},${pick.a})`;
    console.log(`  ${decl}      worst ${pick.worst.r.toFixed(2)}:1 on ${pick.worst.g.label}\n`);
    for (const g of grounds) {
      const p = over(src, pick.a, g.c);
      const r = ratio(p, g.c);
      console.log(`    ${r >= BAR ? "ok" : "XX"}  ${r.toFixed(2)}  ${g.label.padEnd(26)} paints ${hex(p)}`);
    }
  }

  /* What the hairline it replaces actually scores, so the delta is on the page
     next to the answer rather than in a different report. Read both the colour
     and the alpha out of the declaration rather than assuming the old edge was
     the same hue as the new one — for the coins card it is not: what ships is
     bare --amber and the answer is --amber-ink. */
  const [, fr, fg, fb, fa] = S.from.match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)\D+([\d.]+)\s*\)/);
  const fsrc = [+fr, +fg, +fb];
  const fw = grounds.reduce((w, g) => {
    const r = ratio(over(fsrc, +fa, g.c), g.c);
    return !w || r < w ? r : w;
  }, null);
  console.log(`\n    was: ${S.from} → worst ${fw.toFixed(2)}:1`);
}
console.log("");
