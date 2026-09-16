import { Link, useLocation } from "react-router-dom";
import { Icon } from "@/lib/ui";

const TABS: Array<[string, string]> = [
  ["/settings", "Account"],
  ["/settings/notifications", "Notifications"],
  ["/settings/display", "Display"],
  ["/settings/privacy", "Privacy and safety"],
];

/** The category rail every settings page shares — reuses `.navi`/`.navi.on`,
    the same active-row treatment the main sidebar already uses, so a second
    level of navigation doesn't need a second visual language. */
export function SettingsNav() {
  const { pathname } = useLocation();
  return (
    <div className="rail col gap4">
      <h2 className="display t26" style={{ marginBottom: 14 }}>Settings</h2>
      {TABS.map(([href, label]) => (
        <Link key={href} to={href} className={"navi" + (pathname === href ? " on" : "")}
          style={{ justifyContent: "space-between" }}>
          <span>{label}</span>
          <Icon n="chevronRight" s={15} c="var(--muted)" />
        </Link>
      ))}
    </div>
  );
}

/** A labelled row ending in a chevron — Security, Linked accounts, Safety.
    Every one of these opens a flow this prototype doesn't have yet, so like
    the rest of the app's not-built-yet links (AuthLegal's ToS/Privacy,
    Apple sign-in), it toasts instead of pretending to navigate. */
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

/** One option in a single-choice group — Language, Theme. */
export function RadioRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="row between hair" style={{ padding: "13px 18px", borderRadius: 12, cursor: "pointer" }} onClick={onChange}>
      <span className="t14 b6">{label}</span>
      <input type="radio" checked={checked} readOnly />
    </label>
  );
}
