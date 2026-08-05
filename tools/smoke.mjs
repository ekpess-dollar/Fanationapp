#!/usr/bin/env node
/**
 * Behavioural smoke test — drives production builds of client (:3000) and
 * admin (:3001).
 *
 *     cd client && npm run build && npm run preview   # terminal one
 *     cd admin  && npm run build && npm run preview   # terminal two
 *     node tools/smoke.mjs                            # terminal three
 *
 * This is the companion to `verify-responsive.mjs`, and the two do not overlap.
 * That one asks whether every page fits and can be navigated at three widths.
 * This one asks whether the product still *works*: that a suspend refuses to
 * submit without a reason, that a $12,400 payout needs two approvals, that the
 * audit log actually captured what just happened. Layout regressions and logic
 * regressions do not look alike and are not caught by the same check.
 *
 * All post-login navigation is client-side — clicking the nav, never `goto` —
 * because auth state is in-memory by design and a hard reload bounces you back
 * to /login. One assertion deliberately proves that, then signs in again.
 */

import { chromium, launchOpts } from "./playwright-env.mjs";

const WEB = process.env.BASE_CLIENT || "http://localhost:3000";
const ADMIN = process.env.BASE_ADMIN || "http://localhost:3001";

let passed = 0;
let failed = 0;
const ok = (name, cond) => {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ FAIL " + name); }
};

const browser = await chromium.launch(launchOpts);
const errors = [];

/* `waitForURL` resolves the moment the History API entry changes, which in a
   client-rendered app is before React has committed anything — assert straight
   after it and you are reading the previous screen. Two nested animation frames
   get most of the way there. They are not a guarantee: a route swap that mounts
   42 post cards commits across many frames, so the frames can both paint while
   the old screen is still up. `seen` below is what closes that gap. */
const settle = async (pg) => {
  await pg.waitForLoadState("networkidle");
  await pg.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

/* `count()` is one synchronous read of the DOM, so `count() > 0` asks "is it
   there *now*" when the question every assertion below actually means is "is it
   there at all". On the feed those are different questions: measured over ten
   runs, the sign-in assertion was true on one of them with a bare `count()` and
   on ten of ten with this, because the feed commits roughly 300ms after the URL
   changes. Polling cannot pass early and cannot fail early — a genuinely absent
   element still costs the full timeout and still fails. */
const seen = async (loc, min = 1, timeout = 6000) => {
  const deadline = Date.now() + timeout;
  for (;;) {
    if ((await loc.count()) >= min) return true;
    if (Date.now() > deadline) return false;
    await new Promise((r) => setTimeout(r, 50));
  }
};

/* ─────────────────────────── client: fan + creator ─────────────────────────── */

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => errors.push("client: " + e.message));

console.log("— CLIENT (fan / creator) —");
await page.goto(WEB + "/", { waitUntil: "networkidle" });
ok("unauthenticated / redirects to /login", page.url().includes("/login"));

await page.click("button.btn-blue");
await page.waitForURL("**/feed", { timeout: 8000 });
await settle(page);
ok("mock sign-in lands on /feed", page.url().includes("/feed"));
ok("feed renders creator posts", await seen(page.locator("text=@sofiaa")));

/* Hard reload → store resets → the shell's guard bounces back to login. This is
   the documented behaviour, so it is asserted rather than worked around. */
await page.goto(WEB + "/wallet", { waitUntil: "networkidle" });
ok("hard reload logs out (guard works)", page.url().includes("/login"));
await page.click("button.btn-blue");
await page.waitForURL("**/feed");
await settle(page);

await page.click(".side >> text=Explore");
await page.waitForURL("**/explore");
await settle(page);
ok("explore renders creator cards", await seen(page.locator("text=Subscribe"), 2));

await page.click(".side >> text=Wallet");
await page.waitForURL("**/wallet");
await settle(page);
ok("wallet shows coin balance", await seen(page.locator("text=12,400")));

await page.click(".topbar >> text=Studio");
await page.waitForURL("**/studio");
await settle(page);
ok("studio pill switches surface", page.url().endsWith("/studio"));
ok("studio dashboard renders", await seen(page.locator("text=/Go live|Earnings|Dashboard/i")));

await page.click(".side >> text=Content");
await page.waitForURL("**/studio/content");
await settle(page);
await page.fill("textarea", "Smoke test post");
await page.click("button:has-text('Publish')");
await page.waitForTimeout(300);
ok("publish adds to Your content", await seen(page.locator("text=Just now")));

await page.click(".topbar >> text=Browse");
await page.waitForURL("**/feed");
await settle(page);
const firstHeart = page.locator(".postacts button.row.gap6").first();
const t0 = await firstHeart.textContent();
await firstHeart.click();
await page.waitForTimeout(200);
const t1 = await firstHeart.textContent();
ok(`like toggles count (${t0.trim()} → ${t1.trim()})`, t0 !== t1);

/* ──────────────────────────────── admin console ───────────────────────────── */

