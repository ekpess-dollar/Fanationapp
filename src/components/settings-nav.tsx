import { Link, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@/lib/ui";
import { useT } from "@/lib/core";

const TABS: Array<[string, string]> = [
  ["/settings", "settings_account"],
  ["/settings/notifications", "settings_notifications"],
  ["/settings/display", "settings_display"],
  ["/settings/privacy", "settings_privacy"],
];

/** The category rail every settings page shares — reuses `.navi`/`.navi.on`,
    the same active-row treatment the main sidebar already uses, so a second
    level of navigation doesn't need a second visual language. */
export function SettingsNav() {
  const { pathname } = useLocation();
  const t = useT();
  return (
    <div className="rail col gap4">
      <h2 className="display t26" style={{ marginBottom: 14 }}>{t("settings_title")}</h2>
      {TABS.map(([href, label]) => (
        <Link key={href} to={href} className={"navi" + (pathname === href ? " on" : "")}
          style={{ justifyContent: "space-between" }}>
          <span>{t(label)}</span>
          <Icon n="chevronRight" s={15} c="var(--muted)" />
        </Link>
      ))}
    </div>
  );
}

/** A labelled row ending in a chevron — Security, Linked accounts, Safety.
    Some open a real sub-page (change password, sessions); the ones that
    don't have one yet just toast, same as the rest of the app's
    not-built-yet links (AuthLegal's ToS/Privacy, Apple sign-in). */
export function LinkRow({ label, danger, onClick }: { label: string; danger?: boolean; onClick: () => void }) {
  return (
    <div className="row between" style={{ padding: "13px 18px", cursor: "pointer" }} onClick={onClick}>
      <span className={"t14 b6" + (danger ? " coral" : "")}>{label}</span>
      <Icon n="chevronRight" s={15} c={danger ? "var(--coral-ink)" : "var(--muted)"} />
    </div>
  );
}

/** A toggle with a title and, optionally, a line of explanation under it. */
export function ToggleRow({ label, sub, on, onChange }: { label: string; sub?: string; on: boolean; onChange: () => void }) {
  return (
    <div className="row between" style={{ padding: "13px 18px", gap: 16 }}>
      <div className="col" style={{ maxWidth: 460 }}>
        <span className="t14 b6">{label}</span>
        {sub && <span className="muted t12">{sub}</span>}
      </div>
      <div className={"sw" + (on ? " on" : "")} style={{ flex: "none" }} onClick={onChange} />
    </div>
  );
}

/** Every Account sub-page (change password, sessions, 2FA, linked accounts,
    delete account) opens in place of the row list, not as a separate route
    tree — this is the one way back to it. */
export function SettingsBack() {
  const navigate = useNavigate();
  const t = useT();
  return (
    <button className="btn btn-ghost btn-sm" style={{ marginBottom: 18 }} onClick={() => navigate("/settings")}>
      <span className="row" style={{ transform: "rotate(180deg)" }}><Icon n="arrow" s={15} /></span>
      {t("back")}
    </button>
  );
}

/** One option in a single-choice group — Language, Theme. */
export function RadioRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="row between hair" style={{ padding: "13px 18px", borderRadius: 12, cursor: "pointer" }} onClick={onChange}>
      <span className="t14 b6">{label}</span>
      <input type="radio" checked={checked} readOnly />
    </label>
  );
}
