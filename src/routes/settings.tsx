import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/core";
import { LinkRow, SettingsNav } from "@/components/settings-nav";

const PREF_CATS = [
  { id: "lifestyle",  label: "Lifestyle",    emoji: "🌿" },
  { id: "fitness",    label: "Fitness",      emoji: "💪" },
  { id: "travel",     label: "Travel",       emoji: "✈️" },
  { id: "beauty",     label: "Beauty",       emoji: "💄" },
  { id: "music",      label: "Music",        emoji: "🎵" },
  { id: "gaming",     label: "Gaming",       emoji: "🎮" },
  { id: "comedy",     label: "Comedy",       emoji: "😂" },
  { id: "art",        label: "Art",          emoji: "🎨" },
  { id: "tech",       label: "Tech",         emoji: "💻" },
  { id: "cooking",    label: "Cooking",      emoji: "🍳" },
  { id: "education",  label: "Education",    emoji: "📚" },
  { id: "dance",      label: "Dance",        emoji: "💃" },
  { id: "podcasts",   label: "Podcasts",     emoji: "🎙️" },
  { id: "live",       label: "Live Streams", emoji: "🔴" },
  { id: "fashion",    label: "Fashion",      emoji: "👗" },
  { id: "adult",      label: "Adult",        emoji: "🔞" },
];

const PROVIDERS = [
  ["tiktok", "TikTok"],
  ["x", "X App"],
  ["facebook", "Facebook"],
  ["google", "Google"],
] as const;

export default function SettingsPage() {
  const S = useAppStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>(S.preferences);
  const dirty = JSON.stringify(selected.slice().sort()) !== JSON.stringify(S.preferences.slice().sort());

  const toggleCat = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const savePrefs = () => {
    S.setPreferences(selected);
    S.toast("Content preferences saved", "ok");
  };

  return (
    <div className="content" style={{ maxWidth: 980 }}>
      <div className="split" style={{ alignItems: "flex-start" }}>
        <SettingsNav />
        <div className="grow col gap16">

          <div className="card" style={{ padding: 18 }}>
            <div className="up muted" style={{ marginBottom: 14 }}>Content preferences</div>
            <p className="muted t13" style={{ marginBottom: 16 }}>
              Choose the topics you're interested in. We use these to personalise your feed and surface creators you'll love.
            </p>
            <div className="grid gap8" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", marginBottom: 16 }}>
              {PREF_CATS.map((cat) => {
                const on = selected.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    className="row gap8"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      justifyContent: "flex-start",
                      background: on ? "var(--blue-a3)" : "var(--fill)",
                      border: `1.5px solid ${on ? "var(--blue)" : "transparent"}`,
                      fontWeight: on ? 600 : 400,
                      transition: "background .12s, border-color .12s",
                    }}
                    aria-pressed={on}
                    onClick={() => toggleCat(cat.id)}
                  >
                    <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>{cat.emoji}</span>
                    <span className="t13">{cat.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="row between" style={{ alignItems: "center" }}>
              <span className="muted t13" aria-live="polite">
                {selected.length > 0
                  ? `${selected.length} interest${selected.length === 1 ? "" : "s"} selected`
                  : "No interests selected — your feed will show popular content"}
              </span>
              <button
                className="btn btn-blue btn-sm"
                onClick={savePrefs}
                disabled={!dirty}
              >
                Save preferences
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="up muted" style={{ padding: "14px 18px" }}>Security</div>
            <hr className="divider" />
            <LinkRow label="Password" onClick={() => navigate("/settings/account/change-password")} />
            <hr className="divider" />
            <LinkRow label="Login sessions" onClick={() => navigate("/settings/account/login-sessions")} />
            <hr className="divider" />
            <LinkRow label="Two-factor authentication" onClick={() => navigate("/settings/account/two-factor")} />
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="up muted" style={{ padding: "14px 18px" }}>Linked accounts</div>
            <hr className="divider" />
            {PROVIDERS.map(([slug, label], i) => (
              <div key={slug}>
                <LinkRow label={label} onClick={() => navigate(`/settings/account/link/${slug}`)} />
                {i < PROVIDERS.length - 1 && <hr className="divider" />}
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="up muted" style={{ padding: "14px 18px" }}>Account management</div>
            <hr className="divider" />
            <LinkRow label="Log out" onClick={() => S.openModal("logout")} />
            <hr className="divider" />
            <LinkRow label="Delete account" danger onClick={() => navigate("/settings/account/delete-account")} />
          </div>
        </div>
      </div>
    </div>
  );
}
