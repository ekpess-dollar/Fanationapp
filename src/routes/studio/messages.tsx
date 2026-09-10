import { useState } from "react";
import { useAppStore } from "@/lib/core";
import { Icon } from "@/lib/ui";

const SEGS: Array<[string, number]> = [["All subscribers", 8412], ["VIP", 126], ["Top spenders", 126], ["Expiring", 38]];

export default function MassMessagingPage() {
  const S = useAppStore();
  const [seg, setSeg] = useState(0);
  const [txt, setTxt] = useState("");
  const [lock, setLock] = useState(false);
  const [hist, setHist] = useState<Array<[string, string, string, string]>>([
    ["New photo set is up 🔒", "VIP · locked 150 coins", "2,140 sent · 612 unlocked", "$918"],
    ["Live tonight at 8!", "All subscribers", "8,412 sent", ""],
    ["Weekend flash — 20% off", "Expiring", "38 sent · 12 renewed", ""],
  ]);
  const send = () => {
    const v = txt.trim();
    if (!v) return;
    const s = SEGS[seg];
    setHist((h) => [[v, s[0] + (lock ? " · locked 150 coins" : ""), `${s[1].toLocaleString()} queued · sending…`, ""], ...h]);
    setTxt("");
    setLock(false);
    S.toast(`Broadcast queued to ${s[1].toLocaleString()} fans`, "ok");
  };
  return (
    <div className="content" style={{ maxWidth: 820 }}>
      <h2 className="display t32" style={{ marginBottom: 6 }}>Mass messaging</h2>
      <p className="muted" style={{ marginBottom: 20 }}>Broadcast to a segment. Attach a locked message to earn.</p>
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="b7" style={{ marginBottom: 12 }}>New broadcast</div>
        <label className="label">Send to</label>
        <div className="row gap8 wrap" style={{ marginBottom: 14 }}>
          {SEGS.map((t, i) => (
            <span key={t[0]} className={"tag" + (seg === i ? " on" : "")} style={{ cursor: "pointer" }} onClick={() => setSeg(i)}>
              {t[0]} · {t[1].toLocaleString()}
            </span>
          ))}
        </div>
        <textarea className="input" rows={3} placeholder="Write your message…" value={txt}
          onChange={(e) => setTxt(e.target.value)} style={{ resize: "none", marginBottom: 12 }} />
        <div className="row between wrap gap12">
          <button className={"row gap6 t13 " + (lock ? "amber" : "muted")} onClick={() => setLock(!lock)}>
            <Icon n="lock" s={16} c={lock ? "var(--amber-ink)" : "var(--muted)"} />
            {lock ? "Locked · 150 coins ✓" : "Lock (PPV)"}
          </button>
          <button className="btn btn-blue" disabled={!txt.trim()} onClick={send}>
            Send to {SEGS[seg][1].toLocaleString()} fans
          </button>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="b7" style={{ padding: "14px 18px" }}>Recent broadcasts</div>
        <hr className="divider" />
        {hist.map((b, i) => (
          <div key={i}>
            <div className="row between" style={{ padding: "13px 18px", background: b[2].includes("sending") ? "rgba(37,153,246,.05)" : "" }}>
              <div className="grow">
                <div className="b6 t14">{b[0]}</div>
                <div className="muted t12">{b[1]} · {b[2]}</div>
              </div>
              {b[3] && <span className="chip-mint">{b[3]}</span>}
            </div>
            {i < hist.length - 1 && <hr className="divider" />}
          </div>
        ))}
      </div>
    </div>
  );
}
