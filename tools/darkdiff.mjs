/* Dark byte-identity, end to end.

   The token file proves `--blue-ink` and `--blue` hold the same hex. That is an
   argument, not a measurement. This walks every route of both builds — the
   baseline and the working tree — in dark, harvests the *resolved* paint of every
   element, and compares. If the ink split did what it claims, the two are
   identical.

   Computed style rather than pixels, deliberately. The app runs marquees, a live
   timer and a carousel, so two screenshots of the same build differ from each
   other; a pixel diff would be measuring animation phase, not colour. Resolved
   `color` / `background-color` / `border-*-color` / `fill` / `stroke` / `outline`
   / `box-shadow` is exactly the surface this change can touch and nothing else.

   Usage: node tools/darkdiff.mjs <before-origin> <after-origin> <client|admin|landing> */
import { chromium, launchOpts } from "./playwright-env.mjs";

const [BEFORE, AFTER, KIND] = process.argv.slice(2);

const ROUTES = {
  client: ['/feed', '/explore', '/reels', '/live', '/messages', '/notifications', '/collections',
    '/subscriptions', '/wallet', '/settings', '/creator/sofiaa', '/studio', '/studio/analytics',
    '/studio/content', '/studio/earnings', '/studio/fans', '/studio/live', '/studio/messages',
    '/studio/payouts', '/studio/promos', '/studio/tiers', '/studio/vault', '/studio/verify'],
  admin: ['/overview', '/users', '/creators', '/moderation', '/payouts', '/kyc', '/finance',
    '/reports', '/audit'],
  /* One page, no router, no inside. The marketing site is a single document and
     `/` is the whole of it. */
  landing: ['/'],
};
/* Routes that render outside the shell, walked before the sign-in click.
   These were a blind spot: `/login` and `/signup` are the only two screens that
   carry their own frame, they are the first thing anyone sees, and nothing in
   this pass looked at them until the auth hero got a light palette of its own.
   Admin's `/` is the same screen for the console and joined the list when its
   backdrop was rebuilt — before that, the one page every member of staff sees
   every morning was the only page nothing checked. */
const PRE = { client: ['/login', '/signup'], admin: ['/'], landing: [] };
/* `null` means the app has no signed-out boundary to cross. */
const SIGNIN = { client: 'button.btn-blue', admin: "button:has-text('Sign in')", landing: null };

const PROPS = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor',
  'borderBottomColor', 'borderLeftColor', 'outlineColor', 'fill', 'stroke', 'boxShadow',
  'backgroundImage', 'textDecorationColor', 'caretColor', 'accentColor'];

/* Elements this change is allowed to add, per route, as [tagName, count, why].
   Everything else is a regression by default.

   Nothing here is a licence to change an existing element's paint: an element
   whose colour moved leaves its old harvest string behind as a removal, and
   removals are never allowed. This list only forgives DOM that did not exist in
   the baseline at all — and it is spelled out one tag at a time so the diff
   cannot quietly absorb a second button someone added on the way past.

   `tagName` is uppercase for HTML and as-authored for SVG, which is why the
   glyph's three nodes are lowercase. `'*'` declares an addition on every route of
   that app, for the things that come from index.html and are therefore on all of
   them.

   Empty is the normal state. It was not empty while the light-mode work was
   uncommitted: the pre-paint script in all three index.html files was declared
   under `'*'`, and landing's theme toggle — BUTTON, svg, circle, path — under
   `'/'`. Both of those are now *in* the baseline. `6c2cfcc` shipped the script
   and `a5835fd` shipped the toggle, and the baseline this runs against is
   `a5835fd`, so the nodes exist on both sides and there is nothing left to
   forgive. Leaving the declarations in place failed all 25 client routes on the
   never-appeared check, which is the guard working: a rule outlived its change
   and said so instead of rotting quietly. Empty it again after every rebase of
   the baseline. */
const ADDED = {};

/* Paint this change is allowed to alter in dark, as [before, after, why].

   Byte-identity is the rule and this is the door out of it, deliberately narrow.
   Each entry is a plain string swap applied to the *baseline* harvest before the
   comparison, so it forgives one hex becoming another everywhere that hex was
   used — which is what changing a token actually does — and forgives nothing
   else. Two consequences worth stating: the swap cannot be scoped to one element,
   so anything you put here you are claiming site-wide; and a rule that matches
   nothing fails the run, so the list cannot quietly outlive the change it
   describes. */
const CHANGED = {};

