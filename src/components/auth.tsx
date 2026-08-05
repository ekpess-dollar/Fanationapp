import { useState } from "react";
import { useAppStore } from "@/lib/core";
import { Icon, Photo, SIZES, mediaFor } from "@/lib/ui";

/**
 * The pieces /login and /signup share.
 *
 * Both routes render outside the app shell — no sidebar, no tab bar, nothing to
 * navigate to until you are signed in — so they are the only two screens in the
 * product that have to carry their own frame. They now carry the same one: a
 * form column on the left, a hero on the right, and the same field components
 * inside the card so a password behaves identically on both.
 */

/* ── hero ─────────────────────────────────────────────────────────────────── */

/* Nine distinct photographs across nine categories, so no two tiles in view are
   the same picture and the three columns do not read as one repeated strip.
   These come from `mediaFor` — the same pool the feed and the explore grid paint
   from — so the sign-in screen is showing the actual product rather than a stock
   gradient, and nothing new had to be added to `public/`.

   Three per column rather than four, because the tile height is now a third of
   the column (see `.authtile`) and a third of a tall window is a portrait frame
   where a quarter is a letterbox. Each column renders its three twice; that
   duplicate is the whole of the seam trick, and with the spacing carried as a
   bottom margin the keyframe is a flat -50% with no correction term. */
const COLS: Array<Array<[string, number]>> = [
  [["life", 0], ["model", 1], ["trav", 2]],
  [["dance", 0], ["music", 1], ["fit", 2]],
  [["vlog", 0], ["glow", 1], ["food", 2]],
];

/* The landing site's numbers, to the digit. If they change there they change
   here — two different figures for one claim across two pages of the same
   product is the first thing a client notices. */
const STATS: Array<[string, string]> = [
  ["$4.2M+", "Paid out to creators"],
  ["12K+", "Active creators"],
  ["2.4M", "Coins gifted daily"],
  ["24h", "Payout turnaround"],
];

/**
 * The right half of the split. Below 960px the same markup becomes the
 * background behind the form — see `@media(max-width:960px)` in styles.css.
 * There is no branch here and no second component; only the CSS changes.
 */
export function AuthHero({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="authhero">
      <div className="authmosaic" aria-hidden>
        {COLS.map((col, ci) => (
          <div key={ci} className={`authcol d${ci + 1}`}>
            {[...col, ...col].map(([cat, n], ti) => (
              <div key={`${cat}${n}-${ti}`} className="authtile">
                <Photo sizes={SIZES.authTile} src={mediaFor(cat, n)} seed={`${cat}${n}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="authveil" aria-hidden />

      <div className="authcopy">
        {/* Both of these were inline styles until light mode needed to reach the
            two colours in them. Values transcribed exactly — see `.authtitle`
            and `.authsub` in styles.css — so the dark render did not move. */}
        <div className="display authtitle">{title}</div>
        <div className="authsub">{sub}</div>
        <div className="authstats">
          {STATS.map(([v, l]) => (
            <div key={v} className="authstat"><b>{v}</b><span>{l}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── fields ───────────────────────────────────────────────────────────────── */

/**
 * Password input with a reveal toggle.
 *
 * The icon set has `eye` and no `eye-off`, so the state is carried by colour
 * rather than by a second glyph — blue while the value is visible, muted while
 * it is not. `aria-label` changes with it, which is what a screen reader reads
 * and what a test would assert on.
 */
export function PasswordField({ id, value, onChange, placeholder = "••••••••", autoComplete }: {
  id?: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input id={id} className="input" type={show ? "text" : "password"} value={value} placeholder={placeholder}
        autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} style={{ paddingRight: 46 }} />
      <button type="button" className="autheye" onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}>
        <Icon n="eye" s={17} c={show ? "var(--blue-ink)" : "var(--muted)"} />
      </button>
    </div>
  );
}

/* Brand marks, inline. Two 18px glyphs are not worth a dependency, and an icon
   from our own set on a button that says "Google" reads as unfinished. */
function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.8-2 5.1-4.4 6.7v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.4z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.6-3.9-12.3-9.1H4.3v5.7C7.9 41.1 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.7 28.2c-.4-1.3-.7-2.7-.7-4.2s.2-2.9.7-4.2v-5.7H4.3A22 22 0 0 0 2 24c0 3.6.9 6.9 2.3 9.9l7.4-5.7z" />
      <path fill="#EA4335" d="M24 10.7c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.1 29.9 2 24 2 15.4 2 7.9 6.9 4.3 14.1l7.4 5.7c1.7-5.2 6.6-9.1 12.3-9.1z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M16.4 12.7c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9s-2-.9-3.3-.8c-1.7 0-3.2 1-4.1 2.5-1.7 3-.4 7.5 1.3 9.9.8 1.2 1.8 2.5 3.1 2.5 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8 2.2-1.2 3-2.4c.9-1.4 1.3-2.7 1.3-2.8 0 0-2.4-.9-2.4-3.6zM14 5.3c.7-.8 1.1-2 1-3.3-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3.1 1.1.1 2.2-.6 2.9-1.3z" />
    </svg>
  );
}

/**
 * Social sign-in. Deliberately `.btn-ghost`, never `.btn-blue` — both auth
 * pages are entered by the verification scripts through `button.btn-blue`, and
 * that selector has to keep resolving to exactly one element, the primary
 * action. Auth is mocked, so every route in lands in the same place.
 */
export function SocialRow({ onPick }: { onPick: () => void }) {
  return (
    <div className="grid g2 gap10">
      <button className="btn btn-ghost btn-block" onClick={onPick}><GoogleMark />Google</button>
      <button className="btn btn-ghost btn-block" onClick={onPick}><AppleMark />Apple</button>
    </div>
  );
}

/**
 * The consent line under the card.
 *
 * Both documents are styled as links and both are wired, because a demo where
 * something looks clickable and does nothing is the thing a client clicks
 * first. There are no static pages behind them yet, so the toast says where
 * they will live rather than pretending to open them.
 */
export function AuthLegal({ verb }: { verb: string }) {
  const toast = useAppStore((s) => s.toast);
  const open = (doc: string, slug: string) => () => toast(`${doc} — fanation.com/${slug}`);
  return (
    <div className="authlegal">
      By {verb} you agree to Fanation&apos;s{" "}
      <b onClick={open("Terms of Service", "terms")}>Terms of Service</b> and{" "}
      <b onClick={open("Privacy Policy", "privacy")}>Privacy Policy</b>.
    </div>
  );
}
