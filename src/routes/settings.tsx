import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/core";
import { Icon } from "@/lib/ui";

const TOGGLES = [
  ["Push notifications", "Gifts, subs, and replies"],
  ["Email digests", "Weekly summary of your activity"],
  ["Live alerts", "When creators you follow go live"],
  ["Message previews", "Show content in notifications"],
  ["Blur sensitive media", "Until you tap to reveal"],
  ["Two-factor authentication", "Required for payouts"],
] as const;

export default function SettingsPage() {
  const S = useAppStore();
  const navigate = useNavigate();
  const [tg, setTg] = useState<Record<string, boolean>>({
    "Push notifications": true, "Email digests": false, "Live alerts": true,
    "Message previews": true, "Blur sensitive media": true, "Two-factor authentication": true,
  });
  return (
    <div className="content" style={{ maxWidth: 720 }}>
      <h2 className="display t32" style={{ marginBottom: 18 }}>Settings</h2>
      <div className="col gap16">
        <div className="card row between" style={{ padding: "14px 18px" }}>
          <span className="t14 b6">Appearance</span>
          <div className="row gap6">
            <span className={"tag" + (S.theme === "dark" ? " on" : "")} style={{ cursor: "pointer" }} onClick={() => S.setTheme("dark")}>
              <Icon n="moon" s={12} />Dark
            </span>
            <span className={"tag" + (S.theme === "light" ? " on" : "")} style={{ cursor: "pointer" }} onClick={() => S.setTheme("light")}>
              <Icon n="sun" s={12} />Light
            </span>
          </div>
        </div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="up muted" style={{ padding: "14px 18px" }}>Notifications &amp; privacy</div>
          <hr className="divider" />
          {TOGGLES.map(([k, sub], i) => (
            <div key={k}>
              <div className="row between" style={{ padding: "13px 18px" }}>
                <div className="col"><span className="t14 b6">{k}</span><span className="muted t12">{sub}</span></div>
                <div className={"sw" + (tg[k] ? " on" : "")} onClick={() => { setTg((o) => ({ ...o, [k]: !o[k] })); S.toast("Setting saved", "ok"); }} />
              </div>
              {i < TOGGLES.length - 1 && <hr className="divider" />}
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="up muted" style={{ padding: "14px 18px" }}>Account</div>
          <hr className="divider" />
          <div className="row gap12" style={{ padding: "14px 18px", cursor: "pointer" }}
            onClick={() => { S.setAuthed(false); navigate("/login"); }}>
            <Icon n="logout" s={17} c="var(--muted)" /><span className="t14 b6">Log out</span>
          </div>
          <hr className="divider" />
          <div className="row gap12" style={{ padding: "14px 18px", cursor: "pointer" }}
            onClick={() => S.toast("Account deletion requires email confirmation — check your inbox", "err")}>
            <Icon n="x" s={17} c="var(--coral-ink)" /><span className="t14 b6 coral">Delete account</span>
          </div>
        </div>
      </div>
    </div>
  );
}
