import { useState } from "react";
import { useAppStore } from "@/lib/core";
import { SettingsBack, SettingsNav } from "@/components/settings-nav";

interface Session { id: string; device: string; ip: string; location: string; active?: boolean; when?: string }

const SEED_SESSIONS: Session[] = [
  { id: "s1", device: "Chrome 130, macOS", ip: "102.88.82.27", location: "Lagos, Nigeria", active: true },
  { id: "s2", device: "Safari 17, iPhone", ip: "102.88.82.27", location: "Lagos, Nigeria", when: "2 days ago" },
  { id: "s3", device: "Edge 130, Windows 10", ip: "197.210.55.12", location: "Abuja, Nigeria", when: "1 week ago" },
];

export default function SettingsSessionsPage() {
  const S = useAppStore();
  const [sessions, setSessions] = useState(SEED_SESSIONS);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const anySelected = Object.values(selected).some(Boolean);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const closeSelected = () => {
    const n = Object.values(selected).filter(Boolean).length;
    setSessions((list) => list.filter((s) => !selected[s.id]));
    setSelected({});
    S.toast(n === 1 ? "Session closed" : `${n} sessions closed`, "ok");
  };

  return (
    <div className="content" style={{ maxWidth: 980 }}>
      <div className="split" style={{ alignItems: "flex-start" }}>
        <SettingsNav />
        <div className="grow col gap16">
          <div className="row between">
            <SettingsBack />
            <button className="btn btn-blue btn-sm" disabled={!anySelected} onClick={closeSelected}>
              Close session{Object.values(selected).filter(Boolean).length > 1 ? "s" : ""}
            </button>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {sessions.map((s, i) => (
              <div key={s.id}>
                <div className="row between" style={{ padding: "14px 18px", gap: 16 }}>
                  <label className="row gap12" style={{ cursor: "pointer" }}>
                    <input type="checkbox" checked={!!selected[s.id]} onChange={() => toggle(s.id)} />
                    <div className="col">
                      <span className="t14 b6">{s.device}</span>
                      <span className="muted t12">{s.ip} · {s.location}</span>
                    </div>
                  </label>
                  {s.active ? <span className="chip-mint">Active now</span> : <span className="muted t12">{s.when}</span>}
                </div>
                {i < sessions.length - 1 && <hr className="divider" />}
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="muted t13" style={{ padding: 18 }}>No other sessions.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
