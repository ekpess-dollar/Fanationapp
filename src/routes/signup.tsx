import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/core";
import { Icon, Logo } from "@/lib/ui";
import { AuthHero, AuthLegal, PasswordField, SocialRow } from "@/components/auth";
import { AuthThemeToggle } from "@/components/theme";

/**
 * Create account.
 *
 * The same split screen as /login — form left, hero right, one shared set of
 * field components — so the two screens read as one product rather than two
 * pages that happen to sit next to each other in the router. Everything that is
 * different between them is content: the heading, the hero copy, and this
 * page's password rules.
 *
 * Auth is mocked. `setAuthed(true)` and go; the real provider swaps in at the
 * same call site on both routes (see README).
 */

/* Rules, not a regex, because the checklist below renders straight off this and
   a user who fails a rule should be told which one. `score` is the count that
   passes — the labels are indexed by it, so the array is six long for a score
   of 0..5 and "Strong" appears twice on purpose. */
const LABELS = ["None", "Weak", "Fair", "Good", "Strong", "Strong"];

export default function Signup() {
  const navigate = useNavigate();
  const setAuthed = useAppStore((s) => s.setAuthed);
  const [pw, setPw] = useState("");
  const go = () => { setAuthed(true); navigate("/feed"); };

  const rules: Array<[string, boolean]> = [
    ["8+ characters", pw.length >= 8],
    ["Uppercase", /[A-Z]/.test(pw)],
    ["Lowercase", /[a-z]/.test(pw)],
    ["Number", /[0-9]/.test(pw)],
    ["Special char", /[^A-Za-z0-9]/.test(pw)],
  ];
  const score = rules.filter((r) => r[1]).length;
  const scoreColor = score >= 4 ? "var(--mint-ink)" : score >= 2 ? "var(--amber-ink)" : "var(--muted)";

  return (
    <div className="authwrap">
      <AuthThemeToggle />
      <div className="authform">
        <div className="authinner">
          <div className="authbrand"><Logo /></div>

          <div className="display" style={{ fontSize: 30, marginBottom: 6 }}>Create your account</div>
          <div className="muted t14" style={{ marginBottom: 22 }}>
            Start earning from day one — no approval queue, no gatekeeping.
          </div>

          <div className="card" style={{ padding: 26 }}>
            <SocialRow onPick={go} />
            <div className="authdiv">or with email</div>

            <div className="grid g2 gap12" style={{ marginBottom: 14 }}>
              <div>
                <label className="label" htmlFor="su-first">First name</label>
                <input id="su-first" className="input" autoComplete="given-name" placeholder="Ada" />
              </div>
              <div>
                <label className="label" htmlFor="su-last">Last name</label>
                <input id="su-last" className="input" autoComplete="family-name" placeholder="Obi" />
              </div>
            </div>

            <div className="grid g2 gap12" style={{ marginBottom: 14 }}>
              <div>
                <label className="label" htmlFor="su-email">Email</label>
                <input id="su-email" className="input" type="email" autoComplete="email" placeholder="you@example.com" />
              </div>
              <div>
                <label className="label" htmlFor="su-user">Username</label>
                <input id="su-user" className="input" autoComplete="username" placeholder="adaobi" />
              </div>
            </div>

            <label className="label" htmlFor="signup-pw">Password</label>
            <PasswordField id="signup-pw" value={pw} onChange={setPw} autoComplete="new-password" />

            {/* The meter is not decoration: the same five rules gate the account
                in the real build, so showing which one is outstanding is cheaper
                than an error after submit. */}
            <div className="card" style={{ padding: 14, margin: "14px 0" }}>
              <div className="row between" style={{ marginBottom: 10 }}>
                <span className="up muted">Password strength</span>
                <span className="t12 b7" style={{ color: scoreColor }}>{LABELS[score]}</span>
              </div>
              <div className="progress" style={{ marginBottom: 12 }}><i style={{ width: `${score * 20}%` }} /></div>
              <div className="grid g2 gap8">
                {rules.map((r) => (
                  <div key={r[0]} className="row gap8 t13" style={{ color: r[1] ? "var(--mint-ink)" : "var(--muted2)" }}>
                    <Icon n="check" s={14} />{r[0]}
                  </div>
                ))}
              </div>
            </div>

            {/* The one `.btn-blue` on this page — the social buttons above are
                `.btn-ghost` for the same reason they are on /login. */}
            <button className="btn btn-blue btn-block" onClick={go}>Create Account</button>

            <div className="row center muted t14" style={{ marginTop: 16, gap: 5 }}>
              Already have an account?
              <span className="blue b6" style={{ cursor: "pointer" }} onClick={() => navigate("/login")}>Log in</span>
            </div>
          </div>

          <AuthLegal verb="creating an account" />
        </div>
      </div>

      <AuthHero
        title="Turn an audience into income."
        sub="Set your own tiers, price your own drops, go live whenever you want. Payouts clear the same day and the fan relationship stays yours — not the platform's."
      />
    </div>
  );
}
