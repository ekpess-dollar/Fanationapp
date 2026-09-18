import { useState } from "react";
import { LANGUAGES, isLanguageSupported, translate, useAppStore, useT } from "@/lib/core";
import { RadioRow, SettingsNav } from "@/components/settings-nav";

type ThemeChoice = "light" | "dark" | "system";
const THEME_CHOICES: Array<[ThemeChoice, string]> = [
  ["light", "theme_light"], ["dark", "theme_dark"], ["system", "theme_system"],
];

export default function SettingsDisplayPage() {
  const S = useAppStore();
  const t = useT();
  const [language, setLanguage] = useState(S.language);
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>(S.theme);

  const pickTheme = (choice: ThemeChoice) => {
    setThemeChoice(choice);
    const resolved = choice === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : choice;
    S.setTheme(resolved);
  };

  const save = () => {
    if (!isLanguageSupported(language)) {
      const name = LANGUAGES.find((l) => l.code === language)?.name ?? language;
      S.toast(`${name} isn't available yet — the app will stay in ${LANGUAGES.find((l) => l.code === S.language)?.name}.`);
      return;
    }
    S.setLanguage(language);
    // The confirmation reads in the language just switched *to* — using the
    // `t` from this render would still say it in the old one, since the
    // store update above hasn't re-rendered this component yet.
    S.toast(translate(language, "language_updated"), "ok");
  };

  return (
    <div className="content" style={{ maxWidth: 980 }}>
      <div className="split" style={{ alignItems: "flex-start" }}>
        <SettingsNav />
        <div className="grow col gap16">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="up muted" style={{ padding: "14px 18px" }}>{t("language")}</div>
            <hr className="divider" />
            <div style={{ padding: "13px 18px" }}>
              <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="up muted" style={{ padding: "14px 18px" }}>{t("theme")}</div>
            <hr className="divider" />
            {THEME_CHOICES.map(([choice, key], i) => (
              <div key={choice}>
                <RadioRow label={t(key)} checked={themeChoice === choice} onChange={() => pickTheme(choice)} />
                {i < THEME_CHOICES.length - 1 && <hr className="divider" />}
              </div>
            ))}
          </div>

          <button className="btn btn-blue btn-sm" style={{ alignSelf: "flex-end" }} onClick={save}>
            {t("save_changes")}
          </button>
        </div>
      </div>
    </div>
  );
}
