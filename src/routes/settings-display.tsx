import { useState } from "react";
import { useAppStore } from "@/lib/core";
import { RadioRow, SettingsNav } from "@/components/settings-nav";

const LANGUAGES = ["English", "French", "Spanish"];
type ThemeChoice = "light" | "dark" | "system";

export default function SettingsDisplayPage() {
  const S = useAppStore();
  const [language, setLanguage] = useState("English");
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>(S.theme);

  const pickTheme = (choice: ThemeChoice) => {
    setThemeChoice(choice);
    const resolved = choice === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : choice;
    S.setTheme(resolved);
  };

  const save = () => {
    if (language !== "English") {
      S.toast(`${language} isn't available yet — staying on English for now.`);
      return;
    }
    S.toast("Display settings saved", "ok");
  };

  return (
    <div className="content" style={{ maxWidth: 980 }}>
      <div className="split" style={{ alignItems: "flex-start" }}>
        <SettingsNav />
        <div className="grow col gap16">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="up muted" style={{ padding: "14px 18px" }}>Language</div>
            <hr className="divider" />
            {LANGUAGES.map((l, i, a) => (
              <div key={l}>
                <RadioRow label={l} checked={language === l} onChange={() => setLanguage(l)} />
                {i < a.length - 1 && <hr className="divider" />}
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="up muted" style={{ padding: "14px 18px" }}>Theme</div>
            <hr className="divider" />
            {(["light", "dark", "system"] as ThemeChoice[]).map((t, i) => (
              <div key={t}>
                <RadioRow label={t[0].toUpperCase() + t.slice(1)} checked={themeChoice === t} onChange={() => pickTheme(t)} />
                {i < 2 && <hr className="divider" />}
              </div>
            ))}
          </div>

          <button className="btn btn-blue btn-sm" style={{ alignSelf: "flex-end" }} onClick={save}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
