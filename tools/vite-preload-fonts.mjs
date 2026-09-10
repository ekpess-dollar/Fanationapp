/* Tell the browser about the body face before it has parsed the stylesheet.
 *
 * Inter comes in through `@fontsource-variable/inter`, which means its URL is
 * written inside our CSS bundle. The browser cannot see that URL until it has
 * downloaded and parsed the CSS, and the CSS is render-blocking, so the font
 * request starts one full round trip after it could have. On a slow connection
 * that gap is exactly the window in which the page paints in the fallback face
 * and then reflows — the layout shift we are trying to close.
 *
 * A `<link rel="preload">` in the head moves discovery to the HTML preload
 * scanner, which runs before any stylesheet has been fetched.
 *
 * Two details that are easy to get wrong and silently expensive:
 *
 *   `crossorigin` is mandatory. Fonts are always fetched in CORS mode, so a
 *   preload without it lands in a different cache partition than the real
 *   request and the browser downloads the file twice — worse than not
 *   preloading at all. Chrome does warn, in a console nobody reads.
 *
 *   Only the latin subset is preloaded. Fontsource ships seven, each behind its
 *   own `unicode-range`, and a browser only fetches the ones a page actually
 *   needs. Preloading all seven would force six unnecessary downloads onto
 *   every visitor to save nothing.
 *
 * The work happens in `closeBundle` against the files on disk rather than in
 * `transformIndexHtml` against the Rollup bundle, because assets referenced
 * from CSS carry a placeholder that is not resolved to a final filename until
 * late in `generateBundle`. Reading the directory afterwards is not clever, but
 * it cannot be wrong about what was emitted.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DEFAULT_MATCH = /^inter-latin-wght-normal-[A-Za-z0-9_-]+\.woff2$/

export default function preloadFonts({ match = DEFAULT_MATCH } = {}) {
  let outDir = 'dist'
  let base = '/'

  return {
    name: 'fanation:preload-fonts',
    apply: 'build',

    configResolved(cfg) {
      outDir = cfg.build.outDir
      base = cfg.base || '/'
      // Resolve outDir against the project root the same way Vite does.
      outDir = join(cfg.root, outDir)
    },

    closeBundle() {
      const html = join(outDir, 'index.html')
      const assetDir = join(outDir, 'assets')
      if (!existsSync(html) || !existsSync(assetDir)) return

      const fonts = readdirSync(assetDir).filter(f => match.test(f))
      if (!fonts.length) {
        this.warn('preload-fonts: no latin Inter woff2 found in assets/, nothing preloaded')
        return
      }

      let src = readFileSync(html, 'utf8')
      const links = fonts
        .map(f => `    <link rel="preload" as="font" type="font/woff2" crossorigin href="${base}assets/${f}">`)
        .join('\n')

      /* Ahead of the stylesheet link so the scanner reaches it first, and after
         the charset/viewport meta so nothing displaces the encoding
         declaration out of the first 1024 bytes. */
      const anchor = src.indexOf('<link rel="stylesheet"')
      if (anchor === -1) {
        src = src.replace('</head>', `${links}\n  </head>`)
      } else {
        const lineStart = src.lastIndexOf('\n', anchor) + 1
        src = src.slice(0, lineStart) + links + '\n' + src.slice(lineStart)
      }

      writeFileSync(html, src)
      // eslint-disable-next-line no-console
      console.log(`  preloaded ${fonts.length} font file${fonts.length > 1 ? 's' : ''}: ${fonts.join(', ')}`)
    },
  }
}
