import { useParams } from "react-router-dom";
import { useAppStore } from "@/lib/core";
import { SettingsBack, SettingsNav } from "@/components/settings-nav";

const PROVIDER_NAMES: Record<string, string> = {
  tiktok: "TikTok",
  x: "X App",
  facebook: "Facebook",
  google: "Google",
};

/** One page behind all four "Linked accounts" rows — the connect flow is the
    same shape regardless of provider, so the provider is a route param
    instead of four near-identical files. */
export default function SettingsLinkAccountPage() {
  const { provider = "" } = useParams<{ provider: string }>();
  const S = useAppStore();
  const name = PROVIDER_NAMES[provider] ?? provider;

  return (
    <div className="content" style={{ maxWidth: 980 }}>
      <div className="split" style={{ alignItems: "flex-start" }}>
        <SettingsNav />
        <div className="col gap16" style={{ maxWidth: 420, width: "100%" }}>
          <SettingsBack />
          <button className="btn btn-blue btn-block"
            onClick={() => S.toast(`Connecting ${name} isn't available yet.`)}>
            Sign in to {name}
          </button>
        </div>
      </div>
    </div>
  );
}
