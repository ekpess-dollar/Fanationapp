#!/usr/bin/env node
/**
 * Generate the favicon / app-icon / Open Graph set for every project, from the
 * brand assets sitting beside this file.
 *
 *     node tools/brand-assets/generate-icons.mjs                 # all three
 *     node tools/brand-assets/generate-icons.mjs client admin    # just these
 *
 * The outputs are committed, so you only need to run this when the mark, the tile
 * colour, or the OG card changes. Nothing in the build calls it.
 *
 * Every file is derived from `mark.svg` and `og-brand.svg` at run time — no
 * geometry is retyped here, so the icons cannot drift away from the mark.
 *
 * Where the outputs land, and why those names. Next used to pick `icon.svg`,
 * `apple-icon.png`, `favicon.ico` and `opengraph-image.png` out of an `app/`
 * directory by file convention and emit the <link> and <meta> tags itself. Vite
 * has no such convention: anything in `public/` is served at the root under its
 * own name and nothing is injected. So the files land in each project's
 * `public/` under their conventional web names, and each `index.html` carries
 * the tags explicitly. Add a file here and you must add its tag there too —
 * that is the trade for not having a framework do it.
 *
 * One thing this script cannot do for you: `og:image` has to be an absolute URL.
 * Facebook, X, LinkedIn and WhatsApp all resolve it against nothing, so a
 * relative `/og.png` unfurls as a blank card. The tag in each `index.html`
 * carries the full origin, and that origin has to be edited when the site moves
 * to its real domain. It is the only hard-coded host in any of the three
 * projects; grep for `og:image` to find every one of them.
 *
 * Requires `sharp`. It is not a dependency of any of the three projects — this
 * script is a build-time tool, not part of an app — so install it globally or
 * run it with `npx -y -p sharp node tools/brand-assets/generate-icons.mjs`.
 */

import sharp from "sharp";
import { readFile, writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");

const SURFACE = "#0C1121"; // tile — BRAND.surface
const BLUE = "#2599F6"; // glyph — BRAND.blue

/** 76.7 % height fill. Our corner, our radius. */
const VIEWBOX = "68 27 264 264";
/** 66.6 % fill, for anywhere the platform masks the corners itself. iOS. */
const VIEWBOX_SAFE = "48 7 304 304";
/** Corner radius as a fraction of the tile edge — 9 px on 34 px, from the landing header. */
const RADIUS_RATIO = 9 / 34;

/** ICO carries these three. 16 is the tab strip, 32 is the bookmark bar, 48 is Windows. */
const ICO_SIZES = [16, 32, 48];
const APPLE = 180;

/* Three independent projects, three `public/` directories. Keyed by folder name
   so the argument you pass on the command line is the folder you are looking at. */
const APPS = {
  landing: { dir: "landing/public", og: true },
  client: { dir: "client/public", og: true },
  // admin is noindex — nothing will ever unfurl a link to it, so no OG card.
  admin: { dir: "admin/public", og: false },
};

/** Pull the two glyph paths out of the canonical asset rather than restating them. */
async function markPaths() {
  const svg = await readFile(join(HERE, "mark.svg"), "utf8");
  const paths = [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
  if (paths.length !== 2) {
    throw new Error(`assets/mark.svg: expected 2 paths, found ${paths.length}`);
  }
  return paths;
}

/**
 * A square tile with the glyph centred on it.
 * `rounded: false` gives a full-bleed square — what iOS wants, since it masks its own.
 */
function tileSvg(paths, { size, viewBox, rounded = true }) {
  const [x, y, w, h] = viewBox.split(" ").map(Number);
  const r = rounded ? +(w * RADIUS_RATIO).toFixed(2) : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${SURFACE}"/>
  <g fill="${BLUE}">${paths.map((d) => `<path d="${d}"/>`).join("")}</g>
</svg>`;
}

/**
 * Wrap PNGs in an ICO container.
 *
 * Hand-written because sharp cannot write ICO and the format is 6 bytes of header
 * plus 16 per entry — not worth a dependency. PNG-encoded entries (rather than BMP)
 * have been valid since Vista and are what every browser in use reads.
 */
function ico(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = header.length + dir.length;
  entries.forEach(({ size, buf }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o); // 0 encodes 256
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2); // palette entries — 0 for truecolour
    dir.writeUInt8(0, o + 3); // reserved
    dir.writeUInt16LE(1, o + 4); // colour planes
    dir.writeUInt16LE(32, o + 6); // bits per pixel
    dir.writeUInt32LE(buf.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += buf.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.buf)]);
}

/** Render at 4× and let Lanczos bring it down — the mark is a monoline and thin strokes need it. */
const raster = (svg, size) =>
  sharp(Buffer.from(svg), { density: 72 * 4 })
    .resize(size, size, { kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toBuffer();

async function main() {
  const wanted = process.argv.slice(2);
  const names = wanted.length ? wanted : Object.keys(APPS);
  for (const n of names) {
    if (!APPS[n]) throw new Error(`unknown app "${n}" — expected one of ${Object.keys(APPS).join(", ")}`);
  }

  const paths = await markPaths();
  const ogSvg = await readFile(join(HERE, "og-brand.svg"));
  const written = [];

  for (const name of names) {
    const { dir, og } = APPS[name];
    const out = join(REPO, dir);
    await access(out); // fail loudly if a project moved, rather than creating a stray directory

    // favicon.svg — the modern favicon. Vector, so it is sharp at any tab-strip
    // density. Named for the <link> in index.html, not for a framework.
    const iconSvg = tileSvg(paths, { size: 512, viewBox: VIEWBOX }) + "\n";
    await writeFile(join(out, "favicon.svg"), iconSvg);
    written.push([dir + "/favicon.svg", Buffer.byteLength(iconSvg)]);

    // favicon.ico — the legacy fallback, and still what several feed readers ask for.
    const entries = [];
    for (const size of ICO_SIZES) {
      entries.push({ size, buf: await raster(tileSvg(paths, { size, viewBox: VIEWBOX }), size) });
    }
    const icoBuf = ico(entries);
    await writeFile(join(out, "favicon.ico"), icoBuf);
    written.push([dir + "/favicon.ico", icoBuf.length]);

    // apple-touch-icon.png — full bleed, no rounding, wider margin. iOS masks and
    // never composites transparency, so this has to be opaque and square. The name
    // is the one Safari looks for at the site root even with no <link> tag.
    const apple = await raster(
      tileSvg(paths, { size: APPLE, viewBox: VIEWBOX_SAFE, rounded: false }),
      APPLE,
    );
    await writeFile(join(out, "apple-touch-icon.png"), apple);
    written.push([dir + "/apple-touch-icon.png", apple.length]);

    if (og) {
      const card = await sharp(ogSvg).png({ compressionLevel: 9 }).toBuffer();
      await writeFile(join(out, "og.png"), card);
      written.push([dir + "/og.png", card.length]);
    }
  }

  const pad = Math.max(...written.map(([f]) => f.length));
  for (const [f, n] of written) {
    console.log(`  ${f.padEnd(pad)}  ${String(n).padStart(7)} B`);
  }
  console.log(`\n${written.length} files, ${written.reduce((a, [, n]) => a + n, 0)} B total`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
