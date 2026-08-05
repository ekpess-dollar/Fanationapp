import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/core";
import { Logo } from "@/lib/ui";
import { AuthHero, AuthLegal, PasswordField, SocialRow } from "@/components/auth";
import { AuthThemeToggle } from "@/components/theme";

/** Mock auth — swap for the real auth provider at integration (see README). */
export default function Login() {
  const navigate = useNavigate();
  const setAuthed = useAppStore((s) => s.setAuthed);
  const toast = useAppStore((s) => s.toast);
  const [pw, setPw] = useState("");
  const go = () => { setAuthed(true); navigate("/feed"); };

  return (
    <div className="authwrap">
      <AuthThemeToggle />
      <div className="authform">
        <div className="authinner">
          <div className="authbrand"><Logo /></div>

          <div className="display" style={{ fontSize: 30, marginBottom: 6 }}>Welcome back</div>
          <div className="muted t14" style={{ marginBottom: 22 }}>
            Sign in to pick up where you left off.
          </div>

          <div className="card" style={{ padding: 26 }}>
            <SocialRow onPick={go} />
            <div className="authdiv">or with email</div>

            <label className="label" htmlFor="login-email">Email</label>
            <input id="login-email" className="input" type="email" autoComplete="email"
              placeholder="you@example.com" style={{ marginBottom: 14 }} />

            <div className="row between" style={{ marginBottom: 7 }}>
              <label className="label" htmlFor="login-pw" style={{ marginBottom: 0 }}>Password</label>
              <span className="blue t12 b6" style={{ cursor: "pointer" }}
                onClick={() => toast("Password reset link sent — check your inbox")}>
                Forgot password?
              </span>
            </div>
            <PasswordField id="login-pw" value={pw} onChange={setPw} autoComplete="current-password" />

            <label className="row gap8 muted t13" style={{ margin: "14px 0 16px", cursor: "pointer" }}>
              <input type="checkbox" defaultChecked
                style={{ width: 15, height: 15, accentColor: "var(--blue)", cursor: "pointer" }} />
              Keep me signed in for 30 days
            </label>

            {/* The one `.btn-blue` on this page. `verify-responsive.mjs` and
                `smoke.mjs` both enter the app through exactly this selector, so
                the social buttons above are `.btn-ghost` and stay that way. */}
            <button className="btn btn-blue btn-block" onClick={go}>Sign in</button>

            <div className="row center muted t14" style={{ marginTop: 16, gap: 5 }}>
              Don&apos;t have an account?
              <span className="blue b6" style={{ cursor: "pointer" }} onClick={() => navigate("/signup")}>Create one</span>
            </div>
          </div>

          <AuthLegal verb="continuing" />
        </div>
      </div>

      <AuthHero
        title="Your audience. Your terms."
        sub="Subscriptions, pay-per-view drops, live gifting and coins — one account, one payout, same day. Creators on Fanation keep the relationship and the revenue."
      />
    </div>
  );
}
