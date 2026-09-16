import { useState } from "react";
import { useAppStore } from "@/lib/core";
import { SettingsNav, ToggleRow } from "@/components/settings-nav";

const TOGGLES = [
  ["Push notifications", "Gifts, subs, and replies"],
  ["Email digests", "Weekly summary of your activity"],
  ["Live alerts", "When creators you follow go live"],
  ["Message previews", "Show content in notifications"],
] as const;

export default function SettingsNotificationsPage() {
  const S = useAppStore();
  const [tg, setTg] = useState<Record<string, boolean>>({
    "Push notifications": true, "Email digests": false, "Live alerts": true, "Message previews": true,
  });

  return (
    <div className="content" style={{ maxWidth: 980 }}>
      <div className="split" style={{ alignItems: "flex-start" }}>
        <SettingsNav />
        <div className="grow col gap16">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {TOGGLES.map(([k, sub], i) => (
              <div key={k}>
                <ToggleRow label={k} sub={sub} on={tg[k]} onChange={() => setTg((o) => ({ ...o, [k]: !o[k] }))} />
                {i < TOGGLES.length - 1 && <hr className="divider" />}
              </div>
            ))}
          </div>
          <button className="btn btn-blue btn-sm" style={{ alignSelf: "flex-end" }}
            onClick={() => S.toast("Notification settings saved", "ok")}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
