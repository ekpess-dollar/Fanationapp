import { useState } from "react";
import { useAppStore } from "@/lib/core";
import { PasswordField } from "@/components/auth";
import { SettingsBack, SettingsNav } from "@/components/settings-nav";

export default function SettingsDeleteAccountPage() {
  const S = useAppStore();
  const [password, setPassword] = useState("");

  return (
    <div className="content" style={{ maxWidth: 980 }}>
      <div className="split" style={{ alignItems: "flex-start" }}>
        <SettingsNav />
        <div className="col gap16" style={{ maxWidth: 460, width: "100%" }}>
          <SettingsBack />
          <div className="t14" style={{ lineHeight: 1.6 }}>
            Deleting your account will permanently erase all data associated with it, including your
            email address, wallet balance, and uploaded content.
          </div>
          <div className="t14 b6">To continue, enter your account password.</div>
          <PasswordField value={password} onChange={setPassword} placeholder="Password" autoComplete="current-password" />
          <button className="btn btn-red" disabled={!password}
            onClick={() => S.toast("Account deletion requires email confirmation — check your inbox", "err")}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