const harvest = (props) =>
  [...document.querySelectorAll('*')].map((el) => {
    const cs = getComputedStyle(el);
    return el.tagName + '|' + props.map((p) => cs[p]).join('|');
  });

/* Desktop is the default because that is where the palette was authored and where
   almost every rule lands. But a breakpoint can bring a rule to life that was
   dead at 1440 — a `@media (max-width:767px)` block that nothing ever entered
   until an element picked up the class it hangs off. Overriding the viewport
   lets the same byte-identity claim be made at the widths where those rules run,
   instead of assumed from the one width where they never execute. */
const VW = Number(process.env.DARKDIFF_W) || 1440;
const VH = Number(process.env.DARKDIFF_H) || 900;

async function walk(origin) {
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });
  /* Freeze animation before anything paints. The LIVE badge pulses its box-shadow
     via `pulseglow`, so two harvests of the *same* build disagree on that element
     — a rgba(239,68,68,.21)/.184 alpha wobble that has nothing to do with this
     change. Killing animation makes the comparison measure colour, which is the
     only thing being claimed. */
  await page.addInitScript(() => {
    addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
      document.head.appendChild(s);
    });
  });
  const out = new Map();
  /* Signed-out first, by `goto`, because these are the routes a fresh document
     actually lands on and the click below is one-way. */
  for (const r of PRE[KIND]) {
    await page.goto(origin + r, { waitUntil: 'networkidle' });
    await page.waitForTimeout(450);
    const rows = await page.evaluate(harvest, PROPS);
    out.set(r, rows.map((s) => s.replaceAll(origin, '«origin»')));
  }
  await page.goto(origin + '/', { waitUntil: 'networkidle' });
  if (SIGNIN[KIND]) {
    await page.click(SIGNIN[KIND]);
    await page.waitForTimeout(700);
  }
  /* Auth lives in memory by design, so a `goto` per route would bounce to /login
     every time. React Router listens on popstate, which is what this drives. On
     landing there is no router and the one route is where we already stand, so
     both lines are no-ops and the wait is just settle time. */
  for (const r of ROUTES[KIND]) {
    await page.evaluate((to) => { history.pushState({}, '', to); dispatchEvent(new PopStateEvent('popstate')); }, r);
    await page.waitForTimeout(450);
    /* `background-image` resolves to an absolute URL, so a harvested photo reads
       `url("http://localhost:4102/images/creator-tobi.jpg")` — the port of
       whichever build served it. The two builds are on two ports by definition,
       so every element with an image would differ on the origin alone and the
       filename after it, which is the part that could actually regress, would
       never get compared. Strip the origin and keep the path. */
    const rows = await page.evaluate(harvest, PROPS);
    out.set(r, rows.map((s) => s.replaceAll(origin, '«origin»')));
  }
  await page.close();
  return out;
}

/* Named the properties in order so a paired diff can say which one moved rather
   than printing two 14-field rows and leaving the reader to align them. */
const diffProps = (x, y) => {
  const X = x.split('|'), Y = y.split('|'), out = [];
  for (let i = 1; i < X.length; i++) if (X[i] !== Y[i]) out.push(`${PROPS[i - 1]}: ${X[i]} → ${Y[i]}`);
  return out;
};

const browser = await chromium.launch(launchOpts);
const a = await walk(BEFORE);
const b = await walk(AFTER);

/* Three lines of each kind is enough to see what broke; DARKDIFF_ALL=1 when you
   want the whole ledger. */
const LIMIT = process.env.DARKDIFF_ALL ? Infinity : 3;

/* An addition declared under `'*'` is the same node on all 23 routes, and dumping
   its harvest string 23 times buries everything else. Print each distinct one
   once; the per-route tally still says it was there. */
const shownAdds = new Set();

