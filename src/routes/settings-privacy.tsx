import { useState } from "react";
import { useAppStore, useT } from "@/lib/core";
import { LinkRow, SettingsNav, ToggleRow } from "@/components/settings-nav";

const PROFILE_TOGGLES = [
  ["Show activity status", "Let others see when you were last active"],
  ["Show subscriber count on profile", ""],
  ["Show media count on profile", ""],
  ["Public following list", "Anyone can see who you follow"],
] as const;

const CONTENT_TOGGLES = [
  ["Allow comments only from paying subscribers", ""],
  ["Show tips total on posts", ""],
] as const;

export default function SettingsPrivacyPage() {
  const S = useAppStore();
  const t = useT();
  const [tg, setTg] = useState<Record<string, boolean>>({
    "Show activity status": true,
    "Show subscriber count on profile": true,
    "Show media count on profile": true,
    "Public following list": false,
    "Opt out of suggestions": false,
    "Allow comments only from paying subscribers": false,
    "Show tips total on posts": true,
  });
  const flip = (k: string) => setTg((o) => ({ ...o, [k]: !o[k] }));

  return (
    <div className="content" style={{ maxWidth: 980 }}>
      <div className="split" style={{ alignItems: "flex-start" }}>
        <SettingsNav />
        <div className="grow col gap16">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="up muted" style={{ padding: "14px 18px" }}>Profile</div>
            <hr className="divider" />
            {PROFILE_TOGGLES.map(([k, sub], i) => (
              <div key={k}>
                <ToggleRow label={k} sub={sub || undefined} on={tg[k]} onChange={() => flip(k)} />
                {i < PROFILE_TOGGLES.length - 1 && <hr className="divider" />}
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="up muted" style={{ padding: "14px 18px" }}>Discoverability</div>
            <hr className="divider" />
            <ToggleRow label="Opt out of suggestions" on={tg["Opt out of suggestions"]} onChange={() => flip("Opt out of suggestions")} />
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="up muted" style={{ padding: "14px 18px" }}>Content</div>
            <hr className="divider" />
            {CONTENT_TOGGLES.map(([k, sub], i) => (
              <div key={k}>
                <ToggleRow label={k} sub={sub || undefined} on={tg[k]} onChange={() => flip(k)} />
                {i < CONTENT_TOGGLES.length - 1 && <hr className="divider" />}
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="up muted" style={{ padding: "14px 18px" }}>Safety</div>
            <hr className="divider" />
            <LinkRow label="Blocked accounts" onClick={() => S.toast("Managing blocked accounts isn't available yet.")} />
          </div>

          <button className="btn btn-blue btn-sm" style={{ alignSelf: "flex-end" }}
            onClick={() => S.toast("Privacy settings saved", "ok")}>
            {t("save_changes")}
          </button>
        </div>
      </div>
    </div>
  );
}