console.log("— ADMIN —");
const admin = await browser.newPage({ viewport: { width: 1440, height: 900 } });
admin.on("pageerror", (e) => errors.push("admin: " + e.message));

await admin.goto(ADMIN + "/", { waitUntil: "networkidle" });
ok("admin unauthed redirects to /login", admin.url().includes("/login"));
await admin.click("button:has-text('Sign in')");
await admin.waitForURL("**/overview", { timeout: 8000 });
await settle(admin);
ok("admin sign-in lands on /overview", admin.url().includes("/overview"));
ok("overview needs-attention renders", await seen(admin.locator("text=/open reports|payout|KYC/i")));

/* Users — suspend is reason-gated. The gate is the assertion, not the suspend. */
await admin.click(".side >> text=Users");
await admin.waitForURL("**/users");
await settle(admin);
ok("users table renders", await seen(admin.locator("text=@baduser")));
const jayRow = admin.locator(".card > div", { hasText: "@jay_88" }).first();
await jayRow.locator("button").last().click();
await admin.waitForTimeout(250);
await admin.locator(".menu >> text=Suspend…").click();
await admin.waitForTimeout(250);
const goBtn = admin.locator(".modal button", { hasText: "Suspend account" });
ok("suspend confirm is reason-gated", await goBtn.isDisabled());
await admin.locator(".modal label", { hasText: "Harassment" }).first().click();
ok("picking a reason enables confirm", !(await goBtn.isDisabled()));
await admin.locator(".modal .tag", { hasText: "7 days" }).click();
await goBtn.click();
await admin.waitForTimeout(400);
ok("suspend toast fires", await seen(admin.locator("text=/@jay_88 suspended/i")));

/* Payouts — the $10,000 co-sign threshold and the sanctioned-account warning. */
await admin.click(".side >> text=Payouts");
await admin.waitForURL("**/payouts");
await settle(admin);
ok("payout queue renders $12,400 request", await seen(admin.locator("text=$12,400")));
ok("sanctioned-account warning shows", await seen(admin.locator("text=/Account sanctioned/i")));
const bigRow = admin.locator(".card", { hasText: "$12,400" }).first();
await bigRow.locator("button", { hasText: "Approve (1 of 2)" }).click();
await admin.waitForTimeout(250);
await admin.locator(".modal button", { hasText: "Record first approval" }).click();
await admin.waitForTimeout(400);
ok("first approval → Awaiting co-sign", await seen(admin.locator("text=Awaiting co-sign")));
await admin.locator(".card", { hasText: "$12,400" }).first().locator("button", { hasText: "Co-sign & release" }).click();
await admin.waitForTimeout(250);
await admin.locator(".modal button", { hasText: "Co-sign & release" }).click();
await admin.waitForTimeout(400);
ok("co-sign → Paid in session list", await seen(admin.locator("text=Actioned this session")));

await admin.click(".side >> text=KYC review");
await admin.waitForURL("**/kyc");
await settle(admin);
await admin.locator(".card", { hasText: "@dembefit" }).locator("button", { hasText: "Approve" }).click();
await admin.waitForTimeout(250);
await admin.locator(".modal button", { hasText: "Approve verification" }).click();
await admin.waitForTimeout(400);
ok("KYC approve → processed list", await seen(admin.locator("text=Processed this session")));

await admin.click(".side >> text=Moderation");
await admin.waitForURL("**/moderation");
await settle(admin);
await admin.locator("button", { hasText: "Review" }).first().click();
await admin.waitForTimeout(200);
await admin.locator("button", { hasText: "Dismiss…" }).click();
await admin.waitForTimeout(200);
const dg = admin.locator(".modal button", { hasText: "Dismiss report" });
ok("dismiss is reason-gated", await dg.isDisabled());
await admin.locator(".modal label", { hasText: "Duplicate report" }).click();
await dg.click();
await admin.waitForTimeout(400);
ok("report lands in resolved list", await seen(admin.locator("text=Resolved this session")));

/* The audit log is the point of all of the above — an action that does not
   land here is an action the platform cannot answer questions about later. */
await admin.click(".side >> text=Audit log");
await admin.waitForURL("**/audit");
await settle(admin);
const auditRows = admin.locator("text=Just now");
const justNowOk = await seen(auditRows, 4);
ok(`audit captured session actions (${await auditRows.count()} new)`, justNowOk);
await admin.locator(".tag", { hasText: "Finance" }).first().click();
await admin.waitForTimeout(200);
ok("audit category filter works", await seen(admin.locator("text=/payout/i")));

const kycNav = await admin.locator(".navi", { hasText: "KYC review" }).textContent();
ok("sidebar KYC badge decremented to 3", kycNav.includes("3"));

console.log(`\n${passed} passed, ${failed} failed`);
if (errors.length) {
  console.log("PAGE ERRORS:");
  errors.slice(0, 10).forEach((e) => console.log("  " + e));
}
await browser.close();
process.exit(failed > 0 || errors.length > 0 ? 1 : 0);
