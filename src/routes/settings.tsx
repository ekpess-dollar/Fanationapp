import { useState } from "react";
import { useAppStore } from "@/lib/core";
import { LinkRow, SettingsNav, ToggleRow } from "@/components/settings-nav";

export default function SettingsPage() {
  const S = useAppStore();
  const [twoFactor, setTwoFactor] = useState(true);

  const soon = (what: string) => () => S.toast(`${what} isn't available yet.`);

  return (
    <div className="content" style={{ maxWidth: 980 }}>
      <div className="split" style={{ alignItems: "flex-start" }}>
        <SettingsNav />
        <div className="grow col gap16">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="up muted" style={{ padding: "14px 18px" }}>Security</div>
            <hr className="divider" />
            <LinkRow label="Password" onClick={soon("Changing your password")} />
            <hr className="divider" />
            <LinkRow label="Login sessions" onClick={soon("Viewing login sessions")} />
            <hr className="divider" />
            <ToggleRow label="Two-factor authentication" sub="Required for payouts" on={twoFactor}
              onChange={() => { setTwoFactor((v) => !v); S.toast("Setting saved", "ok"); }} />
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="up muted" style={{ padding: "14px 18px" }}>Linked accounts</div>
            <hr className="divider" />
            {["TikTok", "X App", "Facebook", "Google"].map((s, i, a) => (
              <div key={s}>
                <LinkRow label={s} onClick={soon(`Linking ${s}`)} />
                {i < a.length - 1 && <hr className="divider" />}
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="up muted" style={{ padding: "14px 18px" }}>Account management</div>
            <hr className="divider" />
            <LinkRow label="Log out" onClick={() => S.openModal("logout")} />
            <hr className="divider" />
            <LinkRow label="Delete account" danger
              onClick={() => S.toast("Account deletion requires email confirmation — check your inbox", "err")} />
          </div>
        </div>
      </div>
    </div>
  );
}
