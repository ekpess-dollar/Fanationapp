import { useAppStore } from "@/lib/core";
import { Icon } from "@/lib/ui";

export default function EarningsPage() {
  const S = useAppStore();
  const rows: Array<[string, string, string, string]> = [
    ["Subscriptions", "$2,640", "62%", "var(--blue)"],
    ["Live gifts", "$980", "23%", "var(--amber)"],
    ["PPV & drops", "$430", "10%", "var(--coral)"],
    ["Tips", "$230", "5%", "var(--mint)"],
  ];
  return (
    <div className="content">
      <div className="row between wrap" style={{ marginBottom: 20, gap: 12 }}>
        <div className="col gap4">
          <h2 className="display t32">Earnings</h2>
          <span className="muted">Where your money comes from.</span>
        </div>
        <button className="btn btn-grad" onClick={() => S.openModal("payout")}><Icon n="dollar" s={16} />Withdraw $4,280</button>
      </div>
      <div className="grid grail-14 gap16">
        <div className="card" style={{ padding: 22 }}>
          <span className="up muted">Available balance</span>
          <div className="statnum mint" style={{ fontSize: 44, margin: "12px 0 4px" }}>$4,280.00</div>
          <div className="muted t13" style={{ marginBottom: 16 }}>Next auto-payout in 24h</div>
          <button className="btn btn-blue btn-block" onClick={() => S.openModal("payout")}>Withdraw now</button>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="b7" style={{ marginBottom: 16 }}>Revenue by source</div>
          {rows.map((s, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div className="row between t14" style={{ marginBottom: 6 }}>
                <span className="b6">{s[0]}</span>
                <span className="b7">{s[1]} <span className="muted t12">· {s[2]}</span></span>
              </div>
              <div className="progress"><i style={{ width: s[2], background: s[3] }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
