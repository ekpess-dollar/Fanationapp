import { useState } from "react";
import { useAppStore } from "@/lib/core";
import { Icon, StatCard } from "@/lib/ui";

export default function PromosPage() {
  const S = useAppStore();
  const [on, setOn] = useState(true);
  const [links, setLinks] = useState(["fanation.app/t/you-7d"]);
  return (
    <div className="content">
      <h2 className="display t32" style={{ marginBottom: 18 }}>Promotions</h2>
      <div className="grid g3 gap16" style={{ marginBottom: 16 }}>
        <StatCard label="Trial claims" value="128" sub="this month" icon="gift" color="var(--coral-ink)" />
        <StatCard label="Trial → paid" value="42%" sub="conversion" icon="chart" color="var(--mint-ink)" />
        <StatCard label="Referrals" value="64" sub="via your link" icon="users" color="var(--blue-ink)" />
      </div>
      <div className="grid g2 gap16">
        <div className="card" style={{ padding: 18 }}>
          <div className="row between" style={{ marginBottom: 6 }}>
            <div className="b7">Free trial campaign</div>
            {on ? <span className="chip-mint">Active</span> : <span className="chip-coin">Paused</span>}
          </div>
          <div className="muted t13" style={{ marginBottom: 14 }}>Give new fans a 7-day free trial · 5 / 100 claims.</div>
          <button className="btn btn-ghost btn-block btn-sm" onClick={() => {
            setOn(!on);
            S.toast(on ? "Campaign paused — links stop granting trials" : "Campaign resumed", on ? "" : "ok");
          }}>{on ? "Pause campaign" : "Resume campaign"}</button>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="b7" style={{ marginBottom: 6 }}>Trial links</div>
          <div className="muted t13" style={{ marginBottom: 14 }}>Share a link that grants a free trial.</div>
          {links.map((l) => (
            <div key={l} className="row between hair" style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 10 }}>
              <span className="muted t13">{l}</span>
              <span style={{ cursor: "pointer" }} onClick={() => S.toast(`Link copied — ${l}`, "ok")}><Icon n="repost" s={16} c="var(--blue-ink)" /></span>
            </div>
          ))}
          <button className="btn btn-grad btn-block btn-sm" onClick={() => {
            if (links.length >= 3) { S.toast("Limit of 3 active trial links", "err"); return; }
            setLinks((x) => [...x, `fanation.app/t/you-7d-${x.length + 1}`]);
            S.toast("New trial link created", "ok");
          }}><Icon n="plus" s={15} />New trial link</button>
        </div>
      </div>
    </div>
  );
}
