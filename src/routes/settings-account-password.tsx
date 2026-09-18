import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PasswordField } from "@/components/auth";
import { SettingsBack, SettingsNav } from "@/components/settings-nav";
import { useAppStore } from "@/lib/core";

export default function SettingsPasswordPage() {
  const navigate = useNavigate();
  const S = useAppStore();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const mismatch = confirm.length > 0 && next !== confirm;
  const canSave = current.length > 0 && next.length >= 8 && next === confirm;

  const save = () => {
    if (!canSave) return;
    S.toast("Password changed", "ok");
    navigate("/settings");
  };

  return (
    <div className="content" style={{ maxWidth: 980 }}>
      <div className="split" style={{ alignItems: "flex-start" }}>
        <SettingsNav />
        <div className="col gap12" style={{ maxWidth: 420, width: "100%" }}>
          <SettingsBack />
          <PasswordField id="current-password" value={current} onChange={setCurrent}
            placeholder="Current password" autoComplete="current-password" />
          <PasswordField id="new-password" value={next} onChange={setNext}
            placeholder="New password" autoComplete="new-password" />
          <PasswordField id="confirm-password" value={confirm} onChange={setConfirm}
            placeholder="Confirm new password" autoComplete="new-password" />
          {mismatch && <div className="coral t12">Passwords don&apos;t match</div>}
          <button className="btn btn-blue" style={{ marginTop: 6 }} disabled={!canSave} onClick={save}>
            Save password
          </button>
        </div>
      </div>
    </div>
  );
}