let routes = 0, els = 0, diffs = 0, forgiven = 0;
for (const r of [...PRE[KIND], ...ROUTES[KIND]]) {
  let A = a.get(r);
  const B = b.get(r);
  routes++;
  els += A.length;

  /* Rewrite the baseline as though it had always held the new value, then diff.
     Anything the list does not name still fails, and a rule that stops firing
     fails too — see the tally after the loop. */
  for (const [from, to] of CHANGED[KIND] || []) {
    A = A.map((s) => { const n = s.replaceAll(from, to); if (n !== s) forgiven++; return n; });
  }

  /* Multiset, not index-by-index. The old comparison walked both harvests in
     document order, which meant moving an element — same tag, same resolved
     paint, different parent — reported as a difference on every index from there
     to the end of the page, and a page that gained one node failed outright on
     element count before a single colour was compared. Neither is a paint change,
     and this pass exists to catch paint changes.

     Counting instead: a signature that leaves is a removal, a signature that
     arrives is an addition, and a signature that merely relocates cancels to
     zero. Nothing is masked by the swap — an element whose colour changed shows
     up on both sides of the ledger, failing as a removal even if its new value
     happens to collide with some other element's. */
  const delta = new Map();
  for (const s of A) delta.set(s, (delta.get(s) || 0) + 1);
  for (const s of B) delta.set(s, (delta.get(s) || 0) - 1);

  const gone = [], arrived = [];
  for (const [s, n] of delta) {
    for (let i = 0; i < n; i++) gone.push(s);
    for (let i = 0; i < -n; i++) arrived.push(s);
  }

  const declared = [...((ADDED[KIND] || {})['*'] || []), ...((ADDED[KIND] || {})[r] || [])];
  const budget = new Map(), why = new Map();
  for (const [tag, n, w] of declared) {
    budget.set(tag, (budget.get(tag) || 0) + n);
    why.set(tag, w);
  }

  /* Every declared addition is printed whether or not the run is otherwise
     green. A reviewer reading a passing run should still see exactly what got in.
     Declared ones come off the pile first so they cannot be mistaken for the
     "after" half of a changed element in the pairing below. */
  const surplus = [];
  for (const s of arrived) {
    const tag = s.slice(0, s.indexOf('|'));
    const left = budget.get(tag) || 0;
    if (left > 0) {
      budget.set(tag, left - 1);
      if (!shownAdds.has(s)) { shownAdds.add(s); console.log(`  + ${r}  new <${tag}> — ${why.get(tag)}\n      ${s}`); }
    } else surplus.push(s);
  }

  /* Pair what is left by tag. A DIV that lost one signature and gained another is
     a DIV whose paint changed, and saying so — with the property named — beats
     reporting a removal and an addition twenty lines apart. Anything that fails
     to pair really is a bare removal or a bare addition. */
  const pool = new Map();
  for (const s of surplus) {
    const tag = s.slice(0, s.indexOf('|'));
    if (!pool.has(tag)) pool.set(tag, []);
    pool.get(tag).push(s);
  }
  const changed = [], removed = [];
  for (const s of gone) {
    const p = pool.get(s.slice(0, s.indexOf('|')));
    if (p && p.length) changed.push([s, p.shift()]); else removed.push(s);
  }
  const undeclared = [...pool.values()].flat();

  let bad = 0, shown = 0;
  for (const [x, y] of changed) {
    bad++; diffs++;
    if (++shown <= LIMIT) console.log(`  ✗ ${r}  <${x.slice(0, x.indexOf('|'))}> repainted\n      ${diffProps(x, y).join('\n      ')}`);
  }
  for (const s of removed) {
    bad++; diffs++;
    if (++shown <= LIMIT) console.log(`  ✗ ${r}  element no longer painted this way\n      ${s}`);
  }
  for (const s of undeclared) {
    bad++; diffs++;
    if (++shown <= LIMIT) console.log(`  ✗ ${r}  undeclared new element\n      ${s}`);
  }
  /* A declared addition that never showed up means the list has gone stale, or
     the thing it describes stopped rendering. Either way somebody has to look. */
  for (const [tag, left] of budget) {
    if (left > 0) { bad++; diffs++; console.log(`  ✗ ${r}  declared ${left}× <${tag}> never appeared — ${why.get(tag)}`); }
  }

  if (shown > LIMIT) console.log(`      … and ${shown - LIMIT} more on ${r}`);
  if (!bad) {
    const n = declared.reduce((t, d) => t + d[1], 0);
    const extra = n ? ` · ${n} declared addition${n === 1 ? '' : 's'}` : '';
    console.log(`  ✓ ${r.padEnd(22)} ${A.length} elements identical${extra}`);
  }
}
await browser.close();

/* A substitution that never fires is a claim about the baseline that is no longer
   true — the token moved again, or the element stopped existing. Failing on it
   keeps the exception list from outliving the exception. */
const rules = (CHANGED[KIND] || []).length;
if (rules && !forgiven) { diffs++; console.log(`  ✗ ${rules} declared repaint(s) matched nothing in the baseline`); }
const note = rules ? ` · ${forgiven} forgiven by ${rules} declared repaint(s)` : '';

console.log(`\n  ${KIND}: ${routes} routes · ${els} elements · ${diffs} differing${note}`);
process.exit(diffs ? 1 : 0);
