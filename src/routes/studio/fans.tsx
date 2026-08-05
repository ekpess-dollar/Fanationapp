import { useState } from "react";
import { FAN_SEED, useAppStore } from "@/lib/core";
import { Avatar, Icon, Menu, StatCard } from "@/lib/ui";

const SEGS = ["All", "VIP", "Premium", "Basic", "Top spenders", "Expiring", "Expired"];

export default function FansPage() {
  const S = useAppStore();
  const [seg, setSeg] = useState("All");
  const match = (f: (typeof FAN_SEED)[number]) =>
    seg === "All" || f[2] === seg || (seg === "Top spenders" && f[5]) ||
    (seg === "Expiring" && f[4] === "Expiring") || (seg === "Expired" && f[4] === "Expired");
  const rows = FAN_SEED.filter(match);
  const stStyle = (st: string) =>
    st === "Active" ? { color: "var(--mint-ink)", borderColor: "rgba(93,221,144,.3)" }
      : st === "Expired" ? { color: "var(--coral-ink)", borderColor: "rgba(243,106,70,.3)" }
        : { color: "var(--amber-ink)", borderColor: "rgba(252,164,75,.3)" };
  return (
    <div className="content">
      <div className="row between wrap" style={{ marginBottom: 18, gap: 12 }}>
        <div className="col gap4">
          <h2 className="display t32">Fans</h2>
          <span className="muted">8,412 subscribers · 214 new this week</span>
        </div>
        <button className="btn btn-ghost" onClick={() => S.toast(`Segment exported — fans_${seg.toLowerCase().replace(/ /g, "_")}.csv`, "ok")}>
          <Icon n="chart" s={15} />Export
        </button>
      </div>
      <div className="grid g4 gap16" style={{ marginBottom: 18 }}>
        <StatCard label="Active" value="8,412" icon="users" color="var(--blue-ink)" />
        <StatCard label="New (wk)" value="214" icon="plus" color="var(--mint-ink)" />
        <StatCard label="Top spenders" value="126" icon="star" color="var(--amber-ink)" />
        <StatCard label="Expiring" value="38" icon="bell" color="var(--coral-ink)" />
      </div>
      <div className="row gap8 wrap" style={{ marginBottom: 16 }}>
        {SEGS.map((t) => <span key={t} className={"tag" + (seg === t ? " on" : "")} style={{ cursor: "pointer" }} onClick={() => setSeg(t)}>{t}</span>)}
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="row up muted" style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ flex: 2 }}>Fan</div><div style={{ flex: 1 }}>Tier</div><div style={{ flex: 1 }}>Lifetime</div>
          <div style={{ flex: 1 }}>Status</div><div style={{ flex: 1, textAlign: "right" }}>Action</div>
        </div>
        {rows.length === 0 && (
          <div className="col center gap6" style={{ padding: 36 }}>
            <div className="b7">No fans in "{seg}"</div><div className="muted t13">Try another segment.</div>
          </div>
        )}
        {rows.map((f, i) => (
          <div key={f[1]} className="row" style={{ padding: "13px 18px", borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none" }}>
            <div style={{ flex: 2 }} className="row gap12">
              <Avatar name={f[0]} size={36} />
              <div className="col"><span className="b6 t14">{f[0]}</span><span className="muted t12">@{f[1]}</span></div>
            </div>
            <div style={{ flex: 1 }}><span className="tag">{f[2]}</span></div>
            <div style={{ flex: 1 }} className="b6 t14 mint">{f[3]}</div>
            <div style={{ flex: 1 }}><span className="tag" style={stStyle(f[4])}>{f[4]}</span></div>
            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => S.toast(`Chat opened with @${f[1]}`)}><Icon n="msg" s={14} /></button>
              <Menu items={[
                { ic: "gift", t: "Send free trial", fn: () => S.toast(`7-day trial sent to @${f[1]}`, "ok") },
                { ic: "star", t: "Add to Top spenders", fn: () => S.toast(`@${f[1]} added to Top spenders`) },
                { ic: "shield", t: "Block fan", danger: true, fn: () => S.toast(`@${f[1]} blocked from your page`, "err") },
              ]} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
