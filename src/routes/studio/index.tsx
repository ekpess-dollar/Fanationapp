import { useNavigate } from "react-router-dom";
import { CREATORS, useAppStore } from "@/lib/core";
import { Avatar, Icon, StatCard, Verified } from "@/lib/ui";

const EARN = [1.2, 1.8, 1.5, 2.2, 2.6, 2.1, 3.0, 3.4, 2.9, 3.8, 4.1, 4.28];

export default function StudioDashboard() {
  const S = useAppStore();
  const navigate = useNavigate();
  const max = Math.max(...EARN);
  return (
    <div className="content">
      <div className="row between wrap" style={{ marginBottom: 20, gap: 12 }}>
        <div className="col gap4">
          <h2 className="display t32">Creator dashboard</h2>
          <span className="muted">Welcome back — here&apos;s how your community is doing.</span>
        </div>
        <div className="row gap10">
          <button className="btn btn-ghost btn-sm" onClick={() => S.toast("Showing last 30 days — range picker opens here")}>
            <Icon n="cal" s={15} />Last 30 days
          </button>
          <button className="btn btn-grad btn-sm" onClick={() => navigate("/studio/live")}><Icon n="live" s={15} />Go Live</button>
        </div>
      </div>
      <div className="grid g4 gap16" style={{ marginBottom: 18 }}>
        <StatCard label="Earnings (mo)" value="$4,280" sub="+18% vs last month" icon="dollar" color="var(--mint-ink)" />
        <StatCard label="Subscribers" value="8,412" sub="+214 this week" icon="users" color="var(--blue-ink)" />
        <StatCard label="Coins received" value="128K" sub="≈ $1,280" icon="coin" color="var(--amber-ink)" />
        <StatCard label="Profile views" value="42.6K" sub="+9% this week" icon="eye" />
      </div>
      <div className="grid gmain-15 gap16">
        <div className="card" style={{ padding: 18 }}>
          <div className="row between" style={{ marginBottom: 16 }}>
            <span className="b7">Earnings</span><span className="chip-mint">$28,940 this year</span>
          </div>
          <div className="row gap6" style={{ height: 150, alignItems: "flex-end" }}>
            {EARN.map((v, i) => (
              <div key={i} style={{ flex: 1, height: `${(v / max) * 100}%`, background: "var(--blue)", borderRadius: 6, opacity: 0.5 + 0.5 * (v / max) }} />
            ))}
          </div>
          <div className="row between muted t12" style={{ marginTop: 8 }}>
            {["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map((m) => <span key={m}>{m}</span>)}
          </div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="b7" style={{ marginBottom: 14 }}>Recent activity</div>
          {([["coin", "var(--amber-ink)", "@jay_88 sent 500 coins", "2m"], ["user", "var(--blue-ink)", "@superfan subscribed · $12/mo", "18m"], ["lock", "var(--coral-ink)", "PPV unlocked · +150 coins", "1h"], ["gift", "var(--mint-ink)", "$25 gift on live", "3h"]] as const).map((a, i) => (
            <div key={i} className="row gap12" style={{ padding: "9px 0" }}>
              <div className="feature-ic" style={{ width: 34, height: 34, background: "var(--fill)" }}>
                <span style={{ color: a[1] }}><Icon n={a[0]} s={16} /></span>
              </div>
              <div className="grow t14">{a[2]}</div>
              <span className="muted2 t12">{a[3]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ marginTop: 16, padding: 18 }}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <span className="b7">Creators you support</span>
          <span className="blue t13 b6" style={{ cursor: "pointer" }} onClick={() => navigate("/explore")}>Browse all</span>
        </div>
        <div className="row gap24 wrap">
          {CREATORS.slice(0, 5).map((c) => (
            <div key={c.id} className="row gap10" style={{ cursor: "pointer" }} onClick={() => navigate(`/creator/${c.handle}`)}>
              <Avatar name={c.name} size={38} />
              <div className="col">
                <div className="row gap4 t14 b6">{c.name.split(" ")[0]} {c.v && <Verified s={12} />}</div>
                <div className="muted t12">Supporting</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
