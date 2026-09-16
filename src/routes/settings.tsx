import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/core";
import { LinkRow, SettingsNav } from "@/components/settings-nav";

const PROVIDERS = [
  ["tiktok", "TikTok"],
  ["x", "X App"],
  ["facebook", "Facebook"],
  ["google", "Google"],
] as const;

export default function SettingsPage() {
  const S = useAppStore();
  const navigate = useNavigate();

  return (
    <div className="content" style={{ maxWidth: 980 }}>
      <div className="split" style={{ alignItems: "flex-start" }}>
        <SettingsNav />
        <div className="grow col gap16">
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
