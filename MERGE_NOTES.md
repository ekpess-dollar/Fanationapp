# Landing + client merge notes

## What changed

- The landing page is now the `/` route of the client application.
- Existing product routes remain unchanged: `/login`, `/signup`, `/feed`, `/explore`, `/studio`, and the other client routes.
- Landing-page images now live in `public/images`.
- Landing-page code now lives in `src/features/landing`.
- The landing navigation and creator CTAs now use React Router:
  - **Log in** → `/login`
  - **Start Creating** and creator CTAs → `/signup`
- The landing page and product now share the same `fanation.theme` preference.
- Tailwind CSS is enabled only for the landing feature. Tailwind Preflight is disabled, and landing theme variables are scoped to `.landing-page`, so the existing product CSS is not replaced.
- Vercel keeps the SPA rewrite to `index.html`; the redundant custom `ignoreCommand` was removed.

## Run locally

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000/` for the landing page
- `http://localhost:3000/login`
- `http://localhost:3000/signup`
- `http://localhost:3000/feed`

## Production check

```bash
npm run build
npm run preview
```

## Links still awaiting real destinations

The original landing project used `href="#"` placeholders for app-store badges, social profiles, support, footer company pages, and legal pages. Those remain placeholders because no destination URLs were supplied. The login and signup CTAs have been connected.
