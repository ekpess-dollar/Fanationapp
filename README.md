# Fanation — client

The fan and creator app. Standalone React single-page app: Vite 6, React 19,
React Router 7, Zustand. No framework, no server, no build-time coupling to the
landing site or the admin console.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # typecheck, then dist/
npm run preview    # serve dist/ exactly as a host would
```

## What is in here

| Path | What it is |
| --- | --- |
| `src/App.tsx` | Every URL in the app, in one list |
| `src/main.tsx` | Mounts React into `#root` and wraps it in `BrowserRouter` |
| `src/routes/_shell.tsx` | The layout route — sidebar, topbar, phone tab bar |
| `src/routes/**` | One file per page |
| `src/components/**` | Pieces used by more than one page |
| `src/lib/core` | Store, seed data, types |
| `src/lib/ui` | Design system: components, `styles.css`, media resolvers |
| `src/lib/brand` | Colour tokens, the logo, the generated media table |
| `public/img` | The photographs and video the demo renders |

`src/lib` is vendored, not a package. The admin console carries its own copy of
`ui` and `brand`. That is deliberate — neither project depends on the other, so
either can be deployed, rolled back or handed to a different team without
touching the other. The cost is that a change to the design system has to be
made twice. `src/lib/ui/styles.css` says so at the top of the file.

## Routing

React Router in `BrowserRouter` mode: real paths, no hash. `/creator/:handle`
is the only parameterised route, and an unknown handle falls back to the first
seeded creator rather than throwing, so a stale link still lands on a page.
Anything unmatched redirects to `/feed`.

## Deploying

The one thing a single-page app needs from its host: **every path must serve
`index.html`**. The files under `dist/` are `index.html` and `assets/` — there is
no `studio/earnings/index.html`, and there never will be. Without a rewrite rule
the first page load works and a hard refresh on any inner page returns 404.

`vercel.json` and `netlify.toml` are both in this folder; each host reads only
its own. For anything else:

**Cloudflare Pages** — create `public/_redirects`:

```
/*  /index.html  200
```

**nginx**

```nginx
root /var/www/fanation-client/dist;

location / {
  try_files $uri $uri/ /index.html;
}

location /assets/ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}
```

**Apache** — `dist/.htaccess`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

Cache `assets/*` forever — Vite fingerprints every file in it. Never cache
`index.html`; it is the only file that knows the current fingerprints.

## Regenerating media

The photographs and the `src/lib/brand/media.ts` lookup table are produced by
`tools/brand-assets/build.mjs` at the repo root, which writes into both this
project and `admin`. Run it from the repo root:

```bash
node tools/brand-assets/build.mjs
```

## Regenerating icons

```bash
npm install -g sharp                          # once
node tools/brand-assets/generate-icons.mjs    # from the repo root
```

Writes `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` and `og.png` into `public/`. Vite injects no
tags, so every one of those files is declared by hand in `index.html` — add a
file, add its tag.

## Responsive behaviour

Desktop-first, with one breakpoint at 900px and a second at 560px, both in
`src/lib/ui/styles.css`. Below 900px the sidebar is replaced by a bottom tab bar
plus a More drawer, fixed-width rails stack under the content they support, and
the messenger shows one pane at a time. Above it, nothing changed.

## Not built yet

Auth is a boolean in the store and the guard in `_shell.tsx` is a `useEffect`.
Replace both with a real session at integration. Every store action that would
hit an endpoint is marked `BACKEND SEAM`.
