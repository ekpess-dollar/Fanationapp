import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/core";
import { SettingsBack, SettingsNav, ToggleRow } from "@/components/settings-nav";

const METHODS = [
  ["SMS", "A one-time code will be sent to your phone"],
  ["Email", "A one-time code will be sent to your email"],
  ["Face ID", "Works only on your mobile phone"],
  ["Authenticator App", "Connect your account with your 2FA app"],
] as const;

const TWO_FA_KEY = "345678987654";

export default function SettingsTwoFactorPage() {
  const navigate = useNavigate();
  const S = useAppStore();
  const [tg, setTg] = useState<Record<string, boolean>>({});
  const [code, setCode] = useState("");

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(TWO_FA_KEY);
      S.toast("2FA key copied", "ok");
    } catch {
      S.toast("Couldn't copy — select and copy the key manually", "err");
    }
  };

  const enable = () => {
    if (code.trim().length < 6) return;
    S.toast("Two-factor authentication enabled", "ok");
    navigate("/settings");
  };

  return (
    <div className="content" style={{ maxWidth: 980 }}>
      <div className="split" style={{ alignItems: "flex-start" }}>
        <SettingsNav />
        <div className="col gap16" style={{ maxWidth: 520, width: "100%" }}>
          <SettingsBack />

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {METHODS.map(([k, sub], i) => (
              <div key={k}>
                <ToggleRow label={k} sub={sub} on={!!tg[k]} onChange={() => setTg((o) => ({ ...o, [k]: !o[k] }))} />
                {i < METHODS.length - 1 && <hr className="divider" />}
              </div>
            ))}
          </div>

          <button className="btn btn-blue btn-block" onClick={copyKey}>
            2FA Key · {TWO_FA_KEY}
          </button>

          <div className="card" style={{ padding: 16 }}>
            <div className="b7 t14" style={{ marginBottom: 8 }}>Instructions</div>
            <ul className="muted t13" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
              <li>Copy your 2FA key and paste it into your 2FA app.</li>
              <li>Enter the generated code from your 2FA app in the field below.</li>
            </ul>
          </div>

          <input className="input" placeholder="Input code" value={code} maxLength={6}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />

          <button className="btn btn-blue" disabled={code.trim().length < 6} onClick={enable}>
            Set 2FA
          </button>
        </div>
      </div>
    </div>
  );
}
