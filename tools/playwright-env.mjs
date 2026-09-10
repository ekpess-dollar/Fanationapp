/**
 * Where Playwright and Chromium are, resolved from the environment.
 *
 * On a normal machine this file does nothing interesting: `npm i -D playwright`
 * puts the module where Node's resolver will find it and `npx playwright install
 * chromium` puts the browser where Playwright expects it, so both exports fall
 * through to their defaults and neither script needs to know a path.
 *
 * The two escape hatches exist for CI images and sandboxes that already carry a
 * browser and do not want a second copy of it:
 *
 *   PLAYWRIGHT_MODULE   absolute path to playwright's entry point, for when the
 *                       module is installed globally. Node's ESM resolver does
 *                       not read NODE_PATH, so a global install is invisible to
 *                       a bare `import "playwright"` — the path has to be given.
 *   CHROMIUM_PATH       absolute path to the chrome binary. Setting this also
 *                       turns on --no-sandbox, because an image that ships its
 *                       own Chromium is almost always running as root, where
 *                       the sandbox refuses to start.
 *
 * Playwright's own package is CommonJS, so the import is a default import that
 * gets destructured rather than `import { chromium }`, which throws.
 */

const MODULE = process.env.PLAYWRIGHT_MODULE || "playwright";
const pw = (await import(MODULE)).default ?? (await import(MODULE));

export const { chromium } = pw;

export const launchOpts = process.env.CHROMIUM_PATH
  ? { executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] }
  : {};
